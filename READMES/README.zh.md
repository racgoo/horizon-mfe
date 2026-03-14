# horizon-mfe(beta WIP)

**Version:** 0.0.1

[![npm version](https://img.shields.io/npm/v/horizon-mfe)](https://www.npmjs.com/package/horizon-mfe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**README 语言** [EN [English]](https://github.com/racgoo/horizon-mfe) / [KR [한국어]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ko.md) / [中文 [简体]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.zh.md) / [日本語](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ja.md) / [Español](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.sp.md) / [Français](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.fr.md) / [हिन्दी](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.hi.md) / [Русский](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ru.md) / [العربية](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.arc.md)

轻量级微前端框架。

- **零依赖** — gzip 约 8 kB
- **框架适配器** — React、Vue 3、Solid、Svelte 4、Ember / 自定义（`horizon-mfe/*`）
- **HTML 入口加载** — 指定 URL，Horizon 自动拉取并执行
- **JS 沙箱** — 基于 Proxy 的每应用 window 隔离（旧版浏览器回退到 SnapshotSandbox）
- **CSS 隔离** — `data-horizon-app` 作用域或 Shadow DOM
- **基于路由的激活** — 路径前缀或自定义判定
- **Keep-alive** — 路由切换时保留应用状态，仅显示/隐藏不重新挂载
- **共享状态** — 通过内置 event bus 实现类型安全的跨应用状态同步
- **TypeScript 优先** — 提供完整类型定义

---

## 安装

```bash
pnpm add horizon-mfe
# 或
npm install horizon-mfe
```

---

## 快速开始

### 简化 API（`createHorizon`）

一次调用完成应用注册并启动 Horizon。

```ts
import { createHorizon } from "horizon-mfe";

createHorizon({
  container: "#app-container",
  keepAlive: true, // 路由切换时保留状态
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

### 经典 API（`registerApp` + `start`）

仍然完全支持，适合需要细粒度控制的场景。

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
    /* 返回 false 可取消挂载 */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
});
```

### 子应用（任意框架）

通过 `window.__HORIZON_LIFECYCLE__` 导出生命周期钩子，适用于任何框架。

```ts
// src/horizon.ts
window.__HORIZON_LIFECYCLE__ = {
  async bootstrap() {
    await loadConfig(); // 首次挂载前调用一次
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
    /* DOM 隐藏，状态保留 */
  },
  async onResume(props) {
    /* 再次显示时调用 */
  },
};
```

---

## 框架适配器

各适配器封装生命周期样板代码，**子应用无需直接引用 Horizon**。在子应用中安装对应适配器即可。

### React（`horizon-mfe/react`）

```bash
pnpm add horizon-mfe react react-dom
```

**子应用：**

```tsx
// src/main.tsx
import { defineApp } from "horizon-mfe/react";
import App from "./App";

defineApp(App);
// 或带选项：
defineApp(App, {
  onBootstrap: async () => await loadConfig(),
  onMount: (props) => {},
  onUnmount: () => {},
  onPause: (props) => {},
  onResume: (props) => {},
  mapProps: (props) => ({ ...props.props }), // 将 Horizon props 映射给根组件
});
```

**主应用（React）：**

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
      <span>共享计数: {count}</span>
      <div id="app-container" />
    </>
  );
}
```

**共享状态（子应用）：**

```tsx
import { useSharedState } from "horizon-mfe/react";

function Counter() {
  const [count, setCount] = useSharedState<number>("count", 0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**路由同步（keep-alive + React Router）：**

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

function RouterSync() {
  useRouteSync(useNavigate());
  return null;
}
// 在 <BrowserRouter> 内、与 <Routes> 同级渲染 <RouterSync />
```

---

### Vue 3（`horizon-mfe/vue`）

```bash
pnpm add horizon-mfe vue
```

**子应用：**

```ts
// src/main.ts
import { defineApp } from "horizon-mfe/vue";
import App from "./App.vue";
import router from "./router";

defineApp(App, {
  setup: (app, props) => app.use(router), // 挂载前安装插件
  onPause: (props) => {},
  onResume: (props) => {},
});
```

在任意组件中访问 Horizon props：

```vue
<script setup lang="ts">
import { inject } from "vue";
import { HorizonPropsKey } from "horizon-mfe/vue";

const horizonProps = inject(HorizonPropsKey);
horizonProps?.eventBus.emit("my:event", { data: 123 });
</script>
```

**共享状态（子应用 composable）：**

```ts
import { useSharedState } from "horizon-mfe/vue";

const [count, setCount] = useSharedState<number>("count", 0);
// count 是 Vue Ref<number> — script 中用 count.value，模板中用 {{ count }}
```

**主应用（Vue）：**

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

### Solid（`horizon-mfe/solid`）

```bash
pnpm add horizon-mfe solid-js
```

```tsx
// src/main.tsx
import { defineApp } from "horizon-mfe/solid";
import App from "./App";

defineApp(App);
```

**共享状态：**

```tsx
import { useSharedState } from "horizon-mfe/solid";

const [count, setCount] = useSharedState<number>("count", 0);
return <div>{count()}</div>; // count() — Solid signal 访问器
```

---

### Svelte 4（`horizon-mfe/svelte`）

```bash
pnpm add horizon-mfe svelte
```

```ts
// src/main.ts
import { defineApp } from "horizon-mfe/svelte";
import App from "./App.svelte";

defineApp(App);
```

**共享状态（Svelte writable store）：**

```svelte
<script>
  import { useSharedState } from 'horizon-mfe/svelte'
  const count = useSharedState('count', 0)
</script>
<button on:click={() => $count += 1}>{$count}</button>
```

**主应用（Svelte）：**

```ts
import { useHorizonHost, useHostSharedState } from 'horizon-mfe/svelte'

const { pathname, navigate } = useHorizonHost({ ... })
const count = useHostSharedState('count', 0)
```

---

### Ember / 自定义（`horizon-mfe/ember`）

Ember 适配器接受纯生命周期对象，适用于 Ember 或自行管理渲染的任意框架。

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

## API 参考

### `createHorizon(options)`

简化的一键配置。

| 字段             | 类型                       | 说明                                        |
| ---------------- | -------------------------- | ------------------------------------------- |
| `apps`           | `CreateHorizonAppConfig[]` | 应用定义（`route` 为 `activeRule` 的别名）  |
| `container`      | `string \| HTMLElement`    | 所有应用的默认挂载容器                      |
| `keepAlive`      | `boolean`                  | 所有应用的默认 keep-alive                   |
| `onMount`        | `(app) => Promise<void>`   | 每个应用挂载后调用                          |
| `onUnmount`      | `(app) => Promise<void>`   | 每个应用卸载前调用                          |
| `onPause`        | `(app) => Promise<void>`   | keep-alive 应用被隐藏时调用                 |
| `onResume`       | `(app) => Promise<void>`   | keep-alive 应用再次显示时调用               |
| `onRouteChange`  | `() => void`               | 每次路由变化时调用                          |
| `exposeNavigate` | `boolean`                  | 是否暴露 `window.navigateTo`（默认 `true`） |

---

### `registerApp(config | config[])`

注册一个或多个应用。可在 `start()` 之前或之后调用。

| 字段         | 类型                                    | 说明                         |
| ------------ | --------------------------------------- | ---------------------------- |
| `name`       | `string`                                | 唯一标识                     |
| `entry`      | `string \| { scripts, styles?, html? }` | HTML 入口 URL 或显式资源列表 |
| `container`  | `string \| HTMLElement`                 | 挂载目标选择器或元素         |
| `activeRule` | `string \| (location) => boolean`       | 路径前缀或自定义判定函数     |
| `keepAlive`  | `boolean`                               | 路由切换时是否保留状态       |
| `props`      | `Record<string, unknown>`               | 传给生命周期钩子的额外 props |

```ts
// HTML 入口（推荐）
registerApp({ entry: 'http://localhost:3001', ... })

// 显式资源列表 — 跳过 HTML 解析
registerApp({ entry: { scripts: ['http://localhost:3001/app.iife.js'] }, ... })
```

---

### `start(config?)`

启动路由监听并立即挂载匹配的应用。

```ts
start({
  beforeMount: async (app) => {
    /* 返回 false 可取消 */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
  onPause: async (app) => {},
  onResume: async (app) => {},
  onRouteChange: () => {},
  exposeNavigate: true, // 暴露 window.navigateTo（默认 true）
});
```

---

### `navigateTo(path)`

写入新的 history 并触发 Horizon 的重新路由逻辑。

```ts
import { navigateTo } from "horizon-mfe";
navigateTo("/dashboard");
```

默认也会暴露为 `window.navigateTo` 和 `window.navigate`。

---

### `getApp(name)`

获取已注册的 `App` 实例，用于状态查看或手动控制。

```ts
const app = getApp("dashboard");
console.log(app?.status);
// "NOT_LOADED" | "LOADING" | "NOT_BOOTSTRAPPED" | "BOOTSTRAPPING"
// | "NOT_MOUNTED" | "MOUNTING" | "MOUNTED" | "UNMOUNTING"
// | "PAUSING" | "PAUSED" | "RESUMING" | "LOAD_ERROR"
```

---

## 事件总线

类型安全的跨应用通信与共享状态，无需额外配置。

```ts
import { eventBus } from 'horizon-mfe'

// 发送一次性事件
eventBus.emit('cart:updated', { count: 3 })

// 订阅（返回取消订阅函数）
const off = eventBus.on('cart:updated', ({ count }) => updateBadge(count))

// 仅监听一次
eventBus.once('user:logout', () => clearSession())

// 共享状态 — setState 会广播 "store:<key>" 并持久化
eventBus.setState('theme', 'dark')
eventBus.getState('theme')   // "dark"

// 子应用中通过 props.eventBus 使用（同一单例）
async mount({ eventBus }) {
  eventBus.on('theme:change', applyTheme)
}
```

框架适配器提供的 `useSharedState` / `useHostSharedState` 会自动封装 `setState` / `getState`。

---

## Keep-Alive

当应用设置 `keepAlive: true` 时，路由变化时 Horizon 会隐藏 DOM 而不是销毁。状态、定时器和订阅在导航间保留。

```ts
createHorizon({
  keepAlive: true, // 应用于所有应用
  apps: [
    { name: "cart", entry: "...", route: "/cart", keepAlive: false },
    // ^ 可单应用覆盖
  ],
});
```

| 事件     | 普通模式                   | Keep-Alive                |
| -------- | -------------------------- | ------------------------- |
| 离开路由 | 调用 `unmount`，移除 DOM   | 调用 `onPause`，隐藏 DOM  |
| 返回路由 | 调用 `mount`，重新创建 DOM | 调用 `onResume`，显示 DOM |

### Keep-Alive 下的路由同步

子应用自带 SPA 路由（React Router、Vue Router 等）时，暂停期间路由内部状态可能与主应用 URL 不一致。例如：

1. 用户在购物车子应用内导航到 `/cart/checkout`
2. 主应用导航到 `/dashboard` — 购物车被 **暂停**（DOM 隐藏，状态保留）
3. 主应用回到 `/cart` — 购物车 **恢复**，但其路由仍指向 `/cart/checkout`

`onResume` 生命周期会收到 `props.pathname`（当前主应用 URL）。将其传给框架的路由即可重新同步。

#### React — 使用 data router 的 `onResume`（推荐）

使用 `createBrowserRouter` + `RouterProvider` 时，路由实例在 React 树外，可在 `onResume` 中直接调用 `router.navigate`：

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

#### React — 传统 `BrowserRouter` 下的 `useRouteSync`

若使用 `<BrowserRouter>`，可在路由上下文中使用 `useRouteSync`，它会在恢复时监听 `horizon:app:resume` 自定义事件：

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

// 在 <BrowserRouter> 内、与 <Routes> 同级渲染
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

#### Vue Router — `onResume` 选项

`horizon-mfe/vue` 同样会派发 `horizon:app:resume`，更简单的方式是使用 `onResume` 选项：

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

#### Vanilla / 其他框架

在 `onResume` 生命周期中直接调用路由的 imperative 导航：

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

> **为何不自动同步？** Horizon 不会在恢复时自动驱动子应用路由 — 有的应用用 hash 路由、相对路径或根本没有路由。`onResume` 让你显式控制。

---

## CSS 隔离

### 作用域属性（默认）

Horizon 在容器元素上添加 `data-horizon-app="<name>"`。这是**约定式**做法 — 子应用需在 CSS 选择器前加上该属性才能实现作用域。样式表仍注入到 `document.head`。

```css
/* 子应用 CSS 需按此方式书写 */
[data-horizon-app="dashboard"] .header {
  color: red;
}
```

### Shadow DOM — `<horizon-app>` 自定义元素

需要**真正的 CSS 封装**时，可使用 `<horizon-app>` 自定义元素。Horizon 会为其挂载 Shadow DOM，子应用样式不会泄漏，主应用样式也不会渗入。

```html
<!-- 主应用 HTML 中，用自定义元素替代普通 div 容器 -->
<horizon-app name="cart"></horizon-app>
```

```ts
import { HorizonAppElement } from "horizon-mfe";
// 导入时自动注册 <horizon-app>
```

当 DOM 中存在 `<horizon-app>` 时，Horizon 会将子应用挂载到其 Shadow Root 内而非普通容器。样式表注入到 shadow root，完全隔离。

> **浏览器兼容性：** 所有现代浏览器均支持 `attachShadow`（Chrome 53+、Firefox 63+、Safari 10+、Edge 79+）。若不支持，Horizon 会回退到 `scopeAttribute` 并输出警告。

> **注意：** Shadow DOM 可能影响在容器外渲染的全局弹窗或 portal（例如部分 UI 库将 tooltip 插入 `document.body`）。

---

## JS 沙箱

每个子应用拥有独立的 `window` 代理。子应用设置的全局变量保存在每应用的 Map 中，不会写入真实 `window`，因此不会泄漏到主应用或其他应用。

- **ProxySandbox** — 现代浏览器中自动使用
- **SnapshotSandbox** — 旧环境中自动回退（在 deactivate 时快照/恢复真实 `window`）

**生命周期：** 应用加载时激活沙箱（脚本在沙箱上下文中执行），在 mount/pause/resume 期间保持激活，unmount 时完全清理。

### 隔离说明

| 脚本类型                       | 隔离情况                                                                                       |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| IIFE / UMD 包                  | ✅ 完全隔离 — 真实 `window` 不被修改                                                           |
| 内联脚本                       | ✅ 完全隔离                                                                                    |
| `<script type="module">` (ESM) | ⚠️ **不经过沙箱** — 浏览器在真实全局作用域执行 ES 模块。需使用 IIFE/UMD 构建才能获得完整隔离。 |

---

## 已知限制

### ES 模块不经沙箱

以 ES 模块形式构建的子应用（`<script type="module">`）在真实全局作用域执行 — 这是浏览器层面的限制，无法绕过。子应用构建请使用 **IIFE 或 UMD** 以获得完整 JS 隔离。

```ts
// vite.config.ts（子应用）
build: {
  lib: {
    formats: ["iife"],
  },
}
```

### 内容安全策略（CSP）

Horizon 通过 `new Function()` 执行 IIFE/UMD 脚本，CSP 中需要允许 `unsafe-eval`：

```
Content-Security-Policy: script-src 'self' 'unsafe-eval';
```

若部署环境禁止 `unsafe-eval`，可使用显式资源列表入口（`entry: { scripts: [...] }`）配合可信 CDN/服务，或根据威胁模型重新评估沙箱方案。

### 全局命名空间

默认会暴露 `window.navigate` 和 `window.navigateTo`。若与现有全局冲突可关闭：

```ts
createHorizon({ ..., exposeNavigate: false })
// 或
start({ exposeNavigate: false })
```

---

## 子应用生命周期

```
NOT_LOADED
   │ load()          拉取 HTML / 脚本，在沙箱中执行
NOT_BOOTSTRAPPED
   │ bootstrap()     一次性初始化（每会话仅调用一次）
NOT_MOUNTED
   │ mount()   ←──────────────────────────────────┐
MOUNTED                                            │
   │ unmount() ──────────────────────────────────→ NOT_MOUNTED
   │
   │（仅 keepAlive）
   │ onPause()  ─────────────────────────────────→ PAUSED
   │ onResume() ─────────────────────────────────→ MOUNTED
```

---

## 运行示例

仓库为每种主应用框架提供了可运行示例，共用同一套六个子应用。

### 子应用（端口在所有示例中固定）

| 包名            | 端口 | 技术栈             |
| --------------- | ---- | ------------------ |
| `child-vanilla` | 3001 | Vanilla TS         |
| `child-react`   | 3002 | React 18           |
| `child-vue`     | 3003 | Vue 3              |
| `child-solid`   | 3004 | Solid              |
| `child-svelte`  | 3005 | Svelte 4           |
| `child-ember`   | 3006 | Ember 风格生命周期 |

### 主应用（均使用端口 3000）

| 命令                   | 主应用                                |
| ---------------------- | ------------------------------------- |
| `pnpm example:vanilla` | Vanilla TS                            |
| `pnpm example:react`   | React + `horizon-mfe/react` hooks     |
| `pnpm example:vue`     | Vue 3 + `horizon-mfe/vue` composables |
| `pnpm example:solid`   | Solid                                 |
| `pnpm example:svelte`  | Svelte 4                              |
| `pnpm example:ember`   | Ember 风格生命周期                    |

```bash
# 安装依赖
pnpm install

# 选择主应用并启动所有服务
pnpm example:vanilla   # 或 :react / :vue / :solid / :svelte / :ember
```

然后访问 **http://localhost:3000**。

> **运行方式：** 子应用以 IIFE 包形式构建（`vite build --watch`），由 `vite preview` 提供。主应用拉取这些包，在 JS 沙箱中执行，并根据当前路由挂载/卸载。

### 手动启动

```bash
# 终端 1 — 核心库 watch 构建
pnpm dev

# 终端 2–7 — 子应用
pnpm --filter child-vanilla dev
pnpm --filter child-react   dev
pnpm --filter child-vue     dev
pnpm --filter child-solid   dev
pnpm --filter child-svelte  dev
pnpm --filter child-ember   dev

# 终端 8 — 主应用（任选其一）
pnpm --filter host-vanilla dev
pnpm --filter host-react   dev
pnpm --filter host-vue     dev
```

---

## 参与贡献

欢迎贡献！可提交 issue 报告问题或建议功能，PR 同样欢迎。

---

## 许可证

MIT
