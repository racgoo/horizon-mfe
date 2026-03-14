/**
 * Watch for route changes (history API and hash) and call onChange.
 * Patches history.pushState/replaceState; returns cleanup.
 */
export function watchRouter(onChange: () => void): () => void {
  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);

  history.pushState = function (...args) {
    originalPush(...args);
    onChange();
  };

  history.replaceState = function (...args) {
    originalReplace(...args);
    onChange();
  };

  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);

  return () => {
    history.pushState = originalPush;
    history.replaceState = originalReplace;
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
  };
}
