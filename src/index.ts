/**
 * Horizon — A simple micro-frontend framework
 *
 * Quick start (new simplified API):
 *
 * ```ts
 * import { createHorizon } from 'horizon-mfe'
 *
 * createHorizon({
 *   apps: [
 *     { name: 'cart', entry: 'http://localhost:3001', route: '/cart', keepAlive: true },
 *   ],
 *   onMount: async (app) => console.log('mounted', app.name),
 * })
 * ```
 *
 * Or using the classic API (still fully supported):
 *
 * ```ts
 * import { registerApp, start } from 'horizon-mfe'
 *
 * registerApp({ name: 'cart', entry: 'http://localhost:3001', activeRule: '/cart' })
 * start()
 * ```
 *
 * Child app (any framework):
 *
 * ```ts
 * window.__HORIZON_LIFECYCLE__ = {
 *   async mount({ container }) { render(<App />, container) },
 *   async unmount({ container }) { unmountComponentAtNode(container) },
 * }
 * ```
 */

export type {
  AppConfig,
  AppConfigResolved,
  AppEntry,
  ActiveRule,
  AppLifecycles,
  AppProps,
  AppStatus,
  HorizonConfig,
  CreateHorizonOptions,
  CreateHorizonAppConfig,
  IEventBus,
  EventHandler,
} from "./core/types";

export { EventBus, eventBus } from "./core/event-bus";
export { App } from "./app";
export { HorizonAppElement } from "./runtime/element";

import { orchestrator } from "./orchestrator";
export { orchestrator };

import type { AppConfig, HorizonConfig } from "./core/types";
import { exposeNavigateToGlobal } from "./api/createHorizon";

/**
 * Register one or more micro-apps.
 */
export function registerApp(config: AppConfig | AppConfig[]): void {
  orchestrator.register(config);
}

/**
 * Start Horizon. Call once after registering apps.
 */
export function start(config?: HorizonConfig): void {
  orchestrator.start(config);
  if (typeof window !== "undefined" && config?.exposeNavigate !== false) {
    exposeNavigateToGlobal();
  }
}

/**
 * Get a registered app by name.
 */
export function getApp(name: string) {
  return orchestrator.getApp(name);
}

export { createHorizon, navigateTo } from "./api/createHorizon";
