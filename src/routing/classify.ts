import type { AppConfigResolved } from "../core/types";
import { toActiveRuleFn } from "./active-rule";

export interface RouteClassification<T> {
  toMount: T[];
  toUnmount: T[];
  toPause: T[];
  toResume: T[];
}

export interface AppForRouting {
  config: AppConfigResolved;
  status: string;
}

const NEEDS_MOUNT_STATUSES = new Set([
  "NOT_LOADED",
  "NOT_BOOTSTRAPPED",
  "NOT_MOUNTED",
]);

export function classifyAppsByRoute<T extends AppForRouting>(
  apps: ReadonlyArray<T>,
  location: Location,
): RouteClassification<T> {
  const toMount: T[] = [];
  const toUnmount: T[] = [];
  const toPause: T[] = [];
  const toResume: T[] = [];

  for (const app of apps) {
    const active = toActiveRuleFn(app.config.activeRule)(location);
    const keepAlive = app.config.keepAlive ?? false;

    if (active) {
      if (NEEDS_MOUNT_STATUSES.has(app.status)) {
        toMount.push(app);
      } else if (app.status === "PAUSED") {
        toResume.push(app);
      }
    } else {
      if (app.status === "MOUNTED") {
        if (keepAlive) {
          toPause.push(app);
        } else {
          toUnmount.push(app);
        }
      }
    }
  }

  return { toMount, toUnmount, toPause, toResume };
}
