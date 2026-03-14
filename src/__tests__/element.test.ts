import { describe, it, expect, beforeEach } from "vitest";
import { HorizonAppElement, ensureHorizonElement } from "../runtime/element";

describe("HorizonAppElement", () => {
  it("can be created via document.createElement", () => {
    const el = document.createElement("horizon-app");
    expect(el).toBeInstanceOf(HorizonAppElement);
  });

  it("has a shadow root in open mode", () => {
    const el = document.createElement("horizon-app") as HorizonAppElement;
    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot!.mode).toBe("open");
  });

  it("exposes a mountPoint div inside the shadow root", () => {
    const el = document.createElement("horizon-app") as HorizonAppElement;
    expect(el.mountPoint).toBeInstanceOf(HTMLDivElement);
    expect(el.shadowRoot!.contains(el.mountPoint)).toBe(true);
  });

  it("hide() sets display:none on the host element", () => {
    const el = document.createElement("horizon-app") as HorizonAppElement;
    el.hide();
    expect(el.style.display).toBe("none");
  });

  it("show() removes the display override", () => {
    const el = document.createElement("horizon-app") as HorizonAppElement;
    el.hide();
    el.show();
    expect(el.style.display).toBe("");
  });

  it("injectStylesheet() creates a <link> inside the shadow root", () => {
    const el = document.createElement("horizon-app") as HorizonAppElement;
    const link = el.injectStylesheet("http://localhost:3001/style.css");
    expect(link.tagName).toBe("LINK");
    expect(link.href).toContain("style.css");
    expect(el.shadowRoot!.contains(link)).toBe(true);
  });
});

describe("ensureHorizonElement", () => {
  beforeEach(() => {
    // Remove any leftover horizon-app elements
    document.querySelectorAll("horizon-app").forEach((el) => el.remove());
  });

  it("creates and appends a <horizon-app> when none exists", () => {
    const el = ensureHorizonElement("my-app");
    expect(el).toBeInstanceOf(HorizonAppElement);
    expect(el.getAttribute("name")).toBe("my-app");
    expect(document.body.contains(el)).toBe(true);
  });

  it("returns the existing element when one already exists", () => {
    const first = ensureHorizonElement("shared-app");
    const second = ensureHorizonElement("shared-app");
    expect(first).toBe(second);
    expect(document.querySelectorAll('horizon-app[name="shared-app"]')).toHaveLength(1);
  });
});
