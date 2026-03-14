# horizon-mfe(beta WIP)

**Version:** 0.0.3

[![npm version](https://img.shields.io/npm/v/horizon-mfe)](https://www.npmjs.com/package/horizon-mfe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**README-Language-Map** [EN [English]](https://github.com/racgoo/horizon-mfe) / [KR [한국어]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ko.md) / [中文 [简体]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.zh.md) / [日本語](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ja.md) / [Español](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.sp.md) / [Français](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.fr.md) / [हिन्दी](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.hi.md) / [Русский](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ru.md) / [العربية](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.arc.md)

A lightweight micro-frontend framework.

- **Zero dependencies** — ~8 kB gzipped
- **Framework adapters** — React, Vue 3, Solid, Svelte 4, Ember / custom (`horizon-mfe/*`)
- **HTML entry loading** — point at a URL, Horizon fetches and executes everything
- **JS sandbox** — Proxy-based window isolation per app (SnapshotSandbox fallback for legacy browsers)
- **CSS isolation** — `data-horizon-app` scoping or Shadow DOM
- **Route-based activation** — path prefix or custom predicate
- **Keep-alive** — preserve app state across route switches; show/hide without re-mounting
- **Shared state** — typed cross-app state sync via the built-in event bus
- **TypeScript-first** — full type definitions included

---

## Installation

```bash
pnpm add horizon-mfe
# or
npm install horizon-mfe
```

---

## Quick Start

### Simplified API (`createHorizon`)

The single-call entry point. Registers apps and starts Horizon in one shot.

```ts
import { createHorizon } from "horizon-mfe";

createHorizon({
  container: "#app-container",
  keepAlive: true, // preserve state across route switches
  apps: [
    { name: "cart", entry: "http://localhost:3001", route: "/cart" },
    { name: "dashboard", entry: "http://localhost:3002", route: "/dashboard" },
  ],
  onMount: async (app) => console.log("mounted", app.name),
  onUnmount: async (app) => console.log("unmounted", app.name),
  onPause: async (app) => console.log("paused", app.name),
  onResume: async (app) => console.log("resumed", app.name),
});
```

### Classic API (`registerApp` + `start`)

Still fully supported — useful when you need fine-grained control.

```ts
import { registerApp, start } from "horizon-mfe";

registerApp([
  {
    name: "cart",
    entry: "http://localhost:3001",
    container: "#app-container",
    activeRule: "/cart",
  },
  {
    name: "dashboard",
    entry: "http://localhost:3002",
    container: "#app-container",
    activeRule: "/dashboard",
  },
]);

start({
  beforeMount: async (app) => {
    /* return false to cancel */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
});
```

### Child App (any framework)

Export lifecycle hooks via `window.__HORIZON_LIFECYCLE__`. Works with every framework.

```ts
// src/horizon.ts
window.__HORIZON_LIFECYCLE__ = {
  async bootstrap() {
    await loadConfig()           // called once before the first mount
  },

  async mount({ container, eventBus, name, pathname }) {
    render(<App />, container)
    eventBus.on('user:login', ({ userId }) => { /* ... */ })
  },

  async unmount({ container }) {
    unmountComponentAtNode(container)
  },

  async onPause(props)  { /* DOM hidden, state preserved  */ },
  async onResume(props) { /* DOM shown again              */ },
}
```

---

## Framework Adapters

Each adapter wraps the lifecycle boilerplate so **child apps have zero direct Horizon imports**.
Install the adapter alongside the child app.

### React (`horizon-mfe/react`)

```bash
pnpm add horizon-mfe react react-dom
```

**Child app:**

```tsx
// src/main.tsx
import { defineApp } from "horizon-mfe/react";
import App from "./App";

defineApp(App);
// or with options:
defineApp(App, {
  onBootstrap: async () => await loadConfig(),
  onMount: (props) => {},
  onUnmount: () => {},
  onPause: (props) => {},
  onResume: (props) => {},
  mapProps: (props) => ({ ...props.props }), // transform Horizon props before passing to root
});
```

**Host app (React):**

```tsx
import { useHorizonHost, useHostSharedState } from "horizon-mfe/react";

function App() {
  const { pathname, navigate } = useHorizonHost({
    container: "#app-container",
    keepAlive: true,
    apps: [
      { name: "child-react", entry: "http://localhost:3002", route: "/react" },
    ],
  });
  const [count] = useHostSharedState<number>("count", 0);

  return (
    <>
      <nav>
        <a
          className={pathname === "/react" ? "active" : ""}
          onClick={() => navigate("/react")}
        >
          React
        </a>
      </nav>
      <span>Shared count: {count}</span>
      <div id="app-container" />
    </>
  );
}
```

**Shared state (child):**

```tsx
import { useSharedState } from "horizon-mfe/react";

function Counter() {
  const [count, setCount] = useSharedState<number>("count", 0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Router sync (keep-alive + React Router):**

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

function RouterSync() {
  useRouteSync(useNavigate());
  return null;
}
// Render <RouterSync /> as a sibling of <Routes> inside <BrowserRouter>
```

---

### Vue 3 (`horizon-mfe/vue`)

```bash
pnpm add horizon-mfe vue
```

**Child app:**

```ts
// src/main.ts
import { defineApp } from "horizon-mfe/vue";
import App from "./App.vue";
import router from "./router";

defineApp(App, {
  setup: (app, props) => app.use(router), // install plugins before mount
  onPause: (props) => {},
  onResume: (props) => {},
});
```

Access Horizon props inside any component:

```vue
<script setup lang="ts">
import { inject } from "vue";
import { HorizonPropsKey } from "horizon-mfe/vue";

const horizonProps = inject(HorizonPropsKey);
horizonProps?.eventBus.emit("my:event", { data: 123 });
</script>
```

**Shared state (child composable):**

```ts
import { useSharedState } from "horizon-mfe/vue";

const [count, setCount] = useSharedState<number>("count", 0);
// count is a Vue Ref<number> — use count.value in script, or {{ count }} in template
```

**Host app (Vue):**

```ts
import { useHorizonHost, useHostSharedState } from "horizon-mfe/vue";

const { pathname, navigate } = useHorizonHost({
  container: "#app-container",
  keepAlive: true,
  apps: [{ name: "child-vue", entry: "http://localhost:3003", route: "/vue" }],
});
const [count] = useHostSharedState<number>("count", 0);
```

---

### Solid (`horizon-mfe/solid`)

```bash
pnpm add horizon-mfe solid-js
```

```tsx
// src/main.tsx
import { defineApp } from "horizon-mfe/solid";
import App from "./App";

defineApp(App);
```

**Shared state:**

```tsx
import { useSharedState } from "horizon-mfe/solid";

const [count, setCount] = useSharedState<number>("count", 0);
return <div>{count()}</div>; // count() — Solid signal accessor
```

---

### Svelte 4 (`horizon-mfe/svelte`)

```bash
pnpm add horizon-mfe svelte
```

```ts
// src/main.ts
import { defineApp } from "horizon-mfe/svelte";
import App from "./App.svelte";

defineApp(App);
```

**Shared state (Svelte writable store):**

```svelte
<script>
  import { useSharedState } from 'horizon-mfe/svelte'
  const count = useSharedState('count', 0)
</script>
<button on:click={() => $count += 1}>{$count}</button>
```

**Host app (Svelte):**

```ts
import { useHorizonHost, useHostSharedState } from 'horizon-mfe/svelte'

const { pathname, navigate } = useHorizonHost({ ... })
const count = useHostSharedState('count', 0)
```

---

### Ember / Custom (`horizon-mfe/ember`)

The Ember adapter accepts a plain lifecycle object — useful for Ember or any framework that manages its own rendering.

```ts
import { defineApp } from "horizon-mfe/ember";
import Application from "@ember/application";

const app = new Application(/* ... */);

defineApp({
  async mount(props) {
    await app.visit("/", { rootElement: props.container });
  },
  unmount() {
    app.destroy();
  },
  onBootstrap: async () => {},
  onPause: async (props) => {},
  onResume: async (props) => {},
});
```

---

## API Reference

### `createHorizon(options)`

Simplified one-call setup.

| Field            | Type                       | Description                                             |
| ---------------- | -------------------------- | ------------------------------------------------------- |
| `apps`           | `CreateHorizonAppConfig[]` | App definitions (use `route` as alias for `activeRule`) |
| `container`      | `string \| HTMLElement`    | Default container for all apps                          |
| `keepAlive`      | `boolean`                  | Default keep-alive for all apps                         |
| `onMount`        | `(app) => Promise<void>`   | Called after each app mounts                            |
| `onUnmount`      | `(app) => Promise<void>`   | Called before each app unmounts                         |
| `onPause`        | `(app) => Promise<void>`   | Called when a keep-alive app is hidden                  |
| `onResume`       | `(app) => Promise<void>`   | Called when a keep-alive app is shown                   |
| `onRouteChange`  | `() => void`               | Called on every route change                            |
| `exposeNavigate` | `boolean`                  | Expose `window.navigateTo` globally (default `true`)    |

---

### `registerApp(config | config[])`

Register one or more apps. Can be called before or after `start()`.

| Field        | Type                                    | Description                              |
| ------------ | --------------------------------------- | ---------------------------------------- |
| `name`       | `string`                                | Unique identifier                        |
| `entry`      | `string \| { scripts, styles?, html? }` | HTML entry URL or explicit asset list    |
| `container`  | `string \| HTMLElement`                 | CSS selector or element to mount into    |
| `activeRule` | `string \| (location) => boolean`       | Path prefix or custom predicate          |
| `keepAlive`  | `boolean`                               | Preserve state across route switches     |
| `props`      | `Record<string, unknown>`               | Extra props forwarded to lifecycle hooks |

```ts
// HTML entry (recommended)
registerApp({ entry: 'http://localhost:3001', ... })

// Explicit asset list — skip HTML parsing
registerApp({ entry: { scripts: ['http://localhost:3001/app.iife.js'] }, ... })
```

---

### `start(config?)`

Start route watching and immediately mount matching apps.

```ts
start({
  beforeMount: async (app) => {
    /* return false to cancel */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
  onPause: async (app) => {},
  onResume: async (app) => {},
  onRouteChange: () => {},
  exposeNavigate: true, // expose window.navigateTo globally (default true)
});
```

---

### `navigateTo(path)`

Pushes a new history entry and triggers Horizon's re-route logic.

```ts
import { navigateTo } from "horizon-mfe";
navigateTo("/dashboard");
```

Also exposed on `window.navigateTo` and `window.navigate` by default.

---

### `getApp(name)`

Get a registered `App` instance for status inspection or manual control.

```ts
const app = getApp("dashboard");
console.log(app?.status);
// "NOT_LOADED" | "LOADING" | "NOT_BOOTSTRAPPED" | "BOOTSTRAPPING"
// | "NOT_MOUNTED" | "MOUNTING" | "MOUNTED" | "UNMOUNTING"
// | "PAUSING" | "PAUSED" | "RESUMING" | "LOAD_ERROR"
```

---

## Event Bus

Typed cross-app communication and shared state — zero config.

```ts
import { eventBus } from 'horizon-mfe'

// Emit a one-off event
eventBus.emit('cart:updated', { count: 3 })

// Subscribe (returns an unsubscribe function)
const off = eventBus.on('cart:updated', ({ count }) => updateBadge(count))

// Listen once
eventBus.once('user:logout', () => clearSession())

// Shared state — setState broadcasts "store:<key>" and persists the value
eventBus.setState('theme', 'dark')
eventBus.getState('theme')   // "dark"

// Inside a child app, use props.eventBus (same singleton)
async mount({ eventBus }) {
  eventBus.on('theme:change', applyTheme)
}
```

The framework adapters expose `useSharedState` / `useHostSharedState` hooks that wrap `setState` / `getState` automatically.

---

## Keep-Alive

When `keepAlive: true` is set on an app, Horizon hides the DOM instead of destroying it when the route changes. State, timers, and subscriptions survive navigations.

```ts
createHorizon({
  keepAlive: true, // applies to all apps
  apps: [
    { name: "cart", entry: "...", route: "/cart", keepAlive: false },
    // ^ override per-app
  ],
});
```

| Event      | Normal                        | Keep-Alive                   |
| ---------- | ----------------------------- | ---------------------------- |
| Route away | `unmount` called, DOM removed | `onPause` called, DOM hidden |
| Route back | `mount` called, DOM recreated | `onResume` called, DOM shown |

### Route Sync with Keep-Alive

When a child app has its own SPA router (React Router, Vue Router, etc.), that router's internal state can fall out of sync with the host URL while the app is paused. Consider this sequence:

1. User navigates to `/cart/checkout` inside the cart child app
2. Host navigates to `/dashboard` — cart is **paused** (DOM hidden, state preserved)
3. Host navigates back to `/cart` — cart **resumes**, but its router still points to `/cart/checkout`

The `onResume` lifecycle hook receives `props.pathname` (the current host URL). Pass it to your framework's router to re-sync.

#### React — `onResume` with data router (recommended)

With the modern `createBrowserRouter` + `RouterProvider` pattern, the router instance lives outside the React tree, so call `router.navigate` directly in `onResume`:

```tsx
import { defineApp } from "horizon-mfe/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";

const router = createBrowserRouter([{ path: "/cart/*", element: <App /> }]);

defineApp(() => <RouterProvider router={router} />, {
  onResume({ pathname }) {
    router.navigate(pathname, { replace: true });
  },
});
```

#### React — `useRouteSync` with legacy `BrowserRouter`

If your app uses `<BrowserRouter>`, use `useRouteSync` inside the router context instead. It listens to the `horizon:app:resume` custom event dispatched on resume:

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

// Render this as a sibling of <Routes>, inside <BrowserRouter>
function RouterSync() {
  useRouteSync(useNavigate());
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <RouterSync />
      <Routes>...</Routes>
    </BrowserRouter>
  );
}
```

#### Vue Router — `onResume` option

`horizon-mfe/vue` also dispatches `horizon:app:resume`, but the simplest approach is the `onResume` option:

```ts
import { defineApp } from "horizon-mfe/vue";
import App from "./App.vue";
import router from "./router";

defineApp(App, {
  setup: (app) => app.use(router),
  onResume: async ({ pathname }) => {
    await router.push(pathname);
  },
});
```

Or, if you prefer to handle it inside a composable, listen to the custom event directly:

```ts
// composables/useRouteSync.ts
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

export function useRouteSync() {
  const router = useRouter();
  const handler = (e: Event) => {
    const pathname = (e as CustomEvent<{ pathname: string }>).detail?.pathname;
    if (pathname) router.push(pathname);
  };
  onMounted(() => window.addEventListener("horizon:app:resume", handler));
  onUnmounted(() => window.removeEventListener("horizon:app:resume", handler));
}
```

#### Vanilla / other frameworks

Use the `onResume` lifecycle hook directly with your router's imperative navigate:

```ts
window.__HORIZON_LIFECYCLE__ = {
  async mount({ container }) {
    /* ... */
  },
  async unmount() {
    /* ... */
  },
  async onResume({ pathname }) {
    router.navigate(pathname);
  },
};
```

> **Why isn't this automatic?** Horizon doesn't auto-navigate child routers on resume — some apps use hash routing, relative paths, or have no router at all. `onResume` gives you explicit control.

---

## CSS Isolation

> **⚠️ CSS can conflict.** Child app styles are injected into the document and can clash with the host or other apps. To avoid conflicts, you **must** use one of: **(1) Shadow DOM** via `<horizon-app>`, **(2) scope all selectors** with `[data-horizon-app="<name>"]`, or **(3) hashed/scoped class names** (e.g. CSS Modules). Do not rely on global, unscoped styles.

### Scope Attribute (default)

Horizon adds `data-horizon-app="<name>"` to the container element. This is a **convention-based** approach — child apps must prefix all their CSS selectors accordingly for scoping to work. Stylesheets are still injected into `document.head`.

```css
/* child app CSS must be written like this */
[data-horizon-app="dashboard"] .header {
  color: red;
}
```

### Shadow DOM — `<horizon-app>` Custom Element

For **true CSS encapsulation**, use the `<horizon-app>` custom element. Horizon automatically attaches a Shadow DOM to it, so child styles cannot leak out and host styles cannot bleed in.

```html
<!-- in host HTML, instead of a plain <div> container -->
<horizon-app name="cart"></horizon-app>
```

```ts
import { HorizonAppElement } from "horizon-mfe";
// auto-registers <horizon-app> on import
```

When a `<horizon-app>` element is present in the DOM, Horizon mounts the child inside its Shadow Root instead of a plain container. Stylesheets are injected into the shadow root and are fully scoped.

> **Browser compatibility:** `attachShadow` is supported in all modern browsers (Chrome 53+, Firefox 63+, Safari 10+, Edge 79+). If Shadow DOM is unavailable, Horizon automatically falls back to `scopeAttribute` mode and logs a warning.

> **Caveat:** Shadow DOM can break global modals or portals that render outside the container (e.g. some UI libraries inject tooltips into `document.body`).

---

## JS Sandbox

Each child app gets its own isolated `window` proxy. Globals set by the child are stored in a per-app Map and never written to the real `window`, so they cannot leak to the host or other apps.

- **ProxySandbox** — used automatically in all modern browsers
- **SnapshotSandbox** — automatic fallback for legacy environments (snapshots/restores real `window` on deactivate)

**Lifecycle:** sandbox activates when the app loads (scripts execute in sandbox context), stays active through mount/pause/resume, and is fully cleared on unmount.

### Isolation guarantees

| Script type                    | Isolation                                                                                                            |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| IIFE / UMD bundle              | ✅ Fully isolated — real `window` never modified                                                                     |
| Inline scripts                 | ✅ Fully isolated                                                                                                    |
| `<script type="module">` (ESM) | ⚠️ **Not sandboxed** — browsers execute ES modules in the real global scope. Use IIFE/UMD builds for full isolation. |

---

## Known Limitations

### ES Modules are not sandboxed

Child apps built as ES modules (`<script type="module">`) execute in the real global scope — this is a browser-level constraint that cannot be worked around. Use **IIFE or UMD** output format in your child app's build config for full JS isolation.

```ts
// vite.config.ts (child app)
build: {
  lib: {
    formats: ["iife"];
  }
}
```

### Content Security Policy

Horizon executes IIFE/UMD scripts via `new Function()`, which requires `unsafe-eval` in your CSP:

```
Content-Security-Policy: script-src 'self' 'unsafe-eval';
```

If your deployment enforces a strict CSP that disallows `unsafe-eval`, use the explicit asset list entry format (`entry: { scripts: [...] }`) with a CDN/service that serves pre-trusted bundles, or reconsider the sandbox approach for your threat model.

### Global namespace pollution

By default, `navigateTo` is exposed as `window.navigate` and `window.navigateTo`. Disable this if it conflicts with existing globals:

```ts
createHorizon({ ..., exposeNavigate: false })
// or
start({ exposeNavigate: false })
```

---

## Child App Lifecycle

```
NOT_LOADED
   │ load()          fetch HTML / scripts, execute in sandbox
NOT_BOOTSTRAPPED
   │ bootstrap()     one-time setup (called once per session)
NOT_MOUNTED
   │ mount()   ←──────────────────────────────────┐
MOUNTED                                            │
   │ unmount() ──────────────────────────────────→ NOT_MOUNTED
   │
   │ (keepAlive only)
   │ onPause()  ─────────────────────────────────→ PAUSED
   │ onResume() ─────────────────────────────────→ MOUNTED
```

---

## Running the Examples

The repo ships runnable examples for every supported host framework, all sharing the same six child apps.

### Child apps (ports are fixed across all examples)

| Package         | Port | Stack                 |
| --------------- | ---- | --------------------- |
| `child-vanilla` | 3001 | Vanilla TS            |
| `child-react`   | 3002 | React 18              |
| `child-vue`     | 3003 | Vue 3                 |
| `child-solid`   | 3004 | Solid                 |
| `child-svelte`  | 3005 | Svelte 4              |
| `child-ember`   | 3006 | Ember-style lifecycle |

### Host apps (all on port 3000)

| Command                | Host                                  |
| ---------------------- | ------------------------------------- |
| `pnpm example:vanilla` | Vanilla TS                            |
| `pnpm example:react`   | React + `horizon-mfe/react` hooks     |
| `pnpm example:vue`     | Vue 3 + `horizon-mfe/vue` composables |
| `pnpm example:solid`   | Solid                                 |
| `pnpm example:svelte`  | Svelte 4                              |
| `pnpm example:ember`   | Ember-style lifecycle                 |

```bash
# Install everything
pnpm install

# Pick a host and start all servers
pnpm example:vanilla   # or :react / :vue / :solid / :svelte / :ember
```

Then open **http://localhost:3000**.

> **How it works:** child apps build as IIFE bundles (`vite build --watch`) and are served by `vite preview`. The host fetches these bundles, executes them inside a JS sandbox, and mounts/unmounts based on the current route.

### Manual start

```bash
# Terminal 1 — watch-build the core library
pnpm dev

# Terminal 2-7 — child apps
pnpm --filter child-vanilla dev
pnpm --filter child-react   dev
pnpm --filter child-vue     dev
pnpm --filter child-solid   dev
pnpm --filter child-svelte  dev
pnpm --filter child-ember   dev

# Terminal 8 — host (pick one)
pnpm --filter host-vanilla dev
pnpm --filter host-react   dev
pnpm --filter host-vue     dev
```

---

## Contributing

Contributions are welcome! Feel free to open issues for bug reports or feature requests, and pull requests are always appreciated.

---

## License

MIT
