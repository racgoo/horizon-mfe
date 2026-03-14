/** Resolver for relative URLs in extracted link/script src. */
export type UrlResolver = (src: string) => string;

export interface ParsedEntry {
  html: string;
  scripts: string[];
  moduleScripts: string[];
  inlineModuleScripts: string[];
  inlineScripts: string[];
  styles: string[];
}

export interface ExtractedScripts {
  scripts: string[];
  moduleScripts: string[];
  inlineModuleScripts: string[];
  inlineScripts: string[];
}

export function extractBody(html: string): string {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1].trim() : html.trim();
}

export function extractStyles(
  html: string,
  resolve: UrlResolver,
): { html: string; styles: string[] } {
  const styles: string[] = [];
  const newHtml = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, (tag) => {
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href) styles.push(resolve(href));
    return "";
  });
  return { html: newHtml, styles };
}

export function extractScripts(
  html: string,
  resolve: UrlResolver,
): { html: string; out: ExtractedScripts } {
  const scripts: string[] = [];
  const moduleScripts: string[] = [];
  const inlineModuleScripts: string[] = [];
  const inlineScripts: string[] = [];
  const newHtml = html.replace(/<script[\s\S]*?<\/script>/gi, (tag) => {
    const src = tag.match(/src=["']([^"']+)["']/i)?.[1];
    const isModule = /type=["']module["']/i.test(tag);
    if (src) {
      if (isModule) moduleScripts.push(resolve(src));
      else scripts.push(resolve(src));
    } else if (isModule) {
      const content = (/<script[^>]*>([\s\S]*?)<\/script>/i.exec(tag)?.[1] ?? "").trim();
      if (content) inlineModuleScripts.push(content);
    } else {
      const content = (/<script[^>]*>([\s\S]*?)<\/script>/i.exec(tag)?.[1] ?? "").trim();
      if (content) inlineScripts.push(content);
    }
    return "";
  });
  return { html: newHtml, out: { scripts, moduleScripts, inlineModuleScripts, inlineScripts } };
}
