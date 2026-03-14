import { describe, it, expect, afterEach } from "vitest";
import { toActiveRuleFn, watchRouter } from "../routing";

describe("toActiveRuleFn", () => {
  it("matches path prefix when given a string", () => {
    const fn = toActiveRuleFn("/app");
    expect(fn({ pathname: "/app" } as Location)).toBe(true);
    expect(fn({ pathname: "/app/sub" } as Location)).toBe(true);
    expect(fn({ pathname: "/other" } as Location)).toBe(false);
  });

  it("delegates to a custom function", () => {
    const fn = toActiveRuleFn((loc) => loc.search.includes("admin=1"));
    expect(fn({ search: "?admin=1" } as unknown as Location)).toBe(true);
    expect(fn({ search: "?foo=bar" } as unknown as Location)).toBe(false);
  });
});

describe("watchRouter", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => cleanups.forEach((fn) => fn()));

  it("calls onChange on pushState", () => {
    let calls = 0;
    const stop = watchRouter(() => calls++);
    cleanups.push(stop);

    history.pushState(null, "", "/test-route");
    expect(calls).toBe(1);

    stop();
    history.pushState(null, "", "/test-route-2");
    expect(calls).toBe(1); // no more calls after stop
  });
});
