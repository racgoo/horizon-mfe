export class HorizonAppElement extends HTMLElement {
  private _mountPoint: HTMLDivElement;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: "open" });
    this._mountPoint = document.createElement("div");
    this._mountPoint.style.cssText = "display:contents";
    shadow.appendChild(this._mountPoint);
  }

  get mountPoint(): HTMLDivElement {
    return this._mountPoint;
  }

  hide(): void {
    this.style.display = "none";
  }

  show(): void {
    this.style.display = "";
  }

  injectStylesheet(url: string): HTMLLinkElement {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    const root = this.shadowRoot;
    if (root) root.appendChild(link);
    return link;
  }
}

if (!customElements.get("horizon-app")) {
  customElements.define("horizon-app", HorizonAppElement);
}

export function ensureHorizonElement(appName: string): HorizonAppElement {
  const existing = document.querySelector<HorizonAppElement>(
    `horizon-app[name="${appName}"]`,
  );
  if (existing) return existing;

  const el = document.createElement("horizon-app") as HorizonAppElement;
  el.setAttribute("name", appName);
  document.body.appendChild(el);
  return el;
}

