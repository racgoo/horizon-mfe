# horizon-mfe(beta WIP)

**Version:** 0.0.3

[![npm version](https://img.shields.io/npm/v/horizon-mfe)](https://www.npmjs.com/package/horizon-mfe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**README langues** [EN [English]](https://github.com/racgoo/horizon-mfe) / [KR [한국어]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ko.md) / [中文 [简体]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.zh.md) / [日本語](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ja.md) / [Español](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.sp.md) / [Français](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.fr.md) / [हिन्दी](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.hi.md) / [Русский](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ru.md) / [العربية](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.arc.md)

Framework micro-frontend léger.

- **Zéro dépendance** — ~8 kB gzippé
- **Adaptateurs de frameworks** — React, Vue 3, Solid, Svelte 4, Ember / personnalisé (`horizon-mfe/*`)
- **Chargement par entrée HTML** — indiquez une URL, Horizon récupère et exécute tout
- **Sandbox JS** — isolation de `window` par app via Proxy (SnapshotSandbox en fallback pour les anciens navigateurs)
- **Isolation CSS** — portée `data-horizon-app` ou Shadow DOM
- **Activation par route** — préfixe de chemin ou prédicat personnalisé
- **Keep-alive** — préserve l’état entre changements de route ; afficher/masquer sans remonter
- **État partagé** — synchronisation typée entre apps via l’event bus intégré
- **TypeScript-first** — définitions de types incluses

---

## Installation

```bash
pnpm add horizon-mfe
# ou
npm install horizon-mfe
```

---

## Démarrage rapide

### API simplifiée (`createHorizon`)

Point d’entrée en un seul appel. Enregistre les apps et démarre Horizon en une fois.

```ts
import { createHorizon } from "horizon-mfe";

createHorizon({
  container: "#app-container",
  keepAlive: true, // préserver l'état entre changements de route
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

### API classique (`registerApp` + `start`)

Toujours entièrement supportée — utile quand vous avez besoin d’un contrôle fin.

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
    /* retourner false pour annuler */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
});
```

### App enfant (n’importe quel framework)

Exposez les hooks de cycle de vie via `window.__HORIZON_LIFECYCLE__`. Fonctionne avec tout framework.

```ts
// src/horizon.ts
window.__HORIZON_LIFECYCLE__ = {
  async bootstrap() {
    await loadConfig(); // appelé une fois avant le premier mount
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
    /* DOM masqué, état préservé */
  },
  async onResume(props) {
    /* appelé lors du réaffichage */
  },
};
```

---

## Adaptateurs de frameworks

Chaque adaptateur encapsule le boilerplate du cycle de vie pour que **les apps enfants n’importent jamais Horizon directement**. Installez l’adaptateur dans l’app enfant.

### React (`horizon-mfe/react`)

```bash
pnpm add horizon-mfe react react-dom
```

**App enfant :**

```tsx
// src/main.tsx
import { defineApp } from "horizon-mfe/react";
import App from "./App";

defineApp(App);
// ou avec options :
defineApp(App, {
  onBootstrap: async () => await loadConfig(),
  onMount: (props) => {},
  onUnmount: () => {},
  onPause: (props) => {},
  onResume: (props) => {},
  mapProps: (props) => ({ ...props.props }), // transformer les props Horizon avant de les passer au root
});
```

**App hôte (React) :**

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
      <span>Compteur partagé : {count}</span>
      <div id="app-container" />
    </>
  );
}
```

**État partagé (enfant) :**

```tsx
import { useSharedState } from "horizon-mfe/react";

function Counter() {
  const [count, setCount] = useSharedState<number>("count", 0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Sync du routeur (keep-alive + React Router) :**

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

function RouterSync() {
  useRouteSync(useNavigate());
  return null;
}
// Rendez <RouterSync /> en frère de <Routes> dans <BrowserRouter>
```

---

### Vue 3 (`horizon-mfe/vue`)

```bash
pnpm add horizon-mfe vue
```

**App enfant :**

```ts
// src/main.ts
import { defineApp } from "horizon-mfe/vue";
import App from "./App.vue";
import router from "./router";

defineApp(App, {
  setup: (app, props) => app.use(router), // installer les plugins avant le mount
  onPause: (props) => {},
  onResume: (props) => {},
});
```

Accès aux props Horizon dans n’importe quel composant :

```vue
<script setup lang="ts">
import { inject } from "vue";
import { HorizonPropsKey } from "horizon-mfe/vue";

const horizonProps = inject(HorizonPropsKey);
horizonProps?.eventBus.emit("my:event", { data: 123 });
</script>
```

**État partagé (composable enfant) :**

```ts
import { useSharedState } from "horizon-mfe/vue";

const [count, setCount] = useSharedState<number>("count", 0);
// count est un Vue Ref<number> — utiliser count.value en script, ou {{ count }} en template
```

**App hôte (Vue) :**

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

**État partagé :**

```tsx
import { useSharedState } from "horizon-mfe/solid";

const [count, setCount] = useSharedState<number>("count", 0);
return <div>{count()}</div>; // count() — accesseur du signal Solid
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

**État partagé (store writable Svelte) :**

```svelte
<script>
  import { useSharedState } from 'horizon-mfe/svelte'
  const count = useSharedState('count', 0)
</script>
<button on:click={() => $count += 1}>{$count}</button>
```

**App hôte (Svelte) :**

```ts
import { useHorizonHost, useHostSharedState } from 'horizon-mfe/svelte'

const { pathname, navigate } = useHorizonHost({ ... })
const count = useHostSharedState('count', 0)
```

---

### Ember / personnalisé (`horizon-mfe/ember`)

L’adaptateur Ember accepte un objet de cycle de vie simple — utile pour Ember ou tout framework qui gère son propre rendu.

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

## Référence API

### `createHorizon(options)`

Configuration en un seul appel.

| Champ            | Type                       | Description                                                 |
| ---------------- | -------------------------- | ----------------------------------------------------------- |
| `apps`           | `CreateHorizonAppConfig[]` | Définitions des apps (`route` est un alias de `activeRule`) |
| `container`      | `string \| HTMLElement`    | Conteneur par défaut pour toutes les apps                   |
| `keepAlive`      | `boolean`                  | Keep-alive par défaut pour toutes les apps                  |
| `onMount`        | `(app) => Promise<void>`   | Appelé après le mount de chaque app                         |
| `onUnmount`      | `(app) => Promise<void>`   | Appelé avant le unmount de chaque app                       |
| `onPause`        | `(app) => Promise<void>`   | Appelé quand une app keep-alive est masquée                 |
| `onResume`       | `(app) => Promise<void>`   | Appelé quand une app keep-alive est affichée                |
| `onRouteChange`  | `() => void`               | Appelé à chaque changement de route                         |
| `exposeNavigate` | `boolean`                  | Exposer `window.navigateTo` globalement (défaut `true`)     |

---

### `registerApp(config | config[])`

Enregistre une ou plusieurs apps. Peut être appelé avant ou après `start()`.

| Champ        | Type                                    | Description                                          |
| ------------ | --------------------------------------- | ---------------------------------------------------- |
| `name`       | `string`                                | Identifiant unique                                   |
| `entry`      | `string \| { scripts, styles?, html? }` | URL d’entrée HTML ou liste explicite d’assets        |
| `container`  | `string \| HTMLElement`                 | Sélecteur CSS ou élément où monter                   |
| `activeRule` | `string \| (location) => boolean`       | Préfixe de chemin ou prédicat personnalisé           |
| `keepAlive`  | `boolean`                               | Préserver l’état entre changements de route          |
| `props`      | `Record<string, unknown>`               | Props supplémentaires pour les hooks de cycle de vie |

```ts
// Entrée HTML (recommandé)
registerApp({ entry: 'http://localhost:3001', ... })

// Liste explicite d'assets — pas de parsing HTML
registerApp({ entry: { scripts: ['http://localhost:3001/app.iife.js'] }, ... })
```

---

### `start(config?)`

Démarre la surveillance des routes et monte immédiatement les apps correspondantes.

```ts
start({
  beforeMount: async (app) => {
    /* retourner false pour annuler */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
  onPause: async (app) => {},
  onResume: async (app) => {},
  onRouteChange: () => {},
  exposeNavigate: true, // exposer window.navigateTo globalement (défaut true)
});
```

---

### `navigateTo(path)`

Ajoute une entrée à l’historique et déclenche la logique de re-routage de Horizon.

```ts
import { navigateTo } from "horizon-mfe";
navigateTo("/dashboard");
```

Également exposé sur `window.navigateTo` et `window.navigate` par défaut.

---

### `getApp(name)`

Récupère une instance enregistrée de `App` pour inspection d’état ou contrôle manuel.

```ts
const app = getApp("dashboard");
console.log(app?.status);
// "NOT_LOADED" | "LOADING" | "NOT_BOOTSTRAPPED" | "BOOTSTRAPPING"
// | "NOT_MOUNTED" | "MOUNTING" | "MOUNTED" | "UNMOUNTING"
// | "PAUSING" | "PAUSED" | "RESUMING" | "LOAD_ERROR"
```

---

## Event Bus

Communication entre apps typée et état partagé — sans configuration.

```ts
import { eventBus } from 'horizon-mfe'

// Émettre un événement ponctuel
eventBus.emit('cart:updated', { count: 3 })

// S'abonner (retourne une fonction de désabonnement)
const off = eventBus.on('cart:updated', ({ count }) => updateBadge(count))

// Écouter une seule fois
eventBus.once('user:logout', () => clearSession())

// État partagé — setState émet "store:<key>" et persiste la valeur
eventBus.setState('theme', 'dark')
eventBus.getState('theme')   // "dark"

// Dans une app enfant, utiliser props.eventBus (même singleton)
async mount({ eventBus }) {
  eventBus.on('theme:change', applyTheme)
}
```

Les adaptateurs exposent les hooks `useSharedState` / `useHostSharedState` qui enveloppent `setState` / `getState` automatiquement.

---

## Keep-Alive

Quand une app a `keepAlive: true`, Horizon masque le DOM au lieu de le détruire lors d’un changement de route. État, timers et abonnements survivent aux navigations.

```ts
createHorizon({
  keepAlive: true, // s'applique à toutes les apps
  apps: [
    { name: "cart", entry: "...", route: "/cart", keepAlive: false },
    // ^ override par app
  ],
});
```

| Événement     | Normal                         | Keep-Alive                     |
| ------------- | ------------------------------ | ------------------------------ |
| Quitter route | `unmount` appelé, DOM supprimé | `onPause` appelé, DOM masqué   |
| Revenir route | `mount` appelé, DOM recréé     | `onResume` appelé, DOM affiché |

### Synchronisation de route avec Keep-Alive

Quand l’app enfant a son propre routeur SPA (React Router, Vue Router, etc.), l’état interne du routeur peut se désynchroniser de l’URL du hôte pendant que l’app est en pause. Exemple :

1. L’utilisateur navigue vers `/cart/checkout` dans l’app enfant panier
2. Le hôte navigue vers `/dashboard` — le panier est **en pause** (DOM masqué, état préservé)
3. Le hôte revient à `/cart` — le panier **reprend**, mais son routeur pointe encore vers `/cart/checkout`

Le hook `onResume` reçoit `props.pathname` (l’URL actuelle du hôte). Passez-la au routeur de votre framework pour resynchroniser.

#### React — `onResume` avec data router (recommandé)

Avec le pattern `createBrowserRouter` + `RouterProvider`, l’instance du routeur est hors de l’arbre React, donc appelez `router.navigate` directement dans `onResume` :

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

#### React — `useRouteSync` avec `BrowserRouter` legacy

Si vous utilisez `<BrowserRouter>`, utilisez `useRouteSync` dans le contexte du routeur. Il écoute l’événement personnalisé `horizon:app:resume` émis à la reprise :

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

// Rendez ce composant en frère de <Routes>, dans <BrowserRouter>
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

#### Vue Router — option `onResume`

`horizon-mfe/vue` émet aussi `horizon:app:resume` ; la solution la plus simple est l’option `onResume` :

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

#### Vanilla / autres frameworks

Utilisez le hook `onResume` directement avec la navigation impérative de votre routeur :

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

> **Pourquoi ce n’est pas automatique ?** Horizon ne navigue pas automatiquement les routeurs enfants à la reprise — certaines apps utilisent le hash routing, des chemins relatifs ou n’ont pas de routeur. `onResume` vous donne un contrôle explicite.

---

## Isolation CSS

> **⚠️ Le CSS peut entrer en conflit.** Les styles des apps enfants sont injectés dans le document et peuvent entrer en conflit avec l'hôte ou d'autres apps. Pour éviter les conflits, il **faut** utiliser l'un des : **(1) Shadow DOM** (`<horizon-app>`), **(2) scoper tous les sélecteurs** avec `[data-horizon-app="<name>"]`, ou **(3) noms de classes hashés/scope** (ex. CSS Modules). Ne pas se reposer uniquement sur des styles globaux non scopés.

### Attribut de portée (par défaut)

Horizon ajoute `data-horizon-app="<name>"` à l’élément conteneur. Approche **par convention** — les apps enfants doivent préfixer leurs sélecteurs CSS pour que la portée fonctionne. Les feuilles de style sont toujours injectées dans `document.head`.

```css
/* le CSS de l'app enfant doit être écrit ainsi */
[data-horizon-app="dashboard"] .header {
  color: red;
}
```

### Shadow DOM — élément personnalisé `<horizon-app>`

Pour une **vraie encapsulation CSS**, utilisez l’élément personnalisé `<horizon-app>`. Horizon lui attache un Shadow DOM, donc les styles enfant ne fuient pas et les styles hôte n’entrent pas.

```html
<!-- dans le HTML du hôte, au lieu d'un simple <div> conteneur -->
<horizon-app name="cart"></horizon-app>
```

```ts
import { HorizonAppElement } from "horizon-mfe";
// enregistre <horizon-app> à l'import
```

Quand un élément `<horizon-app>` est présent dans le DOM, Horizon monte l’enfant dans son Shadow Root au lieu d’un conteneur simple. Les feuilles de style sont injectées dans le shadow root et sont entièrement scopées.

> **Compatibilité navigateurs :** `attachShadow` est supporté dans les navigateurs modernes (Chrome 53+, Firefox 63+, Safari 10+, Edge 79+). Si Shadow DOM est indisponible, Horizon bascule automatiquement en mode `scopeAttribute` et enregistre un avertissement.

> **Attention :** Shadow DOM peut casser les modales globales ou portails rendus hors du conteneur (ex. tooltips injectés dans `document.body` par certaines librairies).

---

## Sandbox JS

Chaque app enfant dispose de son propre proxy `window` isolé. Les globaux définis par l’enfant sont stockés dans une Map par app et ne sont jamais écrits dans le `window` réel, donc ils ne peuvent pas fuir vers le hôte ou les autres apps.

- **ProxySandbox** — utilisé automatiquement dans les navigateurs modernes
- **SnapshotSandbox** — fallback automatique pour les environnements legacy (snapshot/restauration du `window` réel à la désactivation)

**Cycle de vie :** le sandbox s’active au chargement de l’app (les scripts s’exécutent dans son contexte), reste actif pendant mount/pause/resume, et est entièrement nettoyé au unmount.

### Garanties d’isolation

| Type de script                 | Isolation                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Bundle IIFE / UMD              | ✅ Entièrement isolé — le `window` réel n’est jamais modifié                                                                          |
| Scripts inline                 | ✅ Entièrement isolé                                                                                                                  |
| `<script type="module">` (ESM) | ⚠️ **Non sandboxé** — les modules ES s’exécutent dans le scope global réel. Utilisez des builds IIFE/UMD pour une isolation complète. |

---

## Limites connues

### Les ES Modules ne sont pas sandboxés

Les apps enfants construites en ES modules (`<script type="module">`) s’exécutent dans le scope global réel — contrainte du navigateur. Utilisez le format de sortie **IIFE ou UMD** dans la config de build de l’app enfant pour une isolation JS complète.

```ts
// vite.config.ts (app enfant)
build: {
  lib: {
    formats: ["iife"],
  },
}
```

### Content Security Policy

Horizon exécute les scripts IIFE/UMD via `new Function()`, ce qui nécessite `unsafe-eval` dans votre CSP :

```
Content-Security-Policy: script-src 'self' 'unsafe-eval';
```

Si votre déploiement impose une CSP stricte sans `unsafe-eval`, utilisez le format d’entrée avec liste explicite d’assets (`entry: { scripts: [...] }`) avec un CDN/service de bundles de confiance, ou reconsidérez l’approche sandbox pour votre modèle de menace.

### Pollution de l’espace de noms global

Par défaut, `window.navigate` et `window.navigateTo` sont exposés. Désactivez si conflit avec des globaux existants :

```ts
createHorizon({ ..., exposeNavigate: false })
// ou
start({ exposeNavigate: false })
```

---

## Cycle de vie de l’app enfant

```
NOT_LOADED
   │ load()          récupérer HTML / scripts, exécuter dans le sandbox
NOT_BOOTSTRAPPED
   │ bootstrap()     configuration unique (appelé une fois par session)
NOT_MOUNTED
   │ mount()   ←──────────────────────────────────┐
MOUNTED                                            │
   │ unmount() ──────────────────────────────────→ NOT_MOUNTED
   │
   │ (keepAlive uniquement)
   │ onPause()  ─────────────────────────────────→ PAUSED
   │ onResume() ─────────────────────────────────→ MOUNTED
```

---

## Lancer les exemples

Le dépôt fournit des exemples exécutables pour chaque framework hôte supporté, partageant les mêmes six apps enfants.

### Apps enfants (ports fixes pour tous les exemples)

| Paquet          | Port | Stack                    |
| --------------- | ---- | ------------------------ |
| `child-vanilla` | 3001 | Vanilla TS               |
| `child-react`   | 3002 | React 18                 |
| `child-vue`     | 3003 | Vue 3                    |
| `child-solid`   | 3004 | Solid                    |
| `child-svelte`  | 3005 | Svelte 4                 |
| `child-ember`   | 3006 | Cycle de vie style Ember |

### Apps hôtes (toutes sur le port 3000)

| Commande               | Hôte                                  |
| ---------------------- | ------------------------------------- |
| `pnpm example:vanilla` | Vanilla TS                            |
| `pnpm example:react`   | React + hooks `horizon-mfe/react`     |
| `pnpm example:vue`     | Vue 3 + composables `horizon-mfe/vue` |
| `pnpm example:solid`   | Solid                                 |
| `pnpm example:svelte`  | Svelte 4                              |
| `pnpm example:ember`   | Cycle de vie style Ember              |

```bash
# Tout installer
pnpm install

# Choisir un hôte et démarrer tous les serveurs
pnpm example:vanilla   # ou :react / :vue / :solid / :svelte / :ember
```

Puis ouvrez **http://localhost:3000**.

> **Fonctionnement :** les apps enfants sont construites en bundles IIFE (`vite build --watch`) et servies par `vite preview`. Le hôte récupère ces bundles, les exécute dans un sandbox JS, et monte/démonte selon la route actuelle.

### Démarrage manuel

```bash
# Terminal 1 — watch du core
pnpm dev

# Terminaux 2-7 — apps enfants
pnpm --filter child-vanilla dev
pnpm --filter child-react   dev
pnpm --filter child-vue     dev
pnpm --filter child-solid   dev
pnpm --filter child-svelte  dev
pnpm --filter child-ember   dev

# Terminal 8 — hôte (en choisir un)
pnpm --filter host-vanilla dev
pnpm --filter host-react   dev
pnpm --filter host-vue     dev
```

---

## Contribuer

Les contributions sont bienvenues. N’hésitez pas à ouvrir des issues pour des bugs ou des idées de fonctionnalités, et les pull requests sont toujours appréciées.

---

## Licence

MIT
