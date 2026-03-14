import { writable, type Writable } from "svelte/store";
import type { AppProps, CreateHorizonOptions, IEventBus } from "horizon-mfe";
import { createHorizon, navigateTo, eventBus } from "horizon-mfe";

export type { IEventBus, AppProps, CreateHorizonOptions } from "horizon-mfe";

// ─── Current props (set on mount, cleared on unmount) ─────────────────────────

let currentProps: AppProps | null = null;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DefineAppOptions {
  onBootstrap?: () => Promise<void>;
  onMount?: (props: AppProps) => void;
  onUnmount?: () => void;
  onPause?: (props: AppProps) => void;
  onResume?: (props: AppProps) => void;
}

// ─── defineApp ────────────────────────────────────────────────────────────────

/**
 * Register a Svelte component as a Horizon micro-frontend.
 *
 * ```svelte
 * <!-- src/main.ts -->
 * <script>
 *   import { defineApp } from 'horizon-mfe/svelte'
 *   import App from './App.svelte'
 *   defineApp(App)
 * </script>
 * ```
 *
 * Inside any component, use `useSharedState` to sync state across micro-frontends.
 */
/** Svelte 4 component constructor: new Component({ target, props }) with $destroy() */
type SvelteComponentConstructor = new (opts: {
  target: HTMLElement;
  props?: Record<string, unknown>;
}) => { $destroy: () => void };

export function defineApp(
  RootComponent: SvelteComponentConstructor,
  options: DefineAppOptions = {},
): void {
  const { onBootstrap, onMount, onUnmount, onPause, onResume } = options;
  let instance: { $destroy: () => void } | null = null;

  window.__HORIZON_LIFECYCLE__ = {
    async bootstrap() {
      await onBootstrap?.();
    },

    async mount(props: AppProps) {
      currentProps = props;
      instance = new RootComponent({
        target: props.container,
        props: {},
      });
      onMount?.(props);
    },

    async unmount() {
      instance?.$destroy();
      instance = null;
      currentProps = null;
      onUnmount?.();
    },

    async onPause(props: AppProps) {
      onPause?.(props);
    },

    async onResume(props: AppProps) {
      window.dispatchEvent(
        new CustomEvent("horizon:app:resume", {
          detail: { pathname: window.location.pathname },
        }),
      );
      onResume?.(props);
    },
  };
}

// ─── useSharedState ───────────────────────────────────────────────────────────

/**
 * Sync a shared value across all micro-frontends via the Horizon event bus.
 * Returns a Svelte writable store.
 *
 * ```svelte
 * <script>
 *   import { useSharedState } from 'horizon-mfe/svelte'
 *   const count = useSharedState('count', 0)
 * </script>
 * <button on:click={() => $count += 1}>{$count}</button>
 * ```
 */
export function useSharedState<T>(
  key: string,
  defaultValue: T,
): ReturnType<typeof writable<T>> {
  if (!currentProps) {
    throw new Error(
      "[horizon] useSharedState must be called inside a component mounted by defineApp()",
    );
  }
  const bus = currentProps.eventBus as IEventBus;
  const store = writable<T>(bus.getState<T>(key) ?? defaultValue);
  const origSet = store.set;
  // When bus emits (e.g. from another app), update store without re-calling setState to avoid loop
  const unsubBus = bus.on<T>(`store:${key}`, (v) =>
    (origSet as (value: T) => void).call(store, v as T),
  );
  const origSubscribe = store.subscribe;
  (
    store as Writable<T> & {
      subscribe: (run: (value: T) => void) => () => void;
    }
  ).subscribe = (run) => {
    const u = (
      origSubscribe as (this: unknown, run: (value: T) => void) => () => void
    ).call(store, run);
    return () => {
      u();
      unsubBus();
    };
  };
  (store as { set: (value: T) => void }).set = (next: T) =>
    bus.setState(key, next);
  return store;
}

// ─── Host: useHorizonHost & useHostSharedState ─────────────────────────────────

/**
 * Use in a **Svelte host app** to bootstrap Horizon and get pathname + navigate.
 * Call once at the root (e.g. App.svelte).
 */
let hostStarted = false;

export function useHorizonHost(options: CreateHorizonOptions): {
  pathname: ReturnType<typeof writable<string>>;
  navigate: (path: string) => void;
} {
  const pathname = writable(
    typeof window !== "undefined" ? window.location.pathname : "/",
  );
  if (!hostStarted) {
    hostStarted = true;
    createHorizon({
      ...options,
      onRouteChange: () => pathname.set(window.location.pathname),
    });
  }
  return { pathname, navigate: navigateTo };
}

/**
 * Use in a **Svelte host app** to read/write shared state from the Horizon event bus.
 */
export function useHostSharedState<T>(
  key: string,
  defaultValue: T,
): ReturnType<typeof writable<T>> {
  const store = writable<T>(eventBus.getState<T>(key) ?? defaultValue);
  eventBus.on<T>(`store:${key}`, (v) => store.set(v as T));
  (store as { set: (value: T) => void }).set = (next: T) =>
    eventBus.setState(key, next);
  return store;
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
