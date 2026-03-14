import type { AppProps, CreateHorizonOptions, IEventBus } from "horizon-mfe";
import { createHorizon, navigateTo, eventBus } from "horizon-mfe";

export type { IEventBus, AppProps, CreateHorizonOptions } from "horizon-mfe";

// ─── Current props (set on mount, cleared on unmount) ─────────────────────────

let currentProps: AppProps | null = null;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DefineAppLifecycle {
  mount: (props: AppProps) => void | Promise<void>;
  unmount: () => void | Promise<void>;
  onBootstrap?: () => void | Promise<void>;
  onPause?: (props: AppProps) => void | Promise<void>;
  onResume?: (props: AppProps) => void | Promise<void>;
}

// ─── defineApp ────────────────────────────────────────────────────────────────

/**
 * Register a custom lifecycle (e.g. Ember Application.visit / destroy) as a Horizon micro-frontend.
 *
 * ```ts
 * import { defineApp } from 'horizon-mfe/ember'
 *
 * defineApp({
 *   async mount(props) {
 *     await app.visit('/', { rootElement: props.container })
 *   },
 *   unmount() {
 *     app.destroy()
 *   },
 * })
 * ```
 *
 * For a vanilla or custom UI, use useSharedState to sync state with other apps.
 */
export function defineApp(lifecycle: DefineAppLifecycle): void {
  const { mount, unmount, onBootstrap, onPause, onResume } = lifecycle;

  window.__HORIZON_LIFECYCLE__ = {
    async bootstrap() {
      await onBootstrap?.();
    },

    async mount(props: AppProps) {
      currentProps = props;
      await mount(props);
    },

    async unmount() {
      await unmount();
      currentProps = null;
    },

    async onPause(props: AppProps) {
      await onPause?.(props);
    },

    async onResume(props: AppProps) {
      window.dispatchEvent(
        new CustomEvent("horizon:app:resume", {
          detail: { pathname: window.location.pathname },
        }),
      );
      await onResume?.(props);
    },
  };
}

// ─── useSharedState ───────────────────────────────────────────────────────────

/**
 * Sync a shared value with other micro-frontends via the Horizon event bus.
 * Call from code that runs after mount (e.g. inside your Ember app or custom UI).
 *
 * Returns [getter, setter] for the shared value.
 */
export function useSharedState<T>(
  key: string,
  defaultValue: T,
): [() => T, (value: T) => void] {
  if (!currentProps) {
    throw new Error(
      "[horizon] useSharedState must be used after mount (e.g. inside your app)",
    );
  }
  const bus = currentProps.eventBus as IEventBus;
  let value = bus.getState<T>(key) ?? defaultValue;
  const unsub = bus.on<T>(`store:${key}`, (v) => {
    value = v as T;
  });
  return [
    () => value,
    (next: T) => {
      value = next;
      bus.setState(key, next);
    },
  ];
}

// ─── Host helpers ────────────────────────────────────────────────────────────

/**
 * Use in a host app to bootstrap Horizon (e.g. from Ember route or component).
 */
export function useHorizonHost(options: CreateHorizonOptions): {
  pathname: () => string;
  navigate: (path: string) => void;
} {
  let pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  let started = false;
  if (!started) {
    started = true;
    createHorizon({
      ...options,
      onRouteChange: () => {
        pathname = window.location.pathname;
      },
    });
  }
  return {
    pathname: () => pathname,
    navigate: navigateTo,
  };
}

/**
 * Use in a host app to read/write shared state.
 */
export function useHostSharedState<T>(
  key: string,
  defaultValue: T,
): [() => T, (value: T) => void] {
  let value = eventBus.getState<T>(key) ?? defaultValue;
  eventBus.on<T>(`store:${key}`, (v) => {
    value = v as T;
  });
  return [() => value, (next: T) => eventBus.setState(key, next)];
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
