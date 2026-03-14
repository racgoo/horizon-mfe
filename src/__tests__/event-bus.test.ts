import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../core/event-bus";

describe("EventBus", () => {
  it("emits events to subscribers", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("test", handler);
    bus.emit("test", { value: 42 });
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it("returns an unsubscribe function from on()", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const off = bus.on("test", handler);
    off();
    bus.emit("test");
    expect(handler).not.toHaveBeenCalled();
  });

  it("off() removes a specific handler", () => {
    const bus = new EventBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.on("x", a);
    bus.on("x", b);
    bus.off("x", a);
    bus.emit("x");
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();
  });

  it("once() fires only once", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.once("ping", handler);
    bus.emit("ping");
    bus.emit("ping");
    expect(handler).toHaveBeenCalledOnce();
  });

  it("clear() removes all handlers for an event", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("a", handler);
    bus.clear("a");
    bus.emit("a");
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not throw when emitting with no subscribers", () => {
    const bus = new EventBus();
    expect(() => bus.emit("unknown")).not.toThrow();
  });
});
