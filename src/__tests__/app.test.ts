import { describe, it, expect, vi, beforeEach } from "vitest";
import { App } from "../app";
import { EventBus } from "../core/event-bus";
import type { AppLifecycles, AppProps } from "../core/types";
import { HorizonAppElement } from "../runtime/element";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeEventBus() {
  return new EventBus();
}

function makeLifecycles(overrides: Partial<AppLifecycles> = {}): AppLifecycles {
  return {
    mount: vi.fn().mockResolvedValue(undefined),
    unmount: vi.fn().mockResolvedValue(undefined),
    onPause: vi.fn().mockResolvedValue(undefined),
    onResume: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/** Create an App with mocked internals so we don't need real network. */
function makeMockedApp(
  overrides: { keepAlive?: boolean; container?: string } = {}
) {
  const lifecycles = makeLifecycles();
  const eventBus = makeEventBus();
  const app = new App(
    {
      name: "test-app",
      entry: { scripts: [], html: "<div></div>" },
      container: overrides.container ?? "#test-container",
      activeRule: "/test",
      keepAlive: overrides.keepAlive ?? false,
    },
    eventBus
  );

  // Bypass load/bootstrap by directly injecting state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const internal = app as any;
  internal.lifecycles = lifecycles;
  internal.loadResult = { lifecycles: {}, styleElements: [], html: "<div></div>" };
  internal.sandbox = { activate: vi.fn(), deactivate: vi.fn(), proxy: {} };
  internal.status = "NOT_MOUNTED";

  return { app, lifecycles, eventBus };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  document.body.innerHTML = `<div id="test-container"></div>`;
  document.querySelectorAll("horizon-app").forEach((el) => el.remove());
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("App.mount / unmount (legacy container)", () => {
  it("mounts into the provided container", async () => {
    const { app } = makeMockedApp();
    await app.mount();
    expect(app.status).toBe("MOUNTED");
  });

  it("unmounts and sets status to NOT_MOUNTED", async () => {
    const { app, lifecycles } = makeMockedApp();
    await app.mount();
    await app.unmount();
    expect(app.status).toBe("NOT_MOUNTED");
    expect(lifecycles.unmount).toHaveBeenCalled();
  });
});

describe("App.pause / resume (keep-alive)", () => {
  it("pause() hides the instance wrapper (not the shared container) and sets status to PAUSED", async () => {
    const { app } = makeMockedApp();
    await app.mount();
    await app.pause();

    expect(app.status).toBe("PAUSED");
    // The shared container must remain visible — only the per-app wrapper is hidden
    const container = document.querySelector<HTMLElement>("#test-container")!;
    expect(container.style.display).toBe("");
    // The wrapper inside the container should be hidden
    const wrapper = container.querySelector<HTMLElement>("[data-horizon-instance]")!;
    expect(wrapper.style.display).toBe("none");
  });

  it("pause() calls onPause lifecycle", async () => {
    const { app, lifecycles } = makeMockedApp();
    await app.mount();
    await app.pause();
    expect(lifecycles.onPause).toHaveBeenCalled();
  });

  it("pause() does NOT deactivate sandbox (app stays alive)", async () => {
    const { app } = makeMockedApp();
    await app.mount();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sandbox = (app as any).sandbox;
    await app.pause();
    expect(sandbox.deactivate).not.toHaveBeenCalled();
  });

  it("resume() shows the instance wrapper and sets status back to MOUNTED", async () => {
    const { app } = makeMockedApp();
    await app.mount();
    await app.pause();
    await app.resume();

    expect(app.status).toBe("MOUNTED");
    const container = document.querySelector<HTMLElement>("#test-container")!;
    const wrapper = container.querySelector<HTMLElement>("[data-horizon-instance]")!;
    expect(wrapper.style.display).toBe("");
  });

  it("resume() calls onResume lifecycle", async () => {
    const { app, lifecycles } = makeMockedApp();
    await app.mount();
    await app.pause();
    await app.resume();
    expect(lifecycles.onResume).toHaveBeenCalled();
  });

  it("unmount() works from PAUSED state", async () => {
    const { app, lifecycles } = makeMockedApp();
    await app.mount();
    await app.pause();
    await app.unmount();

    expect(app.status).toBe("NOT_MOUNTED");
    expect(lifecycles.unmount).toHaveBeenCalled();
  });

  it("pause() is a no-op when not MOUNTED", async () => {
    const { app, lifecycles } = makeMockedApp();
    // status is NOT_MOUNTED, pause should do nothing
    await app.pause();
    expect(app.status).toBe("NOT_MOUNTED");
    expect(lifecycles.onPause).not.toHaveBeenCalled();
  });
});

describe("App — web-component path (no container)", () => {
  it("auto-creates a <horizon-app> element when container is omitted", async () => {
    const lifecycles = makeLifecycles();
    const eventBus = makeEventBus();
    const app = new App(
      { name: "wc-app", entry: { scripts: [], html: "" }, activeRule: "/wc" },
      eventBus
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = app as any;
    internal.lifecycles = lifecycles;
    internal.loadResult = { lifecycles: {}, styleElements: [], html: "" };
    internal.sandbox = { activate: vi.fn(), deactivate: vi.fn(), proxy: {} };
    internal.status = "NOT_MOUNTED";

    await app.mount();

    expect(app.status).toBe("MOUNTED");
    const el = document.querySelector<HorizonAppElement>('horizon-app[name="wc-app"]');
    expect(el).not.toBeNull();
    expect(el!.shadowRoot).not.toBeNull();
  });

  it("removes the <horizon-app> element on unmount", async () => {
    const lifecycles = makeLifecycles();
    const eventBus = makeEventBus();
    const app = new App(
      { name: "wc-app2", entry: { scripts: [], html: "" }, activeRule: "/wc2" },
      eventBus
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = app as any;
    internal.lifecycles = lifecycles;
    internal.loadResult = { lifecycles: {}, styleElements: [], html: "" };
    internal.sandbox = { activate: vi.fn(), deactivate: vi.fn(), proxy: {} };
    internal.status = "NOT_MOUNTED";

    await app.mount();
    await app.unmount();

    expect(document.querySelector('horizon-app[name="wc-app2"]')).toBeNull();
  });

  it("hide/shows <horizon-app> element on pause/resume", async () => {
    const lifecycles = makeLifecycles();
    const eventBus = makeEventBus();
    const app = new App(
      { name: "wc-pause", entry: { scripts: [], html: "" }, activeRule: "/wc3", keepAlive: true },
      eventBus
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const internal = app as any;
    internal.lifecycles = lifecycles;
    internal.loadResult = { lifecycles: {}, styleElements: [], html: "" };
    internal.sandbox = { activate: vi.fn(), deactivate: vi.fn(), proxy: {} };
    internal.status = "NOT_MOUNTED";

    await app.mount();
    const el = document.querySelector<HorizonAppElement>('horizon-app[name="wc-pause"]')!;

    await app.pause();
    expect(el.style.display).toBe("none");

    await app.resume();
    expect(el.style.display).toBe("");
  });
});
