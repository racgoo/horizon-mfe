export type CSSIsolationMode = "none" | "scopeAttribute" | "shadowDom";

export interface CSSIsolationHandle {
  mountPoint: HTMLElement;
  cleanup: () => void;
}

/**
 * Sets up CSS isolation for a child app container.
 *
 * Modes:
 *
 * - `"scopeAttribute"` (default): Adds a `data-horizon-app="<appName>"` attribute to the
 *   container element. This is a **convention-based** approach — stylesheets are still
 *   injected into `document.head` and apply globally. For styles to be scoped, child apps
 *   must write all their CSS selectors prefixed with `[data-horizon-app="<appName>"]`.
 *   Example: `[data-horizon-app="my-app"] .button { ... }`
 *
 * - `"shadowDom"`: Attaches a Shadow DOM to the container and mounts the app inside it.
 *   This is **true CSS encapsulation** — styles injected into the shadow root cannot leak
 *   out, and host styles cannot bleed in. Use this for guaranteed style isolation.
 *   Falls back to `"scopeAttribute"` if the browser does not support Shadow DOM.
 *
 * - `"none"`: No isolation. Container receives no special treatment. Styles are global.
 */
export function setupCSSIsolation(
  container: HTMLElement,
  appName: string,
  mode: CSSIsolationMode = "scopeAttribute",
): CSSIsolationHandle {
  if (mode === "shadowDom") {
    if (typeof container.attachShadow === "function") {
      return setupShadowDom(container);
    }
    console.warn(
      `[horizon] Shadow DOM is not supported in this browser. ` +
        `Falling back to "scopeAttribute" mode for app "${appName}".`,
    );
    // Fall through to scopeAttribute
  }

  if (mode === "shadowDom" || mode === "scopeAttribute") {
    container.dataset.horizonApp = appName;
    return {
      mountPoint: container,
      cleanup: () => {
        delete container.dataset.horizonApp;
      },
    };
  }

  return { mountPoint: container, cleanup: () => {} };
}

function setupShadowDom(container: HTMLElement): CSSIsolationHandle {
  const shadow = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  const mountPoint = document.createElement("div");
  shadow.appendChild(mountPoint);

  return {
    mountPoint,
    cleanup: () => {
      shadow.removeChild(mountPoint);
    },
  };
}
