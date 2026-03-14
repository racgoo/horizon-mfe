import type { AppProps } from "horizon-mfe";
import "./style.css";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── App State ────────────────────────────────────────────────────────────────

let count = 0;
let container: HTMLElement | null = null;

// ─── Render ───────────────────────────────────────────────────────────────────

function render(el: HTMLElement) {
  el.innerHTML = `
    <div class="vanilla-app">
      <div class="app-badge">Vanilla TS</div>
      <nav class="child-nav">
        <button class="child-nav-button is-active" data-nav="/vanilla">/vanilla</button>
        <button class="child-nav-button" data-nav="/react">/react</button>
        <button class="child-nav-button" data-nav="/vue">/vue</button>
        <button class="child-nav-button" data-nav="/solid">/solid</button>
        <button class="child-nav-button" data-nav="/svelte">/svelte</button>
        <button class="child-nav-button" data-nav="/ember">/ember</button>
      </nav>
      <h2>Counter</h2>
      <div class="counter-display">${count}</div>
      <div class="counter-controls">
        <button id="dec" class="btn btn-ghost">−</button>
        <button id="reset" class="btn btn-outline">Reset</button>
        <button id="inc" class="btn btn-primary">+</button>
      </div>
      <p class="hint">Shared count via <code>eventBus</code></p>
    </div>
  `;
}

// ─── Lifecycle Hooks ──────────────────────────────────────────────────────────

window.__HORIZON_LIFECYCLE__ = {
  async bootstrap() {
    console.log("[child-vanilla] bootstrap");
  },

  async mount({ container: el, eventBus, props }) {
    console.log("[child-vanilla] mount —", props?.greeting);
    container = el;
    count = eventBus.getState<number>("count") ?? 0;
    render(container);

    function updateCount(next: number) {
      count = next;
      updateDisplay();
      eventBus.setState("count", next);
    }

    eventBus.on<number>("store:count", (value: number) => {
      count = value;
      updateDisplay();
    });

    container
      .querySelector<HTMLButtonElement>("#inc")!
      .addEventListener("click", () => updateCount(count + 1));
    container
      .querySelector<HTMLButtonElement>("#dec")!
      .addEventListener("click", () => updateCount(count - 1));
    container
      .querySelector<HTMLButtonElement>("#reset")!
      .addEventListener("click", () => updateCount(0));

    container
      .querySelectorAll<HTMLButtonElement>("[data-nav]")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          history.pushState(null, "", btn.dataset.nav!);
        });
      });
  },

  async unmount({ container: el }) {
    console.log("[child-vanilla] unmount");
    el.innerHTML = "";
    container = null;
  },
};

function updateDisplay() {
  const el = container?.querySelector<HTMLElement>(".counter-display");
  if (el) el.textContent = String(count);
}
