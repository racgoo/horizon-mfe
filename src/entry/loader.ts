import type { AppEntry, AppLifecycles } from "../core/types";
import type { Sandbox } from "../runtime/sandbox";
import { errFailedToFetchScript } from "../core/constants";
import { fetchHTMLEntryWithRetry, normalizeEntryUrl } from "./entry-fetcher";

// ─── Asset Injection ──────────────────────────────────────────────────────────

function injectStyle(url: string, target?: ShadowRoot): HTMLLinkElement {
  const root: Document | ShadowRoot = target ?? document;
  const head: Element | ShadowRoot = target ?? document.head;

  const existing = (root as Document | ShadowRoot).querySelector<HTMLLinkElement>(
    `link[data-horizon-style="${CSS.escape(url)}"]`,
  );
  if (existing) return existing;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.dataset.horizonStyle = url;
  head.appendChild(link);
  return link;
}

/**
 * Injects an external ES module script into document.head.
 *
 * ISOLATION WARNING: ES modules execute in the real global scope — they are NOT
 * sandboxed. This is a browser-level constraint: modules have their own lexical
 * scope but share the real `window` object. Child apps built as ES modules
 * (e.g. Vite's default output) cannot be isolated by the ProxySandbox.
 * Use IIFE/UMD builds for full JS isolation.
 */
function injectModuleScript(url: string): Promise<void> {
  const existing = document.head.querySelector(
    `script[data-horizon-module="${CSS.escape(url)}"]`,
  );
  if (existing) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = url;
    script.dataset.horizonModule = url;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", (e) => reject(e), { once: true });
    document.head.appendChild(script);
  });
}

/** Same isolation warning as injectModuleScript — inline modules run in real global scope. */
function injectInlineModuleScript(code: string, entryUrl: string): Promise<void> {
  const key = CSS.escape(
    btoa(code.slice(0, 80).replace(/[^a-zA-Z0-9]/g, "")).slice(0, 32),
  );
  if (document.head.querySelector(`script[data-horizon-inline="${key}"]`)) {
    return Promise.resolve();
  }

  const origin = new URL(entryUrl).origin;
  const rewritten = code.replace(
    /(from\s+|import\s+)["'](\/[^"']+)["']/g,
    (_, kw, path) => `${kw}"${origin}${path}"`,
  );

  const blob = new Blob([rewritten], { type: "application/javascript" });
  const blobUrl = URL.createObjectURL(blob);

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = blobUrl;
    script.dataset.horizonInline = key;
    script.addEventListener(
      "load",
      () => {
        URL.revokeObjectURL(blobUrl);
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      (e) => {
        URL.revokeObjectURL(blobUrl);
        reject(e);
      },
      { once: true },
    );
    document.head.appendChild(script);
  });
}

/**
 * Executes a script string inside the sandbox proxy context.
 * Wraps code in an IIFE with `window`, `self`, `globalThis` rebound to the proxy,
 * so all global reads/writes are intercepted by the sandbox.
 */
function execScript(code: string, sandbox: Sandbox, scriptUrl = "inline"): void {
  const wrapped = `;(function(window, self, globalThis){${code}\n}).call(this, this, this, this);`;
  try {
    const fn = new Function(wrapped);
    fn.call(sandbox.proxy);
  } catch (e) {
    console.error(`[horizon] Error executing script ${scriptUrl}:`, e);
    throw e;
  }
}

async function fetchAndExecScript(url: string, sandbox: Sandbox): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(errFailedToFetchScript(url, res.status));
  const code = await res.text();
  execScript(code, sandbox, url);
}

// ─── Public API ────────────────────────────────────────────────────────────────

export interface LoadResult {
  lifecycles: Partial<AppLifecycles>;
  styleElements: HTMLLinkElement[];
  html: string;
}

export interface LoadAppOptions {
  styleTarget?: ShadowRoot;
}

/**
 * Loads a child app entry: fetches HTML, injects styles, executes scripts in sandbox.
 *
 * The sandbox must already be activated by the caller (app.ts) before calling this function.
 * Regular (IIFE/UMD) scripts run inside the sandbox proxy. ES module scripts run in real
 * global scope — see injectModuleScript for the isolation caveat.
 */
export async function loadApp(
  entry: AppEntry,
  sandbox: Sandbox,
  options?: LoadAppOptions,
): Promise<LoadResult> {
  let scripts: string[];
  let moduleScripts: string[];
  let inlineModuleScripts: string[];
  let inlineScripts: string[];
  let styles: string[];
  let html: string;
  let htmlEntryBase: string | null = null;

  if (typeof entry === "string") {
    const entryUrl = normalizeEntryUrl(entry);
    htmlEntryBase = new URL(entryUrl).href.replace(/\/?$/, "/");
    ({ scripts, moduleScripts, inlineModuleScripts, inlineScripts, styles, html } =
      await fetchHTMLEntryWithRetry(entryUrl));
  } else {
    scripts = entry.scripts;
    moduleScripts = [];
    inlineModuleScripts = [];
    inlineScripts = [];
    styles = entry.styles ?? [];
    html = entry.html ?? "";
  }

  const styleTarget = options?.styleTarget;
  const styleElements = styles.map((url) => injectStyle(url, styleTarget));

  // Execute IIFE/UMD scripts inside the sandbox proxy (sandbox activated by app.ts)
  for (const src of scripts) {
    await fetchAndExecScript(src, sandbox);
  }
  for (const code of inlineScripts) {
    execScript(code, sandbox);
  }

  // ES module scripts run in real global scope — see isolation warning on injectModuleScript
  if (htmlEntryBase !== null) {
    for (const code of inlineModuleScripts) {
      await injectInlineModuleScript(code, htmlEntryBase);
    }
  }
  for (const src of moduleScripts) {
    await injectModuleScript(src);
  }

  const proxy = sandbox.proxy as unknown as Record<string, unknown>;
  const lifecycles: Partial<AppLifecycles> =
    (proxy["__HORIZON_LIFECYCLE__"] as Partial<AppLifecycles> | undefined) ?? {};

  return { lifecycles, styleElements, html };
}

export { injectStyle };
