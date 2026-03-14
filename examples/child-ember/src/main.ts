import { defineApp } from "horizon-mfe/ember";
import { navigateTo } from "horizon-mfe";

let root: HTMLElement | null = null;
let unsubCount: (() => void) | null = null;

defineApp({
  mount(props) {
    root = document.createElement("div");
    root.className = "ember-app";
    root.innerHTML = `
      <div class="app-badge">Ember</div>
      <nav class="child-nav">
        <button type="button" class="child-nav-button" data-nav="/vanilla">/vanilla</button>
        <button type="button" class="child-nav-button" data-nav="/react">/react</button>
        <button type="button" class="child-nav-button" data-nav="/vue">/vue</button>
        <button type="button" class="child-nav-button" data-nav="/solid">/solid</button>
        <button type="button" class="child-nav-button" data-nav="/svelte">/svelte</button>
        <button type="button" class="child-nav-button is-active" data-nav="/ember">/ember</button>
      </nav>
      <h2>Counter</h2>
      <div class="counter-display" data-count>0</div>
      <div class="counter-controls">
        <button type="button" class="btn btn-ghost" data-op="minus">−</button>
        <button type="button" class="btn btn-outline" data-op="reset">Reset</button>
        <button type="button" class="btn btn-primary" data-op="plus">+</button>
      </div>
      <p class="hint">Shared count via <code>eventBus</code></p>
    `;
    props.container.appendChild(root);

    const countEl = root.querySelector("[data-count]")!;
    const bus = props.eventBus as {
      getState: (k: string) => number;
      setState: (k: string, v: number) => void;
      on: (e: string, fn: (v: number) => void) => () => void;
    };
    const updateCount = (v: number) => {
      countEl.textContent = String(v);
    };
    updateCount(bus.getState("count") ?? 0);
    unsubCount = bus.on("store:count", updateCount);

    root.querySelectorAll("[data-nav]").forEach((btn) => {
      (btn as HTMLElement).addEventListener("click", () => {
        navigateTo((btn as HTMLElement).dataset.nav!);
      });
    });
    root.querySelector("[data-op=minus]")!.addEventListener("click", () => {
      const v = (bus.getState("count") ?? 0) - 1;
      bus.setState("count", v);
    });
    root.querySelector("[data-op=reset]")!.addEventListener("click", () => {
      bus.setState("count", 0);
    });
    root.querySelector("[data-op=plus]")!.addEventListener("click", () => {
      const v = (bus.getState("count") ?? 0) + 1;
      bus.setState("count", v);
    });
  },
  unmount() {
    unsubCount?.();
    unsubCount = null;
    root?.remove();
    root = null;
  },
});
