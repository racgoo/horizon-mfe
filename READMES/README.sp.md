# horizon-mfe(beta WIP)

**Version:** 0.0.2

[![npm version](https://img.shields.io/npm/v/horizon-mfe)](https://www.npmjs.com/package/horizon-mfe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**README idiomas** [EN [English]](https://github.com/racgoo/horizon-mfe) / [KR [한국어]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ko.md) / [中文 [简体]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.zh.md) / [日本語](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ja.md) / [Español](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.sp.md) / [Français](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.fr.md) / [हिन्दी](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.hi.md) / [Русский](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ru.md) / [العربية](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.arc.md)

Framework de micro-frontends ligero.

- **Cero dependencias** — ~8 kB gzipped
- **Adaptadores de frameworks** — React, Vue 3, Solid, Svelte 4, Ember / personalizado (`horizon-mfe/*`)
- **Carga por entrada HTML** — indica una URL, Horizon obtiene y ejecuta todo
- **Sandbox JS** — aislamiento de `window` por app con Proxy (SnapshotSandbox en navegadores legacy)
- **Aislamiento CSS** — ámbito `data-horizon-app` o Shadow DOM
- **Activación por ruta** — prefijo de path o predicado personalizado
- **Keep-alive** — conserva el estado entre cambios de ruta; mostrar/ocultar sin volver a montar
- **Estado compartido** — sincronización tipada entre apps con el event bus integrado
- **TypeScript-first** — definiciones de tipos incluidas

---

## Instalación

```bash
pnpm add horizon-mfe
# o
npm install horizon-mfe
```

---

## Inicio rápido

### API simplificada (`createHorizon`)

Punto de entrada en una sola llamada. Registra apps e inicia Horizon de una vez.

```ts
import { createHorizon } from "horizon-mfe";

createHorizon({
  container: "#app-container",
  keepAlive: true, // conservar estado entre cambios de ruta
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

### API clásica (`registerApp` + `start`)

Sigue totalmente soportada — útil cuando necesitas control fino.

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
    /* devolver false para cancelar */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
});
```

### App hija (cualquier framework)

Exporta los hooks de ciclo de vida vía `window.__HORIZON_LIFECYCLE__`. Funciona con cualquier framework.

```ts
// src/horizon.ts
window.__HORIZON_LIFECYCLE__ = {
  async bootstrap() {
    await loadConfig(); // se llama una vez antes del primer mount
  },

  async mount({ container, eventBus, name, pathname }) {
    render(<App />, container);
    eventBus.on("user:login", ({ userId }) => {
      /* ... */
    });
  },

  async unmount({ container }) {
    unmountComponentAtNode(container);
  },

  async onPause(props) {
    /* DOM oculto, estado preservado */
  },
  async onResume(props) {
    /* se llama al volver a mostrar */
  },
};
```

---

## Adaptadores de frameworks

Cada adaptador envuelve el boilerplate del ciclo de vida para que **las apps hijas no importen Horizon directamente**. Instala el adaptador en la app hija.

### React (`horizon-mfe/react`)

```bash
pnpm add horizon-mfe react react-dom
```

**App hija:**

```tsx
// src/main.tsx
import { defineApp } from "horizon-mfe/react";
import App from "./App";

defineApp(App);
// o con opciones:
defineApp(App, {
  onBootstrap: async () => await loadConfig(),
  onMount: (props) => {},
  onUnmount: () => {},
  onPause: (props) => {},
  onResume: (props) => {},
  mapProps: (props) => ({ ...props.props }), // transformar props de Horizon antes de pasar al root
});
```

**App host (React):**

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
      <span>Contador compartido: {count}</span>
      <div id="app-container" />
    </>
  );
}
```

**Estado compartido (hija):**

```tsx
import { useSharedState } from "horizon-mfe/react";

function Counter() {
  const [count, setCount] = useSharedState<number>("count", 0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Sincronización de router (keep-alive + React Router):**

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

function RouterSync() {
  useRouteSync(useNavigate());
  return null;
}
// Renderiza <RouterSync /> como hermano de <Routes> dentro de <BrowserRouter>
```

---

### Vue 3 (`horizon-mfe/vue`)

```bash
pnpm add horizon-mfe vue
```

**App hija:**

```ts
// src/main.ts
import { defineApp } from "horizon-mfe/vue";
import App from "./App.vue";
import router from "./router";

defineApp(App, {
  setup: (app, props) => app.use(router), // instalar plugins antes del mount
  onPause: (props) => {},
  onResume: (props) => {},
});
```

Acceso a las props de Horizon en cualquier componente:

```vue
<script setup lang="ts">
import { inject } from "vue";
import { HorizonPropsKey } from "horizon-mfe/vue";

const horizonProps = inject(HorizonPropsKey);
horizonProps?.eventBus.emit("my:event", { data: 123 });
</script>
```

**Estado compartido (composable en hija):**

```ts
import { useSharedState } from "horizon-mfe/vue";

const [count, setCount] = useSharedState<number>("count", 0);
// count es un Vue Ref<number> — usa count.value en script o {{ count }} en template
```

**App host (Vue):**

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

**Estado compartido:**

```tsx
import { useSharedState } from "horizon-mfe/solid";

const [count, setCount] = useSharedState<number>("count", 0);
return <div>{count()}</div>; // count() — accessor del signal de Solid
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

**Estado compartido (store writable de Svelte):**

```svelte
<script>
  import { useSharedState } from 'horizon-mfe/svelte'
  const count = useSharedState('count', 0)
</script>
<button on:click={() => $count += 1}>{$count}</button>
```

**App host (Svelte):**

```ts
import { useHorizonHost, useHostSharedState } from 'horizon-mfe/svelte'

const { pathname, navigate } = useHorizonHost({ ... })
const count = useHostSharedState('count', 0)
```

---

### Ember / personalizado (`horizon-mfe/ember`)

El adaptador Ember acepta un objeto de ciclo de vida plano — útil para Ember o cualquier framework que gestione su propio renderizado.

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

## Referencia API

### `createHorizon(options)`

Configuración en una sola llamada.

| Campo            | Tipo                       | Descripción                                                  |
| ---------------- | -------------------------- | ------------------------------------------------------------ |
| `apps`           | `CreateHorizonAppConfig[]` | Definiciones de apps (`route` es alias de `activeRule`)      |
| `container`      | `string \| HTMLElement`    | Contenedor por defecto para todas las apps                   |
| `keepAlive`      | `boolean`                  | Keep-alive por defecto para todas las apps                   |
| `onMount`        | `(app) => Promise<void>`   | Se llama después de montar cada app                          |
| `onUnmount`      | `(app) => Promise<void>`   | Se llama antes de desmontar cada app                         |
| `onPause`        | `(app) => Promise<void>`   | Se llama cuando una app keep-alive se oculta                 |
| `onResume`       | `(app) => Promise<void>`   | Se llama cuando una app keep-alive se muestra                |
| `onRouteChange`  | `() => void`               | Se llama en cada cambio de ruta                              |
| `exposeNavigate` | `boolean`                  | Exponer `window.navigateTo` globalmente (por defecto `true`) |

---

### `registerApp(config | config[])`

Registra una o más apps. Puede llamarse antes o después de `start()`.

| Campo        | Tipo                                    | Descripción                                     |
| ------------ | --------------------------------------- | ----------------------------------------------- |
| `name`       | `string`                                | Identificador único                             |
| `entry`      | `string \| { scripts, styles?, html? }` | URL de entrada HTML o lista explícita de assets |
| `container`  | `string \| HTMLElement`                 | Selector CSS o elemento donde montar            |
| `activeRule` | `string \| (location) => boolean`       | Prefijo de path o predicado personalizado       |
| `keepAlive`  | `boolean`                               | Conservar estado entre cambios de ruta          |
| `props`      | `Record<string, unknown>`               | Props extra para los hooks de ciclo de vida     |

```ts
// Entrada HTML (recomendado)
registerApp({ entry: 'http://localhost:3001', ... })

// Lista explícita de assets — omitir parseo HTML
registerApp({ entry: { scripts: ['http://localhost:3001/app.iife.js'] }, ... })
```

---

### `start(config?)`

Inicia la observación de rutas y monta de inmediato las apps que coincidan.

```ts
start({
  beforeMount: async (app) => {
    /* devolver false para cancelar */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
  onPause: async (app) => {},
  onResume: async (app) => {},
  onRouteChange: () => {},
  exposeNavigate: true, // exponer window.navigateTo globalmente (por defecto true)
});
```

---

### `navigateTo(path)`

Añade una nueva entrada al historial y dispara la lógica de re-enrutado de Horizon.

```ts
import { navigateTo } from "horizon-mfe";
navigateTo("/dashboard");
```

También se expone en `window.navigateTo` y `window.navigate` por defecto.

---

### `getApp(name)`

Obtiene una instancia registrada de `App` para inspección de estado o control manual.

```ts
const app = getApp("dashboard");
console.log(app?.status);
// "NOT_LOADED" | "LOADING" | "NOT_BOOTSTRAPPED" | "BOOTSTRAPPING"
// | "NOT_MOUNTED" | "MOUNTING" | "MOUNTED" | "UNMOUNTING"
// | "PAUSING" | "PAUSED" | "RESUMING" | "LOAD_ERROR"
```

---

## Event Bus

Comunicación entre apps tipada y estado compartido — sin configuración extra.

```ts
import { eventBus } from 'horizon-mfe'

// Emitir un evento puntual
eventBus.emit('cart:updated', { count: 3 })

// Suscribirse (devuelve función para darse de baja)
const off = eventBus.on('cart:updated', ({ count }) => updateBadge(count))

// Escuchar una sola vez
eventBus.once('user:logout', () => clearSession())

// Estado compartido — setState emite "store:<key>" y persiste el valor
eventBus.setState('theme', 'dark')
eventBus.getState('theme')   // "dark"

// En una app hija, usa props.eventBus (mismo singleton)
async mount({ eventBus }) {
  eventBus.on('theme:change', applyTheme)
}
```

Los adaptadores exponen hooks `useSharedState` / `useHostSharedState` que envuelven `setState` / `getState` automáticamente.

---

## Keep-Alive

Cuando una app tiene `keepAlive: true`, Horizon oculta el DOM en lugar de destruirlo al cambiar la ruta. Estado, timers y suscripciones se mantienen entre navegaciones.

```ts
createHorizon({
  keepAlive: true, // aplica a todas las apps
  apps: [
    { name: "cart", entry: "...", route: "/cart", keepAlive: false },
    // ^ override por app
  ],
});
```

| Evento        | Normal                            | Keep-Alive                       |
| ------------- | --------------------------------- | -------------------------------- |
| Salir de ruta | se llama `unmount`, DOM eliminado | se llama `onPause`, DOM oculto   |
| Volver a ruta | se llama `mount`, DOM recreado    | se llama `onResume`, DOM visible |

### Sincronización de ruta con Keep-Alive

Cuando la app hija tiene su propio router SPA (React Router, Vue Router, etc.), el estado interno del router puede desincronizarse con la URL del host mientras la app está pausada. Ejemplo:

1. El usuario navega a `/cart/checkout` dentro de la app hija del carrito
2. El host navega a `/dashboard` — el carrito se **pausa** (DOM oculto, estado preservado)
3. El host vuelve a `/cart` — el carrito **reanuda**, pero su router sigue en `/cart/checkout`

El hook `onResume` recibe `props.pathname` (la URL actual del host). Pásala al router de tu framework para re-sincronizar.

#### React — `onResume` con data router (recomendado)

Con el patrón `createBrowserRouter` + `RouterProvider`, la instancia del router está fuera del árbol de React, así que llama a `router.navigate` directamente en `onResume`:

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

#### React — `useRouteSync` con `BrowserRouter` legacy

Si usas `<BrowserRouter>`, usa `useRouteSync` dentro del contexto del router. Escucha el evento personalizado `horizon:app:resume` que se dispara al reanudar:

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

// Renderiza esto como hermano de <Routes>, dentro de <BrowserRouter>
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

#### Vue Router — opción `onResume`

`horizon-mfe/vue` también dispara `horizon:app:resume`; la forma más simple es la opción `onResume`:

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

#### Vanilla / otros frameworks

Usa el hook `onResume` directamente con la navegación imperativa de tu router:

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

> **¿Por qué no es automático?** Horizon no navega automáticamente los routers hijos al reanudar — algunas apps usan hash routing, rutas relativas o no tienen router. `onResume` te da control explícito.

---

## Aislamiento CSS

> **⚠️ El CSS puede entrar en conflicto.** Los estilos de la app hija se inyectan en el documento y pueden chocar con el host u otras apps. Para evitarlo **debes** usar una de: **(1) Shadow DOM** (`<horizon-app>`), **(2) acotar todos los selectores** con `[data-horizon-app="<name>"]`, o **(3) nombres de clase con hash/scope** (p. ej. CSS Modules). No dependas solo de estilos globales sin acotar.

### Atributo de ámbito (por defecto)

Horizon añade `data-horizon-app="<name>"` al elemento contenedor. Es un enfoque **por convención** — las apps hijas deben prefijar sus selectores CSS para que el ámbito funcione. Las hojas de estilo se inyectan en `document.head`.

```css
/* el CSS de la app hija debe escribirse así */
[data-horizon-app="dashboard"] .header {
  color: red;
}
```

### Shadow DOM — elemento personalizado `<horizon-app>`

Para **encapsulación CSS real**, usa el elemento personalizado `<horizon-app>`. Horizon le adjunta un Shadow DOM, así que los estilos de la hija no se filtran y los del host no entran.

```html
<!-- en el HTML del host, en lugar de un <div> contenedor -->
<horizon-app name="cart"></horizon-app>
```

```ts
import { HorizonAppElement } from "horizon-mfe";
// registra <horizon-app> al importar
```

Cuando existe un `<horizon-app>` en el DOM, Horizon monta la hija dentro de su Shadow Root en lugar de un contenedor normal. Las hojas de estilo se inyectan en el shadow root y quedan totalmente acotadas.

> **Compatibilidad:** `attachShadow` está soportado en navegadores modernos (Chrome 53+, Firefox 63+, Safari 10+, Edge 79+). Si Shadow DOM no está disponible, Horizon hace fallback a modo `scopeAttribute` y registra un aviso.

> **Cuidado:** Shadow DOM puede afectar modales globales o portales que se rendericen fuera del contenedor (p. ej. tooltips inyectados en `document.body` por algunas librerías).

---

## Sandbox JS

Cada app hija tiene su propio proxy aislado de `window`. Los globales que defina la hija se guardan en un Map por app y no se escriben en el `window` real, así que no pueden filtrarse al host ni a otras apps.

- **ProxySandbox** — se usa automáticamente en navegadores modernos
- **SnapshotSandbox** — fallback automático en entornos legacy (hace snapshot/restaura el `window` real al desactivar)

**Ciclo de vida:** el sandbox se activa al cargar la app (los scripts se ejecutan en su contexto), permanece activo durante mount/pause/resume y se limpia por completo al desmontar.

### Garantías de aislamiento

| Tipo de script                 | Aislamiento                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Bundle IIFE / UMD              | ✅ Totalmente aislado — el `window` real no se modifica                                                                   |
| Scripts inline                 | ✅ Totalmente aislado                                                                                                     |
| `<script type="module">` (ESM) | ⚠️ **No sandboxed** — los ES modules se ejecutan en el ámbito global real. Usa builds IIFE/UMD para aislamiento completo. |

---

## Limitaciones conocidas

### Los ES Modules no están en sandbox

Las apps hijas construidas como ES modules (`<script type="module">`) se ejecutan en el ámbito global real — es una limitación del navegador. Usa formato de salida **IIFE o UMD** en la configuración de build de la app hija para aislamiento JS completo.

```ts
// vite.config.ts (app hija)
build: {
  lib: {
    formats: ["iife"],
  },
}
```

### Content Security Policy

Horizon ejecuta scripts IIFE/UMD mediante `new Function()`, lo que requiere `unsafe-eval` en tu CSP:

```
Content-Security-Policy: script-src 'self' 'unsafe-eval';
```

Si tu despliegue aplica una CSP estricta sin `unsafe-eval`, usa el formato de entrada con lista explícita de assets (`entry: { scripts: [...] }`) con un CDN/servicio de bundles de confianza, o reconsidera el enfoque de sandbox para tu modelo de amenazas.

### Contaminación del espacio de nombres global

Por defecto se exponen `window.navigate` y `window.navigateTo`. Desactívalo si choca con globales existentes:

```ts
createHorizon({ ..., exposeNavigate: false })
// o
start({ exposeNavigate: false })
```

---

## Ciclo de vida de la app hija

```
NOT_LOADED
   │ load()          obtener HTML / scripts, ejecutar en sandbox
NOT_BOOTSTRAPPED
   │ bootstrap()     configuración única (se llama una vez por sesión)
NOT_MOUNTED
   │ mount()   ←──────────────────────────────────┐
MOUNTED                                            │
   │ unmount() ──────────────────────────────────→ NOT_MOUNTED
   │
   │ (solo keepAlive)
   │ onPause()  ─────────────────────────────────→ PAUSED
   │ onResume() ─────────────────────────────────→ MOUNTED
```

---

## Ejecutar los ejemplos

El repo incluye ejemplos ejecutables para cada framework host soportado, compartiendo las mismas seis apps hijas.

### Apps hijas (puertos fijos en todos los ejemplos)

| Paquete         | Puerto | Stack                    |
| --------------- | ------ | ------------------------ |
| `child-vanilla` | 3001   | Vanilla TS               |
| `child-react`   | 3002   | React 18                 |
| `child-vue`     | 3003   | Vue 3                    |
| `child-solid`   | 3004   | Solid                    |
| `child-svelte`  | 3005   | Svelte 4                 |
| `child-ember`   | 3006   | Ciclo de vida tipo Ember |

### Apps host (todas en puerto 3000)

| Comando                | Host                                  |
| ---------------------- | ------------------------------------- |
| `pnpm example:vanilla` | Vanilla TS                            |
| `pnpm example:react`   | React + hooks `horizon-mfe/react`     |
| `pnpm example:vue`     | Vue 3 + composables `horizon-mfe/vue` |
| `pnpm example:solid`   | Solid                                 |
| `pnpm example:svelte`  | Svelte 4                              |
| `pnpm example:ember`   | Ciclo de vida tipo Ember              |

```bash
# Instalar todo
pnpm install

# Elegir un host y arrancar todos los servidores
pnpm example:vanilla   # o :react / :vue / :solid / :svelte / :ember
```

Luego abre **http://localhost:3000**.

> **Cómo funciona:** las apps hijas se construyen como bundles IIFE (`vite build --watch`) y se sirven con `vite preview`. El host obtiene esos bundles, los ejecuta dentro del sandbox JS y monta/desmonta según la ruta actual.

### Arranque manual

```bash
# Terminal 1 — watch del core
pnpm dev

# Terminales 2-7 — apps hijas
pnpm --filter child-vanilla dev
pnpm --filter child-react   dev
pnpm --filter child-vue     dev
pnpm --filter child-solid   dev
pnpm --filter child-svelte  dev
pnpm --filter child-ember   dev

# Terminal 8 — host (elegir uno)
pnpm --filter host-vanilla dev
pnpm --filter host-react   dev
pnpm --filter host-vue     dev
```

---

## Contribuir

¡Las contribuciones son bienvenidas! Abre issues para bugs o peticiones de funcionalidad, y los pull requests siempre se agradecen.

---

## Licencia

MIT
