import type { ActiveRule } from "../core/types";

export function toActiveRuleFn(rule: ActiveRule): (loc: Location) => boolean {
  if (typeof rule === "function") return rule;
  return (loc) => loc.pathname.startsWith(rule);
}
