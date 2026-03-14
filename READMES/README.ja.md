# horizon-mfe(beta WIP)

**Version:** 0.0.1

[![npm version](https://img.shields.io/npm/v/horizon-mfe)](https://www.npmjs.com/package/horizon-mfe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**README 言語** [EN [English]](https://github.com/racgoo/horizon) / [KR [한국어]](https://github.com/racgoo/horizon/blob/main/READMES/README.ko.md) / [中文 [简体]](https://github.com/racgoo/horizon/blob/main/READMES/README.zh.md) / [日本語](https://github.com/racgoo/horizon/blob/main/READMES/README.ja.md) / [Español](https://github.com/racgoo/horizon/blob/main/READMES/README.sp.md) / [Français](https://github.com/racgoo/horizon/blob/main/READMES/README.fr.md) / [हिन्दी](https://github.com/racgoo/horizon/blob/main/READMES/README.hi.md) / [Русский](https://github.com/racgoo/horizon/blob/main/READMES/README.ru.md) / [العربية](https://github.com/racgoo/horizon/blob/main/READMES/README.arc.md)

軽量マイクロフロントエンドフレームワーク。

- **ゼロ依存** — gzip 約 8 kB
- **フレームワークアダプター** — React、Vue 3、Solid、Svelte 4、Ember / カスタム（`horizon-mfe/*`）
- **HTML エントリー読み込み** — URL を指定すると Horizon が取得・実行
- **JS サンドボックス** — アプリごとの Proxy ベース window 隔離（レガシーは SnapshotSandbox にフォールバック）
- **CSS 隔離** — `data-horizon-app` スコープまたは Shadow DOM
- **ルートベースの有効化** — パスプレフィックスまたはカスタム判定
- **Keep-alive** — ルート切り替えでアプリ状態を保持、再マウントせず表示/非表示
- **共有状態** — 組み込みイベントバスで型安全なアプリ間状態同期
- **TypeScript ファースト** — 型定義完備

---

## インストール

```bash
pnpm add horizon-mfe
# または
npm install horizon-mfe
```

---

## クイックスタート

### 簡易 API（`createHorizon`）

1 回の呼び出しでアプリ登録と Horizon 起動まで行います。

```ts
import { createHorizon } from "horizon-mfe";

createHorizon({
  container: "#app-container",
  keepAlive: true, // ルート切り替えで状態を保持
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

### 従来 API（`registerApp` + `start`）

引き続き完全サポート。細かい制御が必要な場合に便利です。

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
    /* false を返すとマウントをキャンセル */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
});
```

### 子アプリ（任意のフレームワーク）

`window.__HORIZON_LIFECYCLE__` でライフサイクルフックを公開。どのフレームワークでも利用可能です。

```ts
// src/horizon.ts
window.__HORIZON_LIFECYCLE__ = {
  async bootstrap() {
    await loadConfig(); // 初回マウント前に 1 回だけ呼ばれる
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
    /* DOM 非表示、状態は保持 */
  },
  async onResume(props) {
    /* 再表示時に呼ばれる */
  },
};
```

---

## フレームワークアダプター

各アダプターがライフサイクルのボイラープレートをラップするため、**子アプリから Horizon を直接 import する必要はありません**。子アプリで対応アダプターをインストールしてください。

### React（`horizon-mfe/react`）

```bash
pnpm add horizon-mfe react react-dom
```

**子アプリ：**

```tsx
// src/main.tsx
import { defineApp } from "horizon-mfe/react";
import App from "./App";

defineApp(App);
// またはオプション付き：
defineApp(App, {
  onBootstrap: async () => await loadConfig(),
  onMount: (props) => {},
  onUnmount: () => {},
  onPause: (props) => {},
  onResume: (props) => {},
  mapProps: (props) => ({ ...props.props }), // Horizon の props をルートに渡す前に変換
});
```

**ホストアプリ（React）：**

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
      <span>共有カウント: {count}</span>
      <div id="app-container" />
    </>
  );
}
```

**共有状態（子アプリ）：**

```tsx
import { useSharedState } from "horizon-mfe/react";

function Counter() {
  const [count, setCount] = useSharedState<number>("count", 0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**ルーター同期（keep-alive + React Router）：**

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

function RouterSync() {
  useRouteSync(useNavigate());
  return null;
}
// <BrowserRouter> 内で <Routes> の兄弟として <RouterSync /> をレンダー
```

---

### Vue 3（`horizon-mfe/vue`）

```bash
pnpm add horizon-mfe vue
```

**子アプリ：**

```ts
// src/main.ts
import { defineApp } from "horizon-mfe/vue";
import App from "./App.vue";
import router from "./router";

defineApp(App, {
  setup: (app, props) => app.use(router), // マウント前にプラグインを登録
  onPause: (props) => {},
  onResume: (props) => {},
});
```

任意のコンポーネントで Horizon の props にアクセス：

```vue
<script setup lang="ts">
import { inject } from "vue";
import { HorizonPropsKey } from "horizon-mfe/vue";

const horizonProps = inject(HorizonPropsKey);
horizonProps?.eventBus.emit("my:event", { data: 123 });
</script>
```

**共有状態（子アプリの composable）：**

```ts
import { useSharedState } from "horizon-mfe/vue";

const [count, setCount] = useSharedState<number>("count", 0);
// count は Vue の Ref<number> — スクリプトでは count.value、テンプレートでは {{ count }}
```

**ホストアプリ（Vue）：**

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

**共有状態：**

```tsx
import { useSharedState } from "horizon-mfe/solid";

const [count, setCount] = useSharedState<number>("count", 0);
return <div>{count()}</div>; // count() — Solid の signal アクセサ
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

**共有状態（Svelte の writable store）：**

```svelte
<script>
  import { useSharedState } from 'horizon-mfe/svelte'
  const count = useSharedState('count', 0)
</script>
<button on:click={() => $count += 1}>{$count}</button>
```

**ホストアプリ（Svelte）：**

```ts
import { useHorizonHost, useHostSharedState } from 'horizon-mfe/svelte'

const { pathname, navigate } = useHorizonHost({ ... })
const count = useHostSharedState('count', 0)
```

---

### Ember / カスタム（`horizon-mfe/ember`）

Ember アダプターはプレーンなライフサイクルオブジェクトを受け付けます。Ember や自前でレンダリングを管理するフレームワークに便利です。

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

## API リファレンス

### `createHorizon(options)`

簡易ワンコール設定。

| フィールド       | 型                         | 説明                                                              |
| ---------------- | -------------------------- | ----------------------------------------------------------------- |
| `apps`           | `CreateHorizonAppConfig[]` | アプリ定義（`route` は `activeRule` のエイリアス）                |
| `container`      | `string \| HTMLElement`    | 全アプリのデフォルトマウントコンテナ                              |
| `keepAlive`      | `boolean`                  | 全アプリのデフォルト keep-alive                                   |
| `onMount`        | `(app) => Promise<void>`   | 各アプリのマウント後に呼ばれる                                    |
| `onUnmount`      | `(app) => Promise<void>`   | 各アプリのアンマウント前に呼ばれる                                |
| `onPause`        | `(app) => Promise<void>`   | keep-alive アプリが非表示になったときに呼ばれる                   |
| `onResume`       | `(app) => Promise<void>`   | keep-alive アプリが再表示されたときに呼ばれる                     |
| `onRouteChange`  | `() => void`               | ルート変更のたびに呼ばれる                                        |
| `exposeNavigate` | `boolean`                  | `window.navigateTo` をグローバルに公開するか（デフォルト `true`） |

---

### `registerApp(config | config[])`

1 つ以上のアプリを登録。`start()` の前後どちらでも呼べます。

| フィールド   | 型                                      | 説明                                           |
| ------------ | --------------------------------------- | ---------------------------------------------- |
| `name`       | `string`                                | 一意の識別子                                   |
| `entry`      | `string \| { scripts, styles?, html? }` | HTML エントリー URL または明示的なアセット一覧 |
| `container`  | `string \| HTMLElement`                 | マウント先のセレクターまたは要素               |
| `activeRule` | `string \| (location) => boolean`       | パスプレフィックスまたはカスタム判定           |
| `keepAlive`  | `boolean`                               | ルート切り替えで状態を保持するか               |
| `props`      | `Record<string, unknown>`               | ライフサイクルに渡す追加 props                 |

```ts
// HTML エントリー（推奨）
registerApp({ entry: 'http://localhost:3001', ... })

// 明示的なアセット一覧 — HTML パースをスキップ
registerApp({ entry: { scripts: ['http://localhost:3001/app.iife.js'] }, ... })
```

---

### `start(config?)`

ルート監視を開始し、マッチしたアプリを即座にマウントします。

```ts
start({
  beforeMount: async (app) => {
    /* false を返すとキャンセル */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
  onPause: async (app) => {},
  onResume: async (app) => {},
  onRouteChange: () => {},
  exposeNavigate: true, // window.navigateTo をグローバルに公開（デフォルト true）
});
```

---

### `navigateTo(path)`

新しい history エントリーを追加し、Horizon の再ルーティングをトリガーします。

```ts
import { navigateTo } from "horizon-mfe";
navigateTo("/dashboard");
```

デフォルトでは `window.navigateTo` および `window.navigate` にも公開されます。

---

### `getApp(name)`

登録済みの `App` インスタンスを取得。状態確認や手動制御に利用します。

```ts
const app = getApp("dashboard");
console.log(app?.status);
// "NOT_LOADED" | "LOADING" | "NOT_BOOTSTRAPPED" | "BOOTSTRAPPING"
// | "NOT_MOUNTED" | "MOUNTING" | "MOUNTED" | "UNMOUNTING"
// | "PAUSING" | "PAUSED" | "RESUMING" | "LOAD_ERROR"
```

---

## イベントバス

型安全なアプリ間通信と共有状態。追加設定不要です。

```ts
import { eventBus } from 'horizon-mfe'

// 1 回限りのイベントを発火
eventBus.emit('cart:updated', { count: 3 })

// 購読（購読解除関数を返す）
const off = eventBus.on('cart:updated', ({ count }) => updateBadge(count))

// 1 回だけリスン
eventBus.once('user:logout', () => clearSession())

// 共有状態 — setState は "store:<key>" をブロードキャストし値を永続化
eventBus.setState('theme', 'dark')
eventBus.getState('theme')   // "dark"

// 子アプリ内では props.eventBus を使用（同一シングルトン）
async mount({ eventBus }) {
  eventBus.on('theme:change', applyTheme)
}
```

フレームワークアダプターの `useSharedState` / `useHostSharedState` は `setState` / `getState` を自動でラップします。

---

## Keep-Alive

アプリに `keepAlive: true` を指定すると、ルート変更時に Horizon は DOM を破棄せず非表示にします。状態・タイマー・購読はナビゲーション後も維持されます。

```ts
createHorizon({
  keepAlive: true, // 全アプリに適用
  apps: [
    { name: "cart", entry: "...", route: "/cart", keepAlive: false },
    // ^ アプリごとに上書き可能
  ],
});
```

| イベント   | 通常モード                  | Keep-Alive                    |
| ---------- | --------------------------- | ----------------------------- |
| ルート離脱 | `unmount` が呼ばれ DOM 削除 | `onPause` が呼ばれ DOM 非表示 |
| ルート復帰 | `mount` が呼ばれ DOM 再作成 | `onResume` が呼ばれ DOM 表示  |

### Keep-Alive 時のルート同期

子アプリが独自の SPA ルーター（React Router、Vue Router など）を持つ場合、一時停止中にそのルーターの内部状態がホストの URL とずれることがあります。例：

1. ユーザーがカート子アプリ内で `/cart/checkout` に遷移
2. ホストが `/dashboard` に遷移 — カートは **一時停止**（DOM 非表示、状態は保持）
3. ホストが `/cart` に戻る — カートは **再開**するが、ルーターはまだ `/cart/checkout` を指したまま

`onResume` ライフサイクルフックには `props.pathname`（現在のホスト URL）が渡されます。これをフレームワークのルーターに渡して再同期してください。

#### React — データルーターでの `onResume`（推奨）

`createBrowserRouter` + `RouterProvider` を使う場合、ルーターインスタンスは React ツリー外にあるため、`onResume` 内で直接 `router.navigate` を呼べます：

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

#### React — 従来の `BrowserRouter` での `useRouteSync`

`<BrowserRouter>` を使う場合は、ルーターコンテキスト内で `useRouteSync` を使用してください。再開時に発火する `horizon:app:resume` カスタムイベントをリッスンします：

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

// <BrowserRouter> 内で <Routes> の兄弟としてレンダー
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

#### Vue Router — `onResume` オプション

`horizon-mfe/vue` も `horizon:app:resume` を発火しますが、最も簡単なのは `onResume` オプションを使う方法です：

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

#### Vanilla / その他

`onResume` ライフサイクルフック内でルーターの命令的ナビゲートを直接呼びます：

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

> **なぜ自動で同期しないのか？** Horizon は再開時に子アプリのルーターを自動では動かしません。ハッシュルートや相対パスを使うアプリ、ルーターを持たないアプリもあるためです。`onResume` で明示的に制御できます。

---

## CSS 隔離

### スコープ属性（デフォルト）

Horizon はコンテナ要素に `data-horizon-app="<name>"` を付与します。**規約ベース**の方式で、子アプリは CSS セレクターにこの属性を付けてスコープを実現します。スタイルシートは引き続き `document.head` に注入されます。

```css
/* 子アプリの CSS はこのように記述 */
[data-horizon-app="dashboard"] .header {
  color: red;
}
```

### Shadow DOM — `<horizon-app>` カスタム要素

**真の CSS カプセル化**が必要な場合は `<horizon-app>` カスタム要素を使用してください。Horizon が自動で Shadow DOM をアタッチするため、子のスタイルが漏れず、ホストのスタイルも侵入しません。

```html
<!-- ホストの HTML で、通常の div コンテナの代わりに -->
<horizon-app name="cart"></horizon-app>
```

```ts
import { HorizonAppElement } from "horizon-mfe";
// import 時に <horizon-app> を自動登録
```

DOM に `<horizon-app>` が存在する場合、Horizon は子アプリを通常のコンテナではなくその Shadow Root 内にマウントします。スタイルシートは shadow root に注入され、完全にスコープされます。

> **ブラウザ互換性：** `attachShadow` は主要なモダンブラウザでサポートされています（Chrome 53+、Firefox 63+、Safari 10+、Edge 79+）。Shadow DOM が利用できない環境では、Horizon は自動で `scopeAttribute` モードにフォールバックし、警告をログします。

> **注意：** Shadow DOM は、コンテナ外にレンダリングするグローバルモーダルやポータル（例：ツールチップを `document.body` に注入する UI ライブラリ）と相性が悪い場合があります。

---

## JS サンドボックス

各子アプリは独立した `window` プロキシを持ちます。子アプリが設定したグローバルはアプリごとの Map に保存され、実際の `window` には書き込まれないため、ホストや他アプリに漏れません。

- **ProxySandbox** — モダンブラウザで自動使用
- **SnapshotSandbox** — レガシー環境では自動フォールバック（非アクティブ時に実際の `window` をスナップショット/復元）

**ライフサイクル：** アプリ読み込み時にサンドボックスが有効化（スクリプトはサンドボックスコンテキストで実行）、mount/pause/resume 中は有効のまま、unmount 時に完全にクリアされます。

### 隔離の保証

| スクリプト種別                 | 隔離状況                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| IIFE / UMD バンドル            | ✅ 完全隔離 — 実際の `window` は変更されない                                                                                             |
| インラインスクリプト           | ✅ 完全隔離                                                                                                                              |
| `<script type="module">` (ESM) | ⚠️ **サンドボックス対象外** — ブラウザは ES モジュールを実際のグローバルスコープで実行。完全隔離には IIFE/UMD ビルドを使用してください。 |

---

## 既知の制限

### ES モジュールはサンドボックスされない

ES モジュール（`<script type="module">`）としてビルドした子アプリは、実際のグローバルスコープで実行されます。これはブラウザの制約で回避できません。完全な JS 隔離には子アプリのビルドで **IIFE または UMD** を出力形式に指定してください。

```ts
// vite.config.ts（子アプリ）
build: {
  lib: {
    formats: ["iife"],
  },
}
```

### Content Security Policy（CSP）

Horizon は IIFE/UMD スクリプトを `new Function()` で実行するため、CSP で `unsafe-eval` を許可する必要があります：

```
Content-Security-Policy: script-src 'self' 'unsafe-eval';
```

厳格な CSP で `unsafe-eval` を禁止している環境では、明示的なアセット一覧エントリー（`entry: { scripts: [...] }`）と信頼できる CDN/サービスの利用、あるいは脅威モデルに応じたサンドボックス方針の見直しを検討してください。

### グローバル名前空間

デフォルトで `window.navigate` と `window.navigateTo` が公開されます。既存のグローバルと衝突する場合は無効化できます：

```ts
createHorizon({ ..., exposeNavigate: false })
// または
start({ exposeNavigate: false })
```

---

## 子アプリのライフサイクル

```
NOT_LOADED
   │ load()          HTML / スクリプトを取得し、サンドボックスで実行
NOT_BOOTSTRAPPED
   │ bootstrap()     1 回限りのセットアップ（セッションあたり 1 回呼ばれる）
NOT_MOUNTED
   │ mount()   ←──────────────────────────────────┐
MOUNTED                                            │
   │ unmount() ──────────────────────────────────→ NOT_MOUNTED
   │
   │（keepAlive 時のみ）
   │ onPause()  ─────────────────────────────────→ PAUSED
   │ onResume() ─────────────────────────────────→ MOUNTED
```

---

## サンプルの実行

リポジトリには各ホストフレームワーク用の実行可能なサンプルがあり、同じ 6 つの子アプリを共有しています。

### 子アプリ（全サンプルでポート固定）

| パッケージ      | ポート | スタック               |
| --------------- | ------ | ---------------------- |
| `child-vanilla` | 3001   | Vanilla TS             |
| `child-react`   | 3002   | React 18               |
| `child-vue`     | 3003   | Vue 3                  |
| `child-solid`   | 3004   | Solid                  |
| `child-svelte`  | 3005   | Svelte 4               |
| `child-ember`   | 3006   | Ember 風ライフサイクル |

### ホストアプリ（いずれもポート 3000）

| コマンド               | ホスト                                |
| ---------------------- | ------------------------------------- |
| `pnpm example:vanilla` | Vanilla TS                            |
| `pnpm example:react`   | React + `horizon-mfe/react` フック    |
| `pnpm example:vue`     | Vue 3 + `horizon-mfe/vue` composables |
| `pnpm example:solid`   | Solid                                 |
| `pnpm example:svelte`  | Svelte 4                              |
| `pnpm example:ember`   | Ember 風ライフサイクル                |

```bash
# 依存関係をインストール
pnpm install

# ホストを選んで全サーバーを起動
pnpm example:vanilla   # または :react / :vue / :solid / :svelte / :ember
```

その後 **http://localhost:3000** を開いてください。

> **仕組み：** 子アプリは IIFE バンドル（`vite build --watch`）としてビルドされ、`vite preview` で配信されます。ホストがこれらのバンドルを取得し、JS サンドボックス内で実行し、現在のルートに応じてマウント/アンマウントします。

### 手動起動

```bash
# ターミナル 1 — コアライブラリの watch ビルド
pnpm dev

# ターミナル 2–7 — 子アプリ
pnpm --filter child-vanilla dev
pnpm --filter child-react   dev
pnpm --filter child-vue     dev
pnpm --filter child-solid   dev
pnpm --filter child-svelte  dev
pnpm --filter child-ember   dev

# ターミナル 8 — ホスト（いずれか 1 つ）
pnpm --filter host-vanilla dev
pnpm --filter host-react   dev
pnpm --filter host-vue     dev
```

---

## コントリビューション

コントリビューション歓迎です。バグ報告や機能要望は issue で、プルリクエストもお待ちしています。

---

## ライセンス

MIT
