import {
  createApp,
  ref,
  inject,
  onMounted,
  onUnmounted,
  type App as VueApp,
  type Component,
  type InjectionKey,
  type Ref,
} from "vue";
import { createHorizon, navigateTo, eventBus } from "horizon-mfe";
import type { AppProps, CreateHorizonOptions } from "horizon-mfe";

export type { IEventBus, AppProps, CreateHorizonOptions } from "horizon-mfe";

// ─── Injection key — child components can inject Horizon props ────────────────

export const HorizonPropsKey: InjectionKey<AppProps> = Symbol("horizon-props");

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DefineAppOptions {
  onBootstrap?: () => Promise<void>;
  /**
   * Called after the Vue app instance is created but before it is mounted.
   * Use this to install plugins (e.g. `app.use(router)`).
   */
  setup?: (app: VueApp, props: AppProps) => void;
  onMount?: (props: AppProps) => void;
  onUnmount?: () => void;
  /** Called when the app is hidden by keep-alive. State is preserved. */
  onPause?: (props: AppProps) => void;
  /** Called when the app is shown again by keep-alive. */
  onResume?: (props: AppProps) => void;
}

// ─── defineApp ────────────────────────────────────────────────────────────────

/**
 * Register a Vue 3 component as a Horizon micro-frontend.
 *
 * ```ts
 * // src/main.ts
 * import { defineApp } from 'horizon-mfe/vue'
 * import App from './App.vue'
 *
 * defineApp(App)
 * ```
 *
 * Inside any component, use `useSharedState` to sync state across micro-frontends:
 * ```ts
 * import { useSharedState } from 'horizon-mfe/vue'
 * const [count, setCount] = useSharedState<number>('count', 0)
 * ```
 */
export function defineApp(
  RootComponent: Component,
  options: DefineAppOptions = {},
): void {
  const { onBootstrap, setup, onMount, onUnmount, onPause, onResume } = options;
  let app: VueApp | null = null;

  window.__HORIZON_LIFECYCLE__ = {
    async bootstrap() {
      await onBootstrap?.();
    },

    async mount(props: AppProps) {
      app = createApp(RootComponent);
      // Provide Horizon props so any child component can inject them
      app.provide(HorizonPropsKey, props);
      // Allow the caller to install plugins (router, pinia, etc.) before mount
      setup?.(app, props);
      app.mount(props.container);
      onMount?.(props);
    },

    async unmount() {
      app?.unmount();
      app = null;
      onUnmount?.();
    },

    async onPause(props: AppProps) {
      onPause?.(props);
    },

    async onResume(props: AppProps) {
      // Notify child components so they can sync their router (e.g. Vue Router)
      // with the host URL on resume.
      window.dispatchEvent(
        new CustomEvent("horizon:app:resume", {
          detail: { pathname: window.location.pathname },
        }),
      );
      onResume?.(props);
    },
  };
}

// ─── Composables ──────────────────────────────────────────────────────────────

/**
 * Sync a shared value across all micro-frontends via the Horizon event bus.
 *
 * - Reads the current value from the shared store on first render.
 * - Subscribes to updates from other apps automatically.
 * - Calls `eventBus.setState(key, next)` when the setter is invoked,
 *   which emits `"store:<key>"` so every app (including the host) stays in sync.
 *
 * ```ts
 * import { useSharedState } from 'horizon-mfe/vue'
 *
 * const [count, setCount] = useSharedState<number>('count', 0)
 * ```
 */
export function useSharedState<T>(
  key: string,
  defaultValue: T,
): [Ref<T>, (next: T) => void] {
  const ctx = inject(HorizonPropsKey);
  if (!ctx) {
    throw new Error(
      "[horizon] useSharedState must be called inside a component mounted by defineApp()",
    );
  }
  const { eventBus } = ctx;

  const value = ref<T>(eventBus.getState<T>(key) ?? defaultValue) as Ref<T>;

  const unsubscribe = eventBus.on<T>(`store:${key}`, (v) => {
    value.value = v as T;
  });
  onUnmounted(unsubscribe);

  function set(next: T) {
    eventBus.setState(key, next);
  }

  return [value, set];
}

// ─── Host composables ─────────────────────────────────────────────────────────

let hostStarted = false;

/**
 * Use in a **Vue host app** to bootstrap Horizon and get pathname + navigate.
 * Call once at the root of your host. Registers apps and starts the router;
 * pathname updates on every route change so you can drive nav UI.
 *
 * ```ts
 * import { useHorizonHost, useHostSharedState } from 'horizon-mfe/vue'
 *
 * const { pathname, navigate } = useHorizonHost({
 *   container: '#app-container',
 *   keepAlive: true,
 *   apps: [{ name: 'child-vue', entry: 'http://localhost:3003', route: '/vue' }],
 * })
 * const [count] = useHostSharedState<number>('count', 0)
 * ```
 */
export function useHorizonHost(options: CreateHorizonOptions): {
  pathname: Ref<string>;
  navigate: (path: string) => void;
} {
  const pathname = ref(
    typeof window !== "undefined" ? window.location.pathname : "/",
  );

  onMounted(() => {
    if (hostStarted) return;
    hostStarted = true;
    createHorizon({
      ...options,
      onRouteChange: () => {
        pathname.value = window.location.pathname;
      },
    });
  });

  return { pathname, navigate: navigateTo };
}

/**
 * Use in a **Vue host app** to read (and optionally set) shared state from the
 * Horizon event bus. Same store as child apps' useSharedState.
 *
 * ```ts
 * const [count] = useHostSharedState<number>('count', 0)
 * ```
 */
export function useHostSharedState<T>(
  key: string,
  defaultValue: T,
): [Ref<T>, (next: T) => void] {
  const value = ref<T>(eventBus.getState<T>(key) ?? defaultValue) as Ref<T>;

  const unsubscribe = eventBus.on<T>(`store:${key}`, (v) => {
    value.value = v as T;
  });
  onUnmounted(unsubscribe);

  function set(next: T) {
    eventBus.setState(key, next);
  }

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
