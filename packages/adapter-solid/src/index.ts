import {
  createComponent,
  createContext,
  createSignal,
  onCleanup,
  useContext,
  type Accessor,
  type Component,
} from "solid-js";
import { render } from "solid-js/web";
import type { AppProps, IEventBus } from "horizon-mfe";

export type { IEventBus, AppProps, CreateHorizonOptions } from "horizon-mfe";

// ─── Internal context ─────────────────────────────────────────────────────────

const HorizonContext = createContext<AppProps | null>(null);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DefineAppOptions {
  onBootstrap?: () => Promise<void>;
  onMount?: (props: AppProps) => void;
  onUnmount?: () => void;
  /** Called when the app is hidden by keep-alive. State is preserved. */
  onPause?: (props: AppProps) => void;
  /** Called when the app is shown again by keep-alive. */
  onResume?: (props: AppProps) => void;
}

// ─── defineApp ────────────────────────────────────────────────────────────────

/**
 * Register a Solid component as a Horizon micro-frontend.
 *
 * ```ts
 * // src/main.tsx
 * import { defineApp } from 'horizon-mfe/solid'
 * import App from './App'
 *
 * defineApp(App)
 * ```
 *
 * Inside any component, use `useSharedState` to sync state across micro-frontends:
 * ```ts
 * import { useSharedState } from 'horizon-mfe/solid'
 * const [count, setCount] = useSharedState<number>('count', 0)
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineApp(
  RootComponent: Component<any>,
  options: DefineAppOptions = {},
): void {
  const { onBootstrap, onMount, onUnmount, onPause, onResume } = options;
  let dispose: (() => void) | null = null;

  window.__HORIZON_LIFECYCLE__ = {
    async bootstrap() {
      await onBootstrap?.();
    },

    async mount(props: AppProps) {
      dispose = render(
        () =>
          createComponent(HorizonContext.Provider, {
            value: props,
            get children() {
              return createComponent(RootComponent, {});
            },
          }),
        props.container,
      );
      onMount?.(props);
    },

    async unmount() {
      dispose?.();
      dispose = null;
      onUnmount?.();
    },

    async onPause(props: AppProps) {
      onPause?.(props);
    },

    async onResume(props: AppProps) {
      onResume?.(props);
    },
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useHorizonContext(): AppProps {
  const ctx = useContext(HorizonContext);
  if (!ctx) {
    throw new Error(
      "[horizon] useSharedState must be called inside a component mounted by defineApp()",
    );
  }
  return ctx;
}

/**
 * Sync a shared value across all micro-frontends via the Horizon event bus.
 *
 * Returns a Solid signal accessor and setter:
 * ```ts
 * const [count, setCount] = useSharedState<number>('count', 0)
 * return <div>{count()}</div>  // call count() to read the signal
 * ```
 */
export function useSharedState<T>(
  key: string,
  defaultValue: T,
): [Accessor<T>, (next: T) => void] {
  const { eventBus } = useHorizonContext();

  const [value, setValue] = createSignal<T>(
    (eventBus as IEventBus).getState<T>(key) ?? defaultValue,
  );

  const unsubscribe = (eventBus as IEventBus).on<T>(`store:${key}`, (v) => {
    // Use updater form to correctly handle function-typed T values
    setValue(() => v as T);
  });
  onCleanup(unsubscribe);

  function set(next: T): void {
    (eventBus as IEventBus).setState(key, next);
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
