import type {
  AppConfigResolved,
  AppLifecycles,
  AppProps,
  AppStatus,
  IEventBus,
} from "../core/types";
import { errLifecycleHooksRequired } from "../core/constants";
import { createSandbox, type Sandbox } from "../runtime/sandbox";
import { loadApp, type LoadResult } from "../entry/loader";
import { setupCSSIsolation, type CSSIsolationHandle } from "../runtime/css";
import { resolveContainer, getMountPoint } from "../runtime/container";
import type { HorizonAppElement } from "../runtime/element";
import { normalizeLifecycles } from "./lifecycles";

/**
 * Internal representation of a registered micro-app.
 * Manages the full lifecycle: load → bootstrap → mount ↔ pause/resume ↔ unmount.
 *
 * Sandbox lifecycle:
 *   load()    → sandbox created and activated (scripts execute in sandbox context)
 *   mount()   → sandbox remains active
 *   pause()   → sandbox remains active (app is hidden but not destroyed)
 *   resume()  → sandbox remains active
 *   unmount() → sandbox deactivated and globals cleared
 */
export class App {
  readonly config: AppConfigResolved;
  private readonly eventBus: IEventBus;

  status: AppStatus = "NOT_LOADED";

  private sandbox: Sandbox | null = null;
  private lifecycles: AppLifecycles | null = null;
  private loadResult: LoadResult | null = null;
  private cssHandle: CSSIsolationHandle | null = null;

  private hostElement: HorizonAppElement | null = null;
  private resolvedContainer: HTMLElement | null = null;
  private instanceWrapper: HTMLDivElement | null = null;

  constructor(config: AppConfigResolved, eventBus: IEventBus) {
    this.config = config;
    this.eventBus = eventBus;
  }

  private ensureContainer(): HTMLElement {
    if (this.resolvedContainer) return this.resolvedContainer;
    const { container, hostElement } = resolveContainer(this.config, this.config.name);
    this.resolvedContainer = container;
    this.hostElement = hostElement;
    return container;
  }

  private buildProps(mountPoint: HTMLElement): AppProps {
    return {
      name: this.config.name,
      container: mountPoint,
      eventBus: this.eventBus,
      pathname: window.location.pathname,
      ...(this.config.props ?? {}),
    } as AppProps;
  }

  private resolveMountPoint(): HTMLElement {
    return getMountPoint({
      cssHandle: this.cssHandle,
      instanceWrapper: this.instanceWrapper,
      resolvedContainer: this.resolvedContainer ?? this.ensureContainer(),
    });
  }

  private getLifecycles(): AppLifecycles {
    if (!this.lifecycles) {
      throw new Error(errLifecycleHooksRequired(this.config.name));
    }
    return this.lifecycles;
  }

  async load(): Promise<void> {
    if (this.status !== "NOT_LOADED") return;
    this.status = "LOADING";

    try {
      this.sandbox = createSandbox(this.config.name);
      // Activate sandbox before script execution so all child globals are captured in the sandbox
      this.sandbox.activate();
      this.ensureContainer();

      this.loadResult = await loadApp(this.config.entry, this.sandbox, {
        styleTarget: this.hostElement?.shadowRoot ?? undefined,
      });

      this.lifecycles = normalizeLifecycles(
        this.loadResult.lifecycles,
        this.config.name,
      );
      this.status = "NOT_BOOTSTRAPPED";
    } catch (e) {
      this.status = "LOAD_ERROR";
      throw e;
    }
  }

  async bootstrap(): Promise<void> {
    if (this.status !== "NOT_BOOTSTRAPPED") return;
    this.status = "BOOTSTRAPPING";
    await this.getLifecycles().bootstrap?.();
    this.status = "NOT_MOUNTED";
  }

  async mount(): Promise<void> {
    if (this.status !== "NOT_MOUNTED") return;
    this.status = "MOUNTING";

    const container = this.ensureContainer();
    const styleTarget = this.hostElement?.shadowRoot ?? undefined;

    // Re-inject styles removed during a previous unmount
    this.loadResult?.styleElements.forEach((el) => {
      if (!el.isConnected) {
        (styleTarget ?? document.head).appendChild(el);
      }
    });

    if (this.hostElement) {
      if (this.loadResult?.html) {
        container.innerHTML = this.loadResult.html;
      }
      this.hostElement.show();
      this.cssHandle = null;
    } else {
      this.instanceWrapper = document.createElement("div");
      this.instanceWrapper.dataset.horizonInstance = this.config.name;
      if (this.loadResult?.html) {
        this.instanceWrapper.innerHTML = this.loadResult.html;
      }
      container.appendChild(this.instanceWrapper);
      this.cssHandle = setupCSSIsolation(this.instanceWrapper, this.config.name, "scopeAttribute");
    }

    const props = this.buildProps(this.resolveMountPoint());
    await this.getLifecycles().mount(props);

    this.status = "MOUNTED";
  }

  async pause(): Promise<void> {
    if (this.status !== "MOUNTED") return;
    this.status = "PAUSING";

    const props = this.buildProps(this.resolveMountPoint());
    await this.getLifecycles().onPause?.(props);

    if (this.hostElement) {
      this.hostElement.hide();
    } else if (this.instanceWrapper) {
      this.instanceWrapper.style.display = "none";
    }

    this.status = "PAUSED";
  }

  async resume(): Promise<void> {
    if (this.status !== "PAUSED") return;
    this.status = "RESUMING";

    if (this.hostElement) {
      this.hostElement.show();
    } else if (this.instanceWrapper) {
      this.instanceWrapper.style.display = "";
    }

    const props = this.buildProps(this.resolveMountPoint());
    await this.getLifecycles().onResume?.(props);

    this.status = "MOUNTED";
  }

  async unmount(): Promise<void> {
    if (this.status !== "MOUNTED" && this.status !== "PAUSED") return;

    if (this.status === "PAUSED") {
      if (this.hostElement) this.hostElement.show();
      else if (this.instanceWrapper) this.instanceWrapper.style.display = "";
    }

    this.status = "UNMOUNTING";

    const props = this.buildProps(this.resolveMountPoint());
    await this.getLifecycles().unmount(props);

    this.cssHandle?.cleanup();
    this.cssHandle = null;

    if (this.instanceWrapper) {
      this.instanceWrapper.remove();
      this.instanceWrapper = null;
    }

    // Remove injected stylesheets from the document
    this.loadResult?.styleElements.forEach((el) => el.parentNode?.removeChild(el));

    // Deactivate sandbox: clears the app's global Map so its globals don't outlive it
    this.sandbox?.deactivate();

    if (this.hostElement) {
      this.hostElement.remove();
      this.hostElement = null;
    }
    this.resolvedContainer = null;

    this.status = "NOT_MOUNTED";
  }

  async update(newProps: Record<string, unknown>): Promise<void> {
    if (this.status !== "MOUNTED") return;
    this.config.props = Object.assign(this.config.props ?? {}, newProps);

    const props = this.buildProps(this.resolveMountPoint());
    await this.getLifecycles().update?.(props);
  }
}
