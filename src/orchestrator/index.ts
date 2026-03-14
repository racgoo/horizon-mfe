import type { AppConfig, AppConfigResolved, HorizonConfig } from "../core/types";
import { errAppMustHaveRoute } from "../core/constants";
import { App } from "../app";
import { eventBus } from "../core/event-bus";
import { watchRouter, classifyAppsByRoute } from "../routing";

export class Orchestrator {
  private apps = new Map<string, App>();
  private config: HorizonConfig = {};
  private started = false;
  private stopWatchingRouter: (() => void) | null = null;

  register(configs: AppConfig | AppConfig[]): void {
    const list = Array.isArray(configs) ? configs : [configs];
    for (const cfg of list) {
      const activeRule = cfg.activeRule ?? cfg.route;
      if (!activeRule) {
        throw new Error(errAppMustHaveRoute(cfg.name));
      }
      const normalised: AppConfigResolved = { ...cfg, activeRule };

      if (this.apps.has(normalised.name)) {
        console.warn(
          `[horizon] App "${normalised.name}" is already registered. Skipping.`,
        );
        continue;
      }
      this.apps.set(normalised.name, new App(normalised, eventBus));
    }
  }

  start(config: HorizonConfig = {}): void {
    if (this.started) {
      console.warn("[horizon] Already started.");
      return;
    }
    this.config = config;
    this.started = true;

    this.reroute();
    this.stopWatchingRouter = watchRouter(() => this.reroute());
  }

  stop(): void {
    this.stopWatchingRouter?.();
    this.stopWatchingRouter = null;
    this.started = false;

    for (const app of this.apps.values()) {
      if (app.status === "MOUNTED" || app.status === "PAUSED") {
        app.unmount().catch(console.error);
      }
    }
  }

  private async reroute(): Promise<void> {
    const apps = [...this.apps.values()];
    const { toMount, toUnmount, toPause, toResume } = classifyAppsByRoute(
      apps,
      window.location,
    );

    await Promise.all([
      ...toUnmount.map((app) => this.doUnmount(app)),
      ...toPause.map((app) => this.doPause(app)),
    ]);

    for (const app of [...toResume, ...toMount]) {
      if (app.status === "PAUSED") {
        await this.doResume(app);
      } else {
        await this.doMount(app);
      }
    }

    this.config.onRouteChange?.();

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("horizon:routechange", {
          detail: { pathname: window.location.pathname },
        }),
      );
    }
  }

  private async doMount(app: App): Promise<void> {
    try {
      const cancel = await this.config.beforeMount?.(app.config);
      if (cancel === false) return;

      if (app.status === "NOT_LOADED") await app.load();
      if (app.status === "NOT_BOOTSTRAPPED") await app.bootstrap();
      if (app.status === "NOT_MOUNTED") await app.mount();

      await this.config.afterMount?.(app.config);
    } catch (e) {
      console.error(`[horizon] Failed to mount app "${app.config.name}":`, e);
    }
  }

  private async doUnmount(app: App): Promise<void> {
    try {
      await this.config.beforeUnmount?.(app.config);
      await app.unmount();
      await this.config.afterUnmount?.(app.config);
    } catch (e) {
      console.error(`[horizon] Failed to unmount app "${app.config.name}":`, e);
    }
  }

  private async doPause(app: App): Promise<void> {
    try {
      await app.pause();
      await this.config.onPause?.(app.config);
    } catch (e) {
      console.error(`[horizon] Failed to pause app "${app.config.name}":`, e);
    }
  }

  private async doResume(app: App): Promise<void> {
    try {
      await app.resume();
      await this.config.onResume?.(app.config);
    } catch (e) {
      console.error(`[horizon] Failed to resume app "${app.config.name}":`, e);
    }
  }

  getApp(name: string): App | undefined {
    return this.apps.get(name);
  }

  getApps(): App[] {
    return [...this.apps.values()];
  }
}

export const orchestrator = new Orchestrator();

