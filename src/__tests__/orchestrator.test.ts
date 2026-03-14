import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Orchestrator } from "../orchestrator";
import type { AppConfig } from "../core/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    name: "test-app",
    entry: { scripts: [], html: "<div id='root'></div>" },
    container: "#test-container",
    activeRule: "/test",
    ...overrides,
  };
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  document.body.innerHTML = `<div id="test-container"></div>`;
  // Reset location
  history.pushState(null, "", "/");
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Orchestrator.register", () => {
  it("registers a single app", () => {
    const orch = new Orchestrator();
    orch.register(makeConfig());
    expect(orch.getApp("test-app")).toBeDefined();
  });

  it("registers multiple apps", () => {
    const orch = new Orchestrator();
    orch.register([makeConfig({ name: "a" }), makeConfig({ name: "b" })]);
    expect(orch.getApps()).toHaveLength(2);
  });

  it("warns on duplicate registration", () => {
    const orch = new Orchestrator();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    orch.register(makeConfig());
    orch.register(makeConfig());
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe("Orchestrator.register — route alias", () => {
  it("accepts route as alias for activeRule", () => {
    const orch = new Orchestrator();
    orch.register({ name: "alias-app", entry: { scripts: [] }, route: "/alias" });
    const app = orch.getApp("alias-app")!;
    expect(app.config.activeRule).toBe("/alias");
  });

  it("throws when neither activeRule nor route is provided", () => {
    const orch = new Orchestrator();
    expect(() =>
      orch.register({ name: "bad-app", entry: { scripts: [] } } as never)
    ).toThrow(/activeRule.*route/);
  });
});

describe("Orchestrator lifecycle (mocked)", () => {
  it("mounts an app when its route matches", async () => {
    const orch = new Orchestrator();
    const cfg = makeConfig({ activeRule: "/test" });
    orch.register(cfg);

    const app = orch.getApp("test-app")!;
    const loadSpy = vi.spyOn(app, "load").mockResolvedValue(undefined);
    const bootstrapSpy = vi.spyOn(app, "bootstrap").mockResolvedValue(undefined);
    const mountSpy = vi.spyOn(app, "mount").mockResolvedValue(undefined);

    // Manually set statuses to simulate load/bootstrap already done
    // so we can test the mount path directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app as any).status = "NOT_MOUNTED";

    history.pushState(null, "", "/test");
    orch.start();

    await new Promise((r) => setTimeout(r, 0)); // flush promises

    expect(mountSpy).toHaveBeenCalled();
    orch.stop();
  });

  it("unmounts an app when its route no longer matches", async () => {
    const orch = new Orchestrator();
    const cfg = makeConfig({ activeRule: "/test" });
    orch.register(cfg);

    const app = orch.getApp("test-app")!;
    const unmountSpy = vi.spyOn(app, "unmount").mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app as any).status = "MOUNTED";

    history.pushState(null, "", "/other");
    orch.start();

    await new Promise((r) => setTimeout(r, 0));

    expect(unmountSpy).toHaveBeenCalled();
    orch.stop();
  });
});

describe("Orchestrator keep-alive", () => {
  const flush = () => new Promise((r) => setTimeout(r, 0));

  it("pauses instead of unmounting when keepAlive is true", async () => {
    const orch = new Orchestrator();
    orch.register(makeConfig({ activeRule: "/test", keepAlive: true }));

    const app = orch.getApp("test-app")!;
    const pauseSpy = vi.spyOn(app, "pause").mockResolvedValue(undefined);
    const unmountSpy = vi.spyOn(app, "unmount").mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app as any).status = "MOUNTED";

    history.pushState(null, "", "/other");
    orch.start();
    await flush();

    expect(pauseSpy).toHaveBeenCalled();
    expect(unmountSpy).not.toHaveBeenCalled();
    orch.stop();
  });

  it("resumes instead of re-mounting when keep-alive app is PAUSED", async () => {
    const orch = new Orchestrator();
    orch.register(makeConfig({ activeRule: "/test", keepAlive: true }));

    const app = orch.getApp("test-app")!;
    const resumeSpy = vi.spyOn(app, "resume").mockResolvedValue(undefined);
    const mountSpy = vi.spyOn(app, "mount").mockResolvedValue(undefined);
    vi.spyOn(app, "unmount").mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app as any).status = "PAUSED";

    history.pushState(null, "", "/test");
    orch.start();
    await flush();

    expect(resumeSpy).toHaveBeenCalled();
    expect(mountSpy).not.toHaveBeenCalled();
    orch.stop();
  });

  it("stop() unmounts PAUSED apps", async () => {
    const orch = new Orchestrator();
    orch.register(makeConfig({ activeRule: "/test", keepAlive: true }));

    const app = orch.getApp("test-app")!;
    const unmountSpy = vi.spyOn(app, "unmount").mockResolvedValue(undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (app as any).status = "PAUSED";

    orch.start();
    orch.stop();
    await flush();

    expect(unmountSpy).toHaveBeenCalled();
  });
});
