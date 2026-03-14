import { createHorizon, navigateTo, eventBus } from "horizon-mfe";
import "./style.css";

// navigate / navigateTo are exposed on window by createHorizon() for onclick="navigate('/path')"

document.addEventListener("click", (e) => {
  const a = (e.target as HTMLElement).closest<HTMLAnchorElement>(
    "a[data-link]"
  );
  if (!a) return;
  e.preventDefault();
  navigateTo(a.getAttribute("href")!);
});

function syncHomeVisibility() {
  const isHome = location.pathname === "/";
  document.getElementById("home-content")!.style.display = isHome ? "" : "none";
  document.getElementById("app-container")!.classList.toggle("app-container--hidden", isHome);
}

function syncActiveLink() {
  document
    .querySelectorAll<HTMLAnchorElement>("nav a[data-link]")
    .forEach((a) => {
      const href = a.getAttribute("href")!;
      const active =
        href === "/"
          ? location.pathname === "/"
          : location.pathname.startsWith(href);
      a.classList.toggle("active", active);
    });
}

// ─── Event bus ────────────────────────────────────────────────────────────────

eventBus.on<number>("store:count", (value) => {
  document.getElementById("event-log-value")!.textContent = String(value);
});

// ─── Micro-apps ───────────────────────────────────────────────────────────────

createHorizon({
  container: "#app-container",
  keepAlive: true,
  onRouteChange: () => {
    syncHomeVisibility();
    syncActiveLink();
  },
  apps: [
    {
      name: "child-vanilla",
      entry: {
        scripts: ["http://localhost:3001/child-vanilla.iife.js"],
        styles: ["http://localhost:3001/style.css"],
      },
      route: "/vanilla",
    },
    { name: "child-react", entry: "http://localhost:3002", route: "/react" },
    { name: "child-vue", entry: "http://localhost:3003", route: "/vue" },
    { name: "child-solid", entry: "http://localhost:3004", route: "/solid" },
    { name: "child-svelte", entry: "http://localhost:3005", route: "/svelte" },
    { name: "child-ember", entry: "http://localhost:3006", route: "/ember" },
  ],
});
