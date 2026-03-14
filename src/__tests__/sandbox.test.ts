import { describe, it, expect, beforeEach } from "vitest";
import { ProxySandbox, SnapshotSandbox } from "../runtime/sandbox";

describe("ProxySandbox", () => {
  it("intercepts writes and does not pollute the real window", () => {
    const sb = new ProxySandbox("test");
    sb.activate();

    (sb.proxy as Record<string, unknown>)["__test_key__"] = "hello";
    expect((window as Record<string, unknown>)["__test_key__"]).toBeUndefined();
    expect((sb.proxy as Record<string, unknown>)["__test_key__"]).toBe("hello");

    sb.deactivate();
    // After deactivation the value should be gone from the proxy too
    expect((sb.proxy as Record<string, unknown>)["__test_key__"]).toBeUndefined();
  });

  it("reads real window properties through the proxy", () => {
    const sb = new ProxySandbox("test");
    sb.activate();
    expect((sb.proxy as Record<string, unknown>)["document"]).toBe(document);
    sb.deactivate();
  });

  it("proxy.window === proxy itself", () => {
    const sb = new ProxySandbox("test");
    expect((sb.proxy as Record<string, unknown>)["window"]).toBe(sb.proxy);
  });

  it("does not write to real window when inactive", () => {
    const sb = new ProxySandbox("test");
    // Not activated
    (sb.proxy as Record<string, unknown>)["__inactive__"] = 99;
    expect((window as Record<string, unknown>)["__inactive__"]).toBeUndefined();
  });
});

describe("SnapshotSandbox", () => {
  it("restores window state on deactivate", () => {
    const sb = new SnapshotSandbox("snap");
    sb.activate();
    (window as Record<string, unknown>)["__snap_test__"] = "modified";
    sb.deactivate();
    expect((window as Record<string, unknown>)["__snap_test__"]).toBeUndefined();
  });
});
