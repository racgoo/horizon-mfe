import type { AppConfig } from "../core/types";
import type { CSSIsolationHandle } from "./css";
import { errContainerNotFound } from "../core/constants";
import { HorizonAppElement, ensureHorizonElement } from "./element";

export interface ResolvedContainer {
  container: HTMLElement;
  hostElement: HorizonAppElement | null;
}

export function resolveContainer(config: AppConfig, appName: string): ResolvedContainer {
  const { container } = config;

  if (container !== undefined && container !== null) {
    if (typeof container === "string") {
      const el = document.querySelector<HTMLElement>(container);
      if (!el) throw new Error(errContainerNotFound(appName, container));
      return { container: el, hostElement: null };
    }
    return { container, hostElement: null };
  }

  const hostElement = ensureHorizonElement(appName);
  return { container: hostElement.mountPoint, hostElement };
}

export function getMountPoint(options: {
  cssHandle: CSSIsolationHandle | null;
  instanceWrapper: HTMLDivElement | null;
  resolvedContainer: HTMLElement;
}): HTMLElement {
  const { cssHandle, instanceWrapper, resolvedContainer } = options;
  return cssHandle?.mountPoint ?? instanceWrapper ?? resolvedContainer;
}

