import type { AppConfig, CreateHorizonOptions } from "../core/types";
import { errCreateHorizonAppMustHaveRoute } from "../core/constants";
import { orchestrator } from "../orchestrator";

export function navigateTo(path: string): void {
  history.pushState(null, "", path);
}

export function exposeNavigateToGlobal(): void {
  const globalWindow = window as unknown as Record<string, unknown>;
  globalWindow.navigate = navigateTo;
  globalWindow.navigateTo = navigateTo;
}

/**
 * createHorizon — simplified single-call API.
 * Registers all apps and starts Horizon. Uses `route` as alias for `activeRule`.
 */
export function createHorizon(options: CreateHorizonOptions): void {
  const { container: defaultContainer, keepAlive: defaultKeepAlive } = options;

  const appConfigs: AppConfig[] = options.apps.map((app) => {
    const activeRule = app.activeRule ?? app.route;
    if (!activeRule) {
      throw new Error(errCreateHorizonAppMustHaveRoute(app.name));
    }
    return {
      name: app.name,
      entry: app.entry,
      container: app.container ?? defaultContainer,
      activeRule,
      keepAlive: app.keepAlive ?? defaultKeepAlive ?? false,
      props: app.props,
    };
  });

  orchestrator.register(appConfigs);
  orchestrator.start({
    afterMount: options.onMount,
    beforeUnmount: options.onUnmount,
    onPause: options.onPause,
    onResume: options.onResume,
    onRouteChange: options.onRouteChange,
  });
  if (typeof window !== "undefined" && options.exposeNavigate !== false) {
    exposeNavigateToGlobal();
  }
}
