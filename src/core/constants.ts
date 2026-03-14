/**
 * Horizon error message prefixes and helpers.
 * Centralising these makes it easier to change wording or add i18n later.
 */

const PREFIX = "[horizon]";

export function errContainerNotFound(appName: string, selector: string): string {
  return `${PREFIX} Container not found for app "${appName}": ${selector}`;
}

export function errAppMustHaveRoute(appName: string): string {
  return `${PREFIX} App "${appName}" must have "activeRule" or "route" defined`;
}

export function errCreateHorizonAppMustHaveRoute(appName: string): string {
  return `${PREFIX} createHorizon: app "${appName}" must have "route" or "activeRule"`;
}

export function errLifecycleHooksRequired(appName: string): string {
  return `${PREFIX} App "${appName}" must export "mount" and "unmount" lifecycle hooks via window.__HORIZON_LIFECYCLE__`;
}

export function errFailedToFetchEntry(url: string, status?: number): string {
  return status != null
    ? `${PREFIX} Failed to fetch entry: ${url} (${status})`
    : `${PREFIX} Failed to fetch entry: ${url}`;
}

export function errFailedToFetchScript(url: string, status: number): string {
  return `${PREFIX} Failed to fetch script: ${url} (${status})`;
}

