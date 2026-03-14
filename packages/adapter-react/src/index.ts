import {
  createElement,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  type ComponentType,
} from "react";
import { createRoot, type Root } from "react-dom/client";
import { createHorizon, navigateTo, eventBus } from "horizon-mfe";
import type { AppProps, CreateHorizonOptions } from "horizon-mfe";

export type { IEventBus, AppProps, CreateHorizonOptions } from "horizon-mfe";

// ─── Internal context ─────────────────────────────────────────────────────────

/**
 * Provides Horizon's AppProps (including eventBus) to all hooks inside a
 * Horizon-mounted React component tree. Set automatically by defineApp().
 */
const HorizonContext = createContext<AppProps | null>(null);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DefineAppOptions<P = Record<string, unknown>> {
  /**
   * Called once before the first mount.
   * Use for global setup (analytics init, i18n load, etc.)
   */
  onBootstrap?: () => Promise<void>;
  /**
   * Called right after the React root is rendered.
   */
  onMount?: (props: AppProps) => void;
  /**
   * Called right after unmount.
   */
  onUnmount?: () => void;
  /**
   * Called when the app is hidden by keep-alive (route away).
   * The React root and all state are preserved — use this to pause timers, etc.
   */
  onPause?: (props: AppProps) => void;
  /**
   * Called when the app is shown again by keep-alive (route back).
   */
  onResume?: (props: AppProps) => void;
  /**
   * Transform Horizon props before passing them to the root component.
   * By default all props are passed as-is.
   */
  mapProps?: (props: AppProps) => P;
}

// ─── defineApp ────────────────────────────────────────────────────────────────

/**
 * Register a React component as a Horizon micro-frontend.
 *
 * The child app needs **zero knowledge of Horizon** — just call this once:
 *
 * ```tsx
 * // src/main.tsx
 * import { defineApp } from 'horizon-mfe/react'
 * import App from './App'
 *
 * defineApp(App)
 * ```
 *
 * Inside any component, use `useSharedState` to sync state across micro-frontends:
 * ```tsx
 * import { useSharedState } from 'horizon-mfe/react'
 * const [count, setCount] = useSharedState<number>('count', 0)
 * ```
 */
export function defineApp<P = Record<string, unknown>>(
  RootComponent: ComponentType<P>,
  options: DefineAppOptions<P> = {},
): void {
  const { onBootstrap, onMount, onUnmount, onPause, onResume, mapProps } =
    options;
  let root: Root | null = null;

  window.__HORIZON_LIFECYCLE__ = {
    async bootstrap() {
      await onBootstrap?.();
    },

    async mount(props: AppProps) {
      const componentProps = mapProps
        ? mapProps(props)
        : (props as unknown as P);

      root = createRoot(props.container);
      root.render(
        createElement(
          HorizonContext.Provider,
          { value: props },
          createElement(
            RootComponent as ComponentType<unknown>,
            componentProps as Record<string, unknown>,
          ),
        ),
      );
      onMount?.(props);
    },

    async unmount() {
      root?.unmount();
      root = null;
      onUnmount?.();
    },

    async onPause(props: AppProps) {
      onPause?.(props);
    },

    async onResume(props: AppProps) {
      // Notify child components so they can sync their router (e.g. BrowserRouter)
      // with the host URL. pushState doesn't fire popstate, so framework routers
      // won't pick up the host-initiated navigation automatically.
      window.dispatchEvent(
        new CustomEvent("horizon:app:resume", {
          detail: { pathname: window.location.pathname },
        }),
      );
      onResume?.(props);
    },
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Sync a shared value across all micro-frontends via the Horizon event bus.
 *
 * - Reads the current value from the shared store on first render.
 * - Subscribes to updates from other apps automatically.
 * - Calls `eventBus.setState(key, next)` when the setter is invoked,
 *   which emits `"store:<key>"` so every app (including the host) stays in sync.
 *
 * ```tsx
 * import { useSharedState } from 'horizon-mfe/react'
 *
 * function Counter() {
 *   const [count, setCount] = useSharedState<number>('count', 0)
 *   return <button onClick={() => setCount(count + 1)}>{count}</button>
 * }
 * ```
 */
export function useSharedState<T>(
  key: string,
  defaultValue: T,
): [T, (next: T) => void] {
  const ctx = useContext(HorizonContext);
  if (!ctx) {
    throw new Error(
      "[horizon] useSharedState must be called inside a component mounted by defineApp()",
    );
  }
  const { eventBus } = ctx;

  const [value, setValue] = useState<T>(
    () => eventBus.getState<T>(key) ?? defaultValue,
  );

  useEffect(() => {
    return eventBus.on<T>(`store:${key}`, setValue);
  }, [eventBus, key]);

  const set = useCallback(
    (next: T) => {
      eventBus.setState(key, next);
    },
    [eventBus, key],
  );

  return [value, set];
}

// ─── Router sync hook ─────────────────────────────────────────────────────────

/**
 * Sync a framework router (React Router, TanStack Router, …) with the Horizon
 * host URL when the app is resumed from keep-alive.
 *
 * Call this inside any component that lives **inside** the router's Provider,
 * passing the router's imperative `navigate` function:
 *
 * ```tsx
 * import { useRouteSync } from 'horizon-mfe/react'
 * import { useNavigate } from 'react-router-dom'
 *
 * function RouterSync() {
 *   useRouteSync(useNavigate())
 *   return null
 * }
 * ```
 *
 * Then render `<RouterSync />` as a sibling of your `<Routes>` inside `<BrowserRouter>`.
 */
export function useRouteSync(navigate: (path: string) => void): void {
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    const handler = (e: Event) => {
      const pathname = (e as CustomEvent<{ pathname: string }>).detail
        ?.pathname;
      if (pathname != null) navigateRef.current(pathname);
    };
    window.addEventListener("horizon:app:resume", handler);
    return () => window.removeEventListener("horizon:app:resume", handler);
  }, []);
}

// ─── Host hooks ───────────────────────────────────────────────────────────────

/**
 * Use in a **React host app** to bootstrap Horizon and get pathname + navigate.
 * Call once at the root of your host (e.g. in App). Registers apps and starts
 * the router; pathname updates on every route change so you can drive nav UI.
 *
 * ```tsx
 * import { useHorizonHost, useHostSharedState } from 'horizon-mfe/react'
 *
 * function App() {
 *   const { pathname, navigate } = useHorizonHost({
 *     container: '#app-container',
 *     keepAlive: true,
 *     apps: [
 *       { name: 'child-react', entry: 'http://localhost:3002', route: '/react' },
 *     ],
 *   })
 *   const [count] = useHostSharedState<number>('count', 0)
 *   return (
 *     <>
 *       <nav>
 *         <a className={pathname === '/react' ? 'active' : ''} onClick={() => navigate('/react')}>React</a>
 *       </nav>
 *       <div id="app-container" />
 *     </>
 *   )
 * }
 * ```
 */
export function useHorizonHost(options: CreateHorizonOptions): {
  pathname: string;
  navigate: (path: string) => void;
} {
  const [pathname, setPathname] = useState(() =>
    typeof window !== "undefined" ? window.location.pathname : "/",
  );
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    createHorizon({
      ...options,
      onRouteChange: () => setPathname(window.location.pathname),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- run once on mount

  return { pathname, navigate: navigateTo };
}

/**
 * Use in a **React host app** to read (and optionally set) shared state from the
 * Horizon event bus. Same store as child apps' useSharedState — use the same key
 * to sync (e.g. "count").
 *
 * ```tsx
 * const [count] = useHostSharedState<number>('count', 0)
 * return <span>Count: {count}</span>
 * ```
 */
export function useHostSharedState<T>(
  key: string,
  defaultValue: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(
    () => eventBus.getState<T>(key) ?? defaultValue,
  );

  useEffect(() => {
    return eventBus.on<T>(`store:${key}`, setValue);
  }, [key]);

  const set = useCallback(
    (next: T) => {
      eventBus.setState(key, next);
    },
    [key],
  );

  return [value, set];
}

// ─── Global type augmentation ─────────────────────────────────────────────────

declare global {
  interface Window {
    __HORIZON_LIFECYCLE__: {
      bootstrap?: () => Promise<void>;
      mount: (props: AppProps) => Promise<void>;
      unmount: (props: AppProps) => Promise<void>;
      onPause?: (props: AppProps) => Promise<void>;
      onResume?: (props: AppProps) => Promise<void>;
    };
  }
}
