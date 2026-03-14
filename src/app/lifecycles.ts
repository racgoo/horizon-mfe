import type { AppLifecycles } from "../core/types";
import { errLifecycleHooksRequired } from "../core/constants";

export function normalizeLifecycles(
  raw: Partial<AppLifecycles>,
  appName: string,
): AppLifecycles {
  if (typeof raw.mount !== "function" || typeof raw.unmount !== "function") {
    throw new Error(errLifecycleHooksRequired(appName));
  }
  return {
    bootstrap: raw.bootstrap,
    mount: raw.mount,
    unmount: raw.unmount,
    update: raw.update,
    onPause: raw.onPause,
    onResume: raw.onResume,
  };
}
