# horizon-mfe(beta WIP)

**Version:** 0.0.3

[![npm version](https://img.shields.io/npm/v/horizon-mfe)](https://www.npmjs.com/package/horizon-mfe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**README языки** [EN [English]](https://github.com/racgoo/horizon-mfe) / [KR [한국어]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ko.md) / [中文 [简体]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.zh.md) / [日本語](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ja.md) / [Español](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.sp.md) / [Français](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.fr.md) / [हिन्दी](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.hi.md) / [Русский](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ru.md) / [العربية](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.arc.md)

Лёгкий микрофронтенд-фреймворк.

- **Нулевые зависимости** — ~8 kB gzip
- **Адаптеры фреймворков** — React, Vue 3, Solid, Svelte 4, Ember / свой (`horizon-mfe/*`)
- **Загрузка по HTML-входу** — укажите URL, Horizon загрузит и выполнит всё
- **JS-песочница** — изоляция `window` на приложение через Proxy (SnapshotSandbox для старых браузеров)
- **Изоляция CSS** — область `data-horizon-app` или Shadow DOM
- **Активация по маршруту** — префикс пути или свой предикат
- **Keep-alive** — сохранять состояние при смене маршрута; показ/скрытие без размонтирования
- **Общее состояние** — типизированная синхронизация между приложениями через встроенную шину событий
- **TypeScript-first** — полные определения типов

---

## Установка

```bash
pnpm add horizon-mfe
# или
npm install horizon-mfe
```

---

## Быстрый старт

### Упрощённый API (`createHorizon`)

Точка входа в один вызов. Регистрирует приложения и запускает Horizon за раз.

```ts
import { createHorizon } from "horizon-mfe";

createHorizon({
  container: "#app-container",
  keepAlive: true, // сохранять состояние при смене маршрута
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

### Классический API (`registerApp` + `start`)

По-прежнему полностью поддерживается — удобно при необходимости тонкого контроля.

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
    /* вернуть false для отмены */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
});
```

### Дочернее приложение (любой фреймворк)

Экспортируйте хуки жизненного цикла через `window.__HORIZON_LIFECYCLE__`. Работает с любым фреймворком.

```ts
// src/horizon.ts
window.__HORIZON_LIFECYCLE__ = {
  async bootstrap() {
    await loadConfig(); // вызывается один раз перед первым монтированием
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
    /* DOM скрыт, состояние сохранено */
  },
  async onResume(props) {
    /* вызывается при повторном отображении */
  },
};
```

---

## Адаптеры фреймворков

Каждый адаптер оборачивает шаблонный код жизненного цикла, чтобы **дочерние приложения не импортировали Horizon напрямую**. Установите адаптер в дочернем приложении.

### React (`horizon-mfe/react`)

```bash
pnpm add horizon-mfe react react-dom
```

**Дочернее приложение:**

```tsx
// src/main.tsx
import { defineApp } from "horizon-mfe/react";
import App from "./App";

defineApp(App);
// или с опциями:
defineApp(App, {
  onBootstrap: async () => await loadConfig(),
  onMount: (props) => {},
  onUnmount: () => {},
  onPause: (props) => {},
  onResume: (props) => {},
  mapProps: (props) => ({ ...props.props }), // преобразовать props Horizon перед передачей в root
});
```

**Хост-приложение (React):**

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
      <span>Общий счётчик: {count}</span>
      <div id="app-container" />
    </>
  );
}
```

**Общее состояние (дочернее):**

```tsx
import { useSharedState } from "horizon-mfe/react";

function Counter() {
  const [count, setCount] = useSharedState<number>("count", 0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**Синхронизация роутера (keep-alive + React Router):**

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

function RouterSync() {
  useRouteSync(useNavigate());
  return null;
}
// Рендерьте <RouterSync /> рядом с <Routes> внутри <BrowserRouter>
```

---

### Vue 3 (`horizon-mfe/vue`)

```bash
pnpm add horizon-mfe vue
```

**Дочернее приложение:**

```ts
// src/main.ts
import { defineApp } from "horizon-mfe/vue";
import App from "./App.vue";
import router from "./router";

defineApp(App, {
  setup: (app, props) => app.use(router), // установить плагины до монтирования
  onPause: (props) => {},
  onResume: (props) => {},
});
```

Доступ к props Horizon в любом компоненте:

```vue
<script setup lang="ts">
import { inject } from "vue";
import { HorizonPropsKey } from "horizon-mfe/vue";

const horizonProps = inject(HorizonPropsKey);
horizonProps?.eventBus.emit("my:event", { data: 123 });
</script>
```

**Общее состояние (composable в дочернем):**

```ts
import { useSharedState } from "horizon-mfe/vue";

const [count, setCount] = useSharedState<number>("count", 0);
// count — Vue Ref<number>: в скрипте count.value, в шаблоне {{ count }}
```

**Хост-приложение (Vue):**

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

**Общее состояние:**

```tsx
import { useSharedState } from "horizon-mfe/solid";

const [count, setCount] = useSharedState<number>("count", 0);
return <div>{count()}</div>; // count() — аксессор сигнала Solid
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

**Общее состояние (writable store Svelte):**

```svelte
<script>
  import { useSharedState } from 'horizon-mfe/svelte'
  const count = useSharedState('count', 0)
</script>
<button on:click={() => $count += 1}>{$count}</button>
```

**Хост-приложение (Svelte):**

```ts
import { useHorizonHost, useHostSharedState } from 'horizon-mfe/svelte'

const { pathname, navigate } = useHorizonHost({ ... })
const count = useHostSharedState('count', 0)
```

---

### Ember / свой (`horizon-mfe/ember`)

Адаптер Ember принимает простой объект жизненного цикла — удобно для Ember или любого фреймворка с собственным рендерингом.

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

## Справка API

### `createHorizon(options)`

Настройка одним вызовом.

| Поле             | Тип                        | Описание                                                           |
| ---------------- | -------------------------- | ------------------------------------------------------------------ |
| `apps`           | `CreateHorizonAppConfig[]` | Определения приложений (`route` — алиас для `activeRule`)          |
| `container`      | `string \| HTMLElement`    | Контейнер по умолчанию для всех приложений                         |
| `keepAlive`      | `boolean`                  | Keep-alive по умолчанию для всех приложений                        |
| `onMount`        | `(app) => Promise<void>`   | Вызывается после монтирования каждого приложения                   |
| `onUnmount`      | `(app) => Promise<void>`   | Вызывается перед размонтированием каждого приложения               |
| `onPause`        | `(app) => Promise<void>`   | Вызывается при скрытии keep-alive приложения                       |
| `onResume`       | `(app) => Promise<void>`   | Вызывается при показе keep-alive приложения                        |
| `onRouteChange`  | `() => void`               | Вызывается при каждом изменении маршрута                           |
| `exposeNavigate` | `boolean`                  | Экспортировать `window.navigateTo` глобально (по умолчанию `true`) |

---

### `registerApp(config | config[])`

Регистрирует одно или несколько приложений. Можно вызывать до или после `start()`.

| Поле         | Тип                                     | Описание                                        |
| ------------ | --------------------------------------- | ----------------------------------------------- |
| `name`       | `string`                                | Уникальный идентификатор                        |
| `entry`      | `string \| { scripts, styles?, html? }` | URL HTML-входа или явный список ресурсов        |
| `container`  | `string \| HTMLElement`                 | CSS-селектор или элемент для монтирования       |
| `activeRule` | `string \| (location) => boolean`       | Префикс пути или свой предикат                  |
| `keepAlive`  | `boolean`                               | Сохранять состояние при смене маршрута          |
| `props`      | `Record<string, unknown>`               | Дополнительные props для хуков жизненного цикла |

```ts
// HTML-вход (рекомендуется)
registerApp({ entry: 'http://localhost:3001', ... })

// Явный список ресурсов — без разбора HTML
registerApp({ entry: { scripts: ['http://localhost:3001/app.iife.js'] }, ... })
```

---

### `start(config?)`

Запускает отслеживание маршрутов и сразу монтирует подходящие приложения.

```ts
start({
  beforeMount: async (app) => {
    /* вернуть false для отмены */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
  onPause: async (app) => {},
  onResume: async (app) => {},
  onRouteChange: () => {},
  exposeNavigate: true, // экспорт window.navigateTo глобально (по умолчанию true)
});
```

---

### `navigateTo(path)`

Добавляет запись в историю и запускает логику перемаршрутизации Horizon.

```ts
import { navigateTo } from "horizon-mfe";
navigateTo("/dashboard");
```

По умолчанию также экспортируется в `window.navigateTo` и `window.navigate`.

---

### `getApp(name)`

Получить зарегистрированный экземпляр `App` для проверки состояния или ручного управления.

```ts
const app = getApp("dashboard");
console.log(app?.status);
// "NOT_LOADED" | "LOADING" | "NOT_BOOTSTRAPPED" | "BOOTSTRAPPING"
// | "NOT_MOUNTED" | "MOUNTING" | "MOUNTED" | "UNMOUNTING"
// | "PAUSING" | "PAUSED" | "RESUMING" | "LOAD_ERROR"
```

---

## Шина событий

Типизированное взаимодействие между приложениями и общее состояние — без настройки.

```ts
import { eventBus } from 'horizon-mfe'

// Однократное событие
eventBus.emit('cart:updated', { count: 3 })

// Подписка (возвращает функцию отписки)
const off = eventBus.on('cart:updated', ({ count }) => updateBadge(count))

// Слушать один раз
eventBus.once('user:logout', () => clearSession())

// Общее состояние — setState рассылает "store:<key>" и сохраняет значение
eventBus.setState('theme', 'dark')
eventBus.getState('theme')   // "dark"

// В дочернем приложении используйте props.eventBus (тот же синглтон)
async mount({ eventBus }) {
  eventBus.on('theme:change', applyTheme)
}
```

Адаптеры экспортируют хуки `useSharedState` / `useHostSharedState`, оборачивающие `setState` / `getState`.

---

## Keep-Alive

При `keepAlive: true` Horizon скрывает DOM при смене маршрута вместо уничтожения. Состояние, таймеры и подписки сохраняются при навигации.

```ts
createHorizon({
  keepAlive: true, // для всех приложений
  apps: [
    { name: "cart", entry: "...", route: "/cart", keepAlive: false },
    // ^ переопределение для приложения
  ],
});
```

| Событие            | Обычный режим                         | Keep-Alive                         |
| ------------------ | ------------------------------------- | ---------------------------------- |
| Уход с маршрута    | вызывается `unmount`, DOM удалён      | вызывается `onPause`, DOM скрыт    |
| Возврат на маршрут | вызывается `mount`, DOM создан заново | вызывается `onResume`, DOM показан |

### Синхронизация маршрута с Keep-Alive

Если у дочернего приложения свой SPA-роутер (React Router, Vue Router и т.д.), его внутреннее состояние может рассинхронизироваться с URL хоста, пока приложение приостановлено. Пример:

1. Пользователь переходит в `/cart/checkout` внутри дочернего приложения корзины
2. Хост переходит в `/dashboard` — корзина **приостановлена** (DOM скрыт, состояние сохранено)
3. Хост возвращается на `/cart` — корзина **возобновляется**, но её роутер всё ещё указывает на `/cart/checkout`

Хук `onResume` получает `props.pathname` (текущий URL хоста). Передайте его в роутер вашего фреймворка для повторной синхронизации.

#### React — `onResume` с data router (рекомендуется)

При паттерне `createBrowserRouter` + `RouterProvider` экземпляр роутера вне дерева React, поэтому вызывайте `router.navigate` прямо в `onResume`:

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

#### React — `useRouteSync` с устаревшим `BrowserRouter`

Если используется `<BrowserRouter>`, используйте `useRouteSync` внутри контекста роутера. Он слушает пользовательское событие `horizon:app:resume`, отправляемое при возобновлении:

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

// Рендерьте этот компонент рядом с <Routes> внутри <BrowserRouter>
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

#### Vue Router — опция `onResume`

`horizon-mfe/vue` тоже отправляет `horizon:app:resume`; проще всего задать опцию `onResume`:

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

#### Vanilla / другие фреймворки

Используйте хук `onResume` напрямую с императивной навигацией вашего роутера:

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

> **Почему не автоматически?** Horizon не навигирует дочерние роутеры при возобновлении — у части приложений hash-маршрутизация, относительные пути или нет роутера. `onResume` даёт явный контроль.

---

## Изоляция CSS

> **⚠️ CSS может конфликтовать.** Стили дочернего приложения попадают в документ и могут конфликтовать с хостом или другими приложениями. Чтобы избежать конфликтов, **обязательно** используйте один из вариантов: **(1) Shadow DOM** (`<horizon-app>`), **(2) ограничьте все селекторы** с помощью `[data-horizon-app="<name>"]`, или **(3) хешированные/скопированные имена классов** (например, CSS Modules). Не полагайтесь только на глобальные неограниченные стили.

### Атрибут области (по умолчанию)

Horizon добавляет к контейнеру `data-horizon-app="<name>"`. Подход **по соглашению** — дочерние приложения должны префиксировать селекторы CSS. Стили по-прежнему попадают в `document.head`.

```css
/* CSS дочернего приложения пишите так */
[data-horizon-app="dashboard"] .header {
  color: red;
}
```

### Shadow DOM — пользовательский элемент `<horizon-app>`

Для **настоящей инкапсуляции CSS** используйте пользовательский элемент `<horizon-app>`. Horizon подключает к нему Shadow DOM, стили дочернего приложения не просачиваются, стили хоста не попадают внутрь.

```html
<!-- в HTML хоста вместо обычного контейнера <div> -->
<horizon-app name="cart"></horizon-app>
```

```ts
import { HorizonAppElement } from "horizon-mfe";
// регистрирует <horizon-app> при импорте
```

При наличии `<horizon-app>` в DOM Horizon монтирует дочернее приложение в его Shadow Root. Стили инжектируются в shadow root и полностью изолированы.

> **Совместимость:** `attachShadow` поддерживается в современных браузерах (Chrome 53+, Firefox 63+, Safari 10+, Edge 79+). При недоступности Shadow DOM Horizon переключается на режим `scopeAttribute` и выводит предупреждение.

> **Ограничение:** Shadow DOM может ломать глобальные модалки и порталы вне контейнера (например, тултипы в `document.body`).

---

## JS-песочница

У каждого дочернего приложения свой изолированный прокси `window`. Глобальные переменные дочернего хранятся в Map по приложениям и не записываются в реальный `window`, поэтому не попадают в хост и другие приложения.

- **ProxySandbox** — используется в современных браузерах
- **SnapshotSandbox** — запасной вариант для старых сред (снимок/восстановление реального `window` при деактивации)

**Жизненный цикл:** песочница активируется при загрузке приложения (скрипты выполняются в её контексте), остаётся активной при mount/pause/resume и полностью очищается при unmount.

### Гарантии изоляции

| Тип скрипта                    | Изоляция                                                                                                             |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Бандл IIFE / UMD               | ✅ Полная изоляция — реальный `window` не меняется                                                                   |
| Инлайновые скрипты             | ✅ Полная изоляция                                                                                                   |
| `<script type="module">` (ESM) | ⚠️ **Не в песочнице** — ES-модули выполняются в глобальной области. Для полной изоляции используйте сборку IIFE/UMD. |

---

## Известные ограничения

### ES-модули не изолируются

Приложения, собранные как ES-модули (`<script type="module">`), выполняются в глобальной области — ограничение браузера. Для полной JS-изоляции используйте формат вывода **IIFE или UMD** в конфиге сборки дочернего приложения.

```ts
// vite.config.ts (дочернее приложение)
build: {
  lib: {
    formats: ["iife"],
  },
}
```

### Content Security Policy

Horizon выполняет скрипты IIFE/UMD через `new Function()`, для чего в CSP нужен `unsafe-eval`:

```
Content-Security-Policy: script-src 'self' 'unsafe-eval';
```

При строгой CSP без `unsafe-eval` используйте формат входа с явным списком ресурсов (`entry: { scripts: [...] }`) и доверенный CDN/сервис или пересмотрите подход к песочнице.

### Загрязнение глобального пространства имён

По умолчанию экспортируются `window.navigate` и `window.navigateTo`. Отключите при конфликте с существующими глобалами:

```ts
createHorizon({ ..., exposeNavigate: false })
// или
start({ exposeNavigate: false })
```

---

## Жизненный цикл дочернего приложения

```
NOT_LOADED
   │ load()          загрузка HTML / скриптов, выполнение в песочнице
NOT_BOOTSTRAPPED
   │ bootstrap()     однократная настройка (вызов раз за сессию)
NOT_MOUNTED
   │ mount()   ←──────────────────────────────────┐
MOUNTED                                            │
   │ unmount() ──────────────────────────────────→ NOT_MOUNTED
   │
   │ (только keepAlive)
   │ onPause()  ─────────────────────────────────→ PAUSED
   │ onResume() ─────────────────────────────────→ MOUNTED
```

---

## Запуск примеров

В репозитории есть запускаемые примеры для каждого поддерживаемого хост-фреймворка с общими шестью дочерними приложениями.

### Дочерние приложения (порты одинаковы во всех примерах)

| Пакет           | Порт | Стек                         |
| --------------- | ---- | ---------------------------- |
| `child-vanilla` | 3001 | Vanilla TS                   |
| `child-react`   | 3002 | React 18                     |
| `child-vue`     | 3003 | Vue 3                        |
| `child-solid`   | 3004 | Solid                        |
| `child-svelte`  | 3005 | Svelte 4                     |
| `child-ember`   | 3006 | Жизненный цикл в стиле Ember |

### Хост-приложения (все на порту 3000)

| Команда                | Хост                                  |
| ---------------------- | ------------------------------------- |
| `pnpm example:vanilla` | Vanilla TS                            |
| `pnpm example:react`   | React + хуки `horizon-mfe/react`      |
| `pnpm example:vue`     | Vue 3 + composables `horizon-mfe/vue` |
| `pnpm example:solid`   | Solid                                 |
| `pnpm example:svelte`  | Svelte 4                              |
| `pnpm example:ember`   | Жизненный цикл в стиле Ember          |

```bash
# Установить всё
pnpm install

# Выбрать хост и запустить все серверы
pnpm example:vanilla   # или :react / :vue / :solid / :svelte / :ember
```

Откройте **http://localhost:3000**.

> **Как устроено:** дочерние приложения собираются в бандлы IIFE (`vite build --watch`) и раздаются через `vite preview`. Хост загружает эти бандлы, выполняет их в JS-песочнице и монтирует/размонтирует по текущему маршруту.

### Ручной запуск

```bash
# Терминал 1 — сборка ядра в watch
pnpm dev

# Терминалы 2–7 — дочерние приложения
pnpm --filter child-vanilla dev
pnpm --filter child-react   dev
pnpm --filter child-vue     dev
pnpm --filter child-solid   dev
pnpm --filter child-svelte  dev
pnpm --filter child-ember   dev

# Терминал 8 — хост (один на выбор)
pnpm --filter host-vanilla dev
pnpm --filter host-react   dev
pnpm --filter host-vue     dev
```

---

## Участие в разработке

Участие приветствуется. Создавайте issues для багов и идей, pull request'ы всегда рады.

---

## Лицензия

MIT
