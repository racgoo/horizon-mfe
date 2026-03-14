/**
 * Proxy-based JS sandbox for modern browsers.
 *
 * How it works:
 * - Creates a fake window object (inherits from real `window` via prototype).
 * - Wraps it in a Proxy that intercepts all get/set operations.
 * - `set`: stores child globals in a per-sandbox Map — real `window` is NEVER written to.
 * - `get`: reads from the Map first, then falls back to real `window`.
 * - References to `window`, `self`, and `globalThis` inside child code resolve to this proxy.
 *
 * Isolation guarantees:
 * - IIFE/UMD scripts: fully isolated. Each app has its own global namespace in the Map.
 * - Multiple concurrent apps: each has an independent Map, globals never cross-contaminate.
 *
 * Known limitation:
 * - ES module scripts (`<script type="module">`): NOT sandboxed — browsers execute modules
 *   in the real global scope. See loader.ts for details.
 *
 * Sandbox lifecycle: activate() before scripts execute → stays active through mount/pause/resume
 * → deactivate() on unmount clears the Map.
 */
export class ProxySandbox {
  readonly name: string;
  /** Per-app globals set by child scripts. Real `window` is never modified. */
  private globals = new Map<PropertyKey, unknown>();
  readonly proxy: Window;
  private active = false;

  constructor(name: string) {
    this.name = name;

    const self = this;
    const fakeWindow = Object.create(window) as Window;

    this.proxy = new Proxy(fakeWindow, {
      get(_target, key: PropertyKey): unknown {
        // Return proxy for self-references so child code stays in sandbox context
        if (key === "window" || key === "self" || key === "globalThis") {
          return self.proxy;
        }
        // Child-set globals take precedence over real window
        if (self.globals.has(key)) {
          return self.globals.get(key);
        }
        // Fall back to real window; bind functions so they execute with correct `this`
        const value = (window as unknown as Record<PropertyKey, unknown>)[key];
        if (typeof value === "function") {
          return (value as (...args: unknown[]) => unknown).bind(window);
        }
        return value;
      },

      set(_target, key: PropertyKey, value: unknown): boolean {
        // Ignore writes when inactive (e.g. after unmount)
        if (!self.active) return true;
        // Store in per-app Map — real window is never written to
        self.globals.set(key, value);
        return true;
      },

      has(_target, key: PropertyKey): boolean {
        return key in window;
      },
    });
  }

  activate(): void {
    this.active = true;
  }

  /** Clears all child globals. Real window was never modified, so no restoration is needed. */
  deactivate(): void {
    this.active = false;
    this.globals.clear();
  }
}

type WindowRecord = Record<string, unknown>;

/**
 * Snapshot-based JS sandbox for legacy browsers (no Proxy support).
 *
 * How it works:
 * - `proxy` IS the real `window` — no interception possible without Proxy.
 * - `activate()`: snapshots all current window properties, then restores any modifications
 *   this child app made during its previous session.
 * - `deactivate()`: diffs current window vs snapshot, saves child's changes, then restores
 *   the snapshot so the next app sees a clean window.
 *
 * Limitation: real `window` is modified while the app is active. Avoid concurrent mounting
 * of multiple apps in legacy environments.
 */
export class SnapshotSandbox {
  readonly name: string;
  /** In legacy environments, proxy is the real window — Proxy API is unavailable. */
  readonly proxy: Window = window;
  private snapshot: WindowRecord = {};
  private childModified: WindowRecord = {};

  constructor(name: string) {
    this.name = name;
  }

  activate(): void {
    // Save current window state before restoring this child's modifications
    this.snapshot = {};
    const w = window as unknown as WindowRecord;
    for (const key in window) {
      this.snapshot[key] = w[key];
    }
    // Re-apply changes this child made in its previous session
    for (const key of Object.keys(this.childModified)) {
      w[key] = this.childModified[key];
    }
  }

  deactivate(): void {
    // Record what this child modified, then restore the pre-activation snapshot
    this.childModified = {};
    const w = window as unknown as WindowRecord;
    for (const key in window) {
      if (w[key] !== this.snapshot[key]) {
        this.childModified[key] = w[key];
        w[key] = this.snapshot[key];
      }
    }
  }
}

export type Sandbox = ProxySandbox | SnapshotSandbox;

export function createSandbox(name: string): Sandbox {
  if (typeof Proxy !== "undefined") {
    return new ProxySandbox(name);
  }
  return new SnapshotSandbox(name);
}
