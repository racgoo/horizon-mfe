import {
  extractBody,
  extractStyles,
  extractScripts,
  type ParsedEntry,
  type UrlResolver,
} from "./html-parser";
import { errFailedToFetchEntry } from "../core/constants";

const HTML_ENTRY_RETRIES = 5;
const HTML_ENTRY_RETRY_DELAY_MS = 700;

export function normalizeEntryUrl(url: string): string {
  const u = new URL(url);
  if (!u.pathname || u.pathname === "") u.pathname = "/";
  return u.href;
}

export async function parseHTMLEntry(url: string): Promise<ParsedEntry> {
  const normalized = normalizeEntryUrl(url);
  const res = await fetch(normalized);
  if (!res.ok) throw new Error(errFailedToFetchEntry(normalized, res.status));
  const raw = await res.text();
  const base = new URL(normalized);
  const resolve: UrlResolver = (src) => new URL(src, base).href;
  let html = raw.replace(/<!--[\s\S]*?-->/g, "");
  const { html: htmlAfterStyles, styles } = extractStyles(html, resolve);
  const { html: htmlAfterScripts, out: scriptOut } = extractScripts(htmlAfterStyles, resolve);
  const bodyHtml = extractBody(htmlAfterScripts);
  return {
    html: bodyHtml,
    scripts: scriptOut.scripts,
    moduleScripts: scriptOut.moduleScripts,
    inlineModuleScripts: scriptOut.inlineModuleScripts,
    inlineScripts: scriptOut.inlineScripts,
    styles,
  };
}

export async function fetchHTMLEntryWithRetry(url: string): Promise<ParsedEntry> {
  for (let i = 0; i < HTML_ENTRY_RETRIES; i++) {
    try {
      return await parseHTMLEntry(url);
    } catch (e) {
      const isNetworkError =
        e instanceof TypeError ||
        (e instanceof Error &&
          (e.message.includes("fetch") || e.message.includes("Failed to fetch")));
      if (!isNetworkError || i === HTML_ENTRY_RETRIES - 1) throw e;
      await new Promise((r) => setTimeout(r, HTML_ENTRY_RETRY_DELAY_MS));
    }
  }
  // Unreachable: the last iteration always throws. Required for TypeScript exhaustiveness.
  throw new Error(errFailedToFetchEntry(url));
}
