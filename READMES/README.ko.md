# horizon-mfe(beta WIP)

**Version:** 0.0.2

[![npm version](https://img.shields.io/npm/v/horizon-mfe)](https://www.npmjs.com/package/horizon-mfe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**README-Language-Map** [EN [English]](https://github.com/racgoo/horizon-mfe) / [KR [한국어]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ko.md) / [中文 [简体]](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.zh.md) / [日本語](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ja.md) / [Español](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.sp.md) / [Français](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.fr.md) / [हिन्दी](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.hi.md) / [Русский](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.ru.md) / [العربية](https://github.com/racgoo/horizon-mfe/blob/main/READMES/README.arc.md)

가벼운 마이크로 프론트엔드 프레임워크입니다.

- **Zero dependencies** — gzip 기준 약 8 kB
- **프레임워크 어댑터 제공** — React, Vue 3, Solid, Svelte 4, Ember / 커스텀 (`horizon-mfe/*`)
- **HTML 엔트리 로딩** — URL만 지정하면 Horizon이 HTML을 가져와 스크립트/스타일을 자동 실행
- **JS 샌드박스** — 앱별 Proxy 기반 `window` 격리 (레거시 브라우저에서는 SnapshotSandbox 사용)
- **CSS 격리** — `data-horizon-app` 스코프 또는 Shadow DOM
- **라우트 기반 활성화** — 경로 prefix 또는 커스텀 predicate
- **Keep-alive** — 라우트 전환 시 상태를 보존하고, DOM만 show/hide
- **공유 상태** — 내장 이벤트 버스를 통한 타입 안전 cross-app 상태 동기화
- **TypeScript-first** — 전체 타입 정의 포함

---

## 설치

```bash
pnpm add horizon-mfe
# 또는
npm install horizon-mfe
```

---

## 빠른 시작

### 단일 진입점 API (`createHorizon`)

호스트에서 한 번만 호출하면 앱 등록 + 시작까지 모두 처리합니다.

```ts
import { createHorizon } from "horizon-mfe";

createHorizon({
  container: "#app-container",
  keepAlive: true, // 라우트 전환 간 상태 유지
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

### 클래식 API (`registerApp` + `start`)

기존 방식도 그대로 지원합니다. 세밀하게 제어하고 싶을 때 유용합니다.

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
    /* false를 반환하면 mount 취소 */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
});
```

### 차일드 앱 (프레임워크 공통)

`window.__HORIZON_LIFECYCLE__`에 라이프사이클 훅을 export 합니다. 어떤 프레임워크든 동일하게 동작합니다.

```ts
// src/horizon.ts
window.__HORIZON_LIFECYCLE__ = {
  async bootstrap() {
    await loadConfig()           // 첫 mount 전에 한 번만 호출
  },

  async mount({ container, eventBus, name, pathname }) {
    render(<App />, container)
    eventBus.on('user:login', ({ userId }) => { /* ... */ })
  },

  async unmount({ container }) {
    unmountComponentAtNode(container)
  },

  async onPause(props)  { /* DOM만 숨기고 상태는 보존 */ },
  async onResume(props) { /* 다시 보여질 때 호출       */ },
}
```

---

## 프레임워크 어댑터

각 어댑터는 라이프사이클 보일러플레이트를 감춰주기 때문에, **차일드 앱은 Horizon을 직접 import 할 필요가 없습니다.**
차일드 앱 쪽 패키지에 어댑터를 함께 설치해 사용합니다.

### React (`horizon-mfe/react`)

```bash
pnpm add horizon-mfe react react-dom
```

**차일드 앱:**

```tsx
// src/main.tsx
import { defineApp } from "horizon-mfe/react";
import App from "./App";

defineApp(App);
// 옵션이 필요하다면:
defineApp(App, {
  onBootstrap: async () => await loadConfig(),
  onMount: (props) => {},
  onUnmount: () => {},
  onPause: (props) => {},
  onResume: (props) => {},
  mapProps: (props) => ({ ...props.props }), // Horizon props를 루트 컴포넌트 props로 매핑
});
```

**호스트 앱 (React):**

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

**공유 상태 (차일드):**

```tsx
import { useSharedState } from "horizon-mfe/react";

function Counter() {
  const [count, setCount] = useSharedState<number>("count", 0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**라우터 동기화 (keep-alive + React Router):**

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

function RouterSync() {
  useRouteSync(useNavigate());
  return null;
}
// <BrowserRouter> 내부에서 <Routes>와 나란히 렌더링
```

---

### Vue 3 (`horizon-mfe/vue`)

```bash
pnpm add horizon-mfe vue
```

**차일드 앱:**

```ts
// src/main.ts
import { defineApp } from "horizon-mfe/vue";
import App from "./App.vue";
import router from "./router";

defineApp(App, {
  setup: (app, props) => app.use(router), // mount 전에 플러그인 설치
  onPause: (props) => {},
  onResume: (props) => {},
});
```

컴포넌트 안에서 Horizon props 사용:

```vue
<script setup lang="ts">
import { inject } from "vue";
import { HorizonPropsKey } from "horizon-mfe/vue";

const horizonProps = inject(HorizonPropsKey);
horizonProps?.eventBus.emit("my:event", { data: 123 });
</script>
```

**공유 상태 (child composable):**

```ts
import { useSharedState } from "horizon-mfe/vue";

const [count, setCount] = useSharedState<number>("count", 0);
// count는 Vue Ref<number> — script에서는 count.value, template에서는 {{ count }}
```

**호스트 앱 (Vue):**

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

**공유 상태:**

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

**공유 상태 (Svelte writable store):**

```svelte
<script>
  import { useSharedState } from 'horizon-mfe/svelte'
  const count = useSharedState('count', 0)
</script>
<button on:click={() => $count += 1}>{$count}</button>
```

**호스트 앱 (Svelte):**

```ts
import { useHorizonHost, useHostSharedState } from "horizon-mfe/svelte";

const { pathname, navigate } = useHorizonHost({
  /* ... */
});
const count = useHostSharedState("count", 0);
```

---

### Ember / 커스텀 (`horizon-mfe/ember`)

Ember 어댑터는 “순수 라이프사이클 객체”를 받습니다. Ember는 물론, 자체 렌더링 시스템을 가진 어떤 프레임워크에도 사용할 수 있습니다.

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

## API 레퍼런스

### `createHorizon(options)`

간단한 원샷 설정 API입니다.

| 필드             | 타입                       | 설명                                         |
| ---------------- | -------------------------- | -------------------------------------------- |
| `apps`           | `CreateHorizonAppConfig[]` | 앱 정의 (라우팅은 `route` 또는 `activeRule`) |
| `container`      | `string \| HTMLElement`    | 모든 앱의 기본 컨테이너                      |
| `keepAlive`      | `boolean`                  | 기본 keep-alive 설정                         |
| `onMount`        | `(app) => Promise<void>`   | 각 앱 mount 이후 호출                        |
| `onUnmount`      | `(app) => Promise<void>`   | 각 앱 unmount 이전 호출                      |
| `onPause`        | `(app) => Promise<void>`   | keep-alive 앱이 숨겨질 때 호출               |
| `onResume`       | `(app) => Promise<void>`   | keep-alive 앱이 다시 보여질 때 호출          |
| `onRouteChange`  | `() => void`               | 라우트 변경마다 호출                         |
| `exposeNavigate` | `boolean`                  | `window.navigateTo` 노출 여부 (기본 `true`)  |

---

### `registerApp(config | config[])`

앱을 하나 이상 등록합니다. `start()` 호출 전/후 언제든 등록할 수 있습니다.

| 필드         | 타입                                    | 설명                                     |
| ------------ | --------------------------------------- | ---------------------------------------- |
| `name`       | `string`                                | 고유 앱 이름                             |
| `entry`      | `string \| { scripts, styles?, html? }` | HTML 엔트리 URL 또는 명시적 asset 리스트 |
| `container`  | `string \| HTMLElement`                 | mount 대상 셀렉터 또는 엘리먼트          |
| `activeRule` | `string \| (location) => boolean`       | 경로 prefix 또는 커스텀 predicate        |
| `keepAlive`  | `boolean`                               | 라우트 전환 시 상태 보존 여부            |
| `props`      | `Record<string, unknown>`               | 라이프사이클 훅으로 전달할 추가 props    |

```ts
// HTML 엔트리 (권장)
registerApp({ entry: 'http://localhost:3001', ... })

// 자바스크립트만 직접 지정하고 싶을 때
registerApp({ entry: { scripts: ['http://localhost:3001/app.iife.js'] }, ... })
```

---

### `start(config?)`

라우트 감시를 시작하고, 현재 경로에 매칭되는 앱들을 즉시 mount 합니다.

```ts
start({
  beforeMount: async (app) => {
    /* false 반환 시 mount 취소 */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
  onPause: async (app) => {},
  onResume: async (app) => {},
  onRouteChange: () => {},
  exposeNavigate: true, // window.navigateTo 노출 여부 (기본 true)
});
```

---

### `navigateTo(path)`

`history.pushState`를 호출하고 Horizon의 라우팅 로직을 실행합니다.

```ts
import { navigateTo } from "horizon-mfe";
navigateTo("/dashboard");
```

기본적으로 `window.navigateTo`, `window.navigate`로도 노출됩니다.

---

### `getApp(name)`

등록된 `App` 인스턴스를 가져와 상태 확인이나 수동 제어에 사용할 수 있습니다.

```ts
const app = getApp("dashboard");
console.log(app?.status);
// "NOT_LOADED" | "LOADING" | "NOT_BOOTSTRAPPED" | "BOOTSTRAPPING"
// | "NOT_MOUNTED" | "MOUNTING" | "MOUNTED" | "UNMOUNTING"
// | "PAUSING" | "PAUSED" | "RESUMING" | "LOAD_ERROR"
```

---

## 이벤트 버스

타입이 보장되는 cross-app 통신과 공유 상태를 제공합니다. 별도 설정이 필요 없습니다.

```ts
import { eventBus } from 'horizon-mfe'

// 단발 이벤트 emit
eventBus.emit('cart:updated', { count: 3 })

// 구독 (unsubscribe 함수 반환)
const off = eventBus.on('cart:updated', ({ count }) => updateBadge(count))

// 한 번만 듣기
eventBus.once('user:logout', () => clearSession())

// 공유 상태 — setState는 "store:<key>" 이벤트를 브로드캐스트하고 값을 저장
eventBus.setState('theme', 'dark')
eventBus.getState('theme')   // "dark"

// 차일드 앱 안에서는 props.eventBus 사용 (동일 싱글톤)
async mount({ eventBus }) {
  eventBus.on('theme:change', applyTheme)
}
```

프레임워크 어댑터는 `setState`/`getState`를 감싸는 `useSharedState` / `useHostSharedState` 훅을 제공합니다.

---

## Keep-Alive

앱에 `keepAlive: true`를 설정하면, 라우트가 바뀔 때 DOM을 제거하는 대신 **숨기기만** 합니다.  
상태, 타이머, 구독 등이 네비게이션 사이에서 그대로 유지됩니다.

```ts
createHorizon({
  keepAlive: true, // 전체 앱 기본값
  apps: [
    { name: "cart", entry: "...", route: "/cart", keepAlive: false },
    // ^ 개별 앱 단위로 override 가능
  ],
});
```

| 이벤트      | 일반 모드                | Keep-alive                     |
| ----------- | ------------------------ | ------------------------------ |
| 라우트 이탈 | `unmount` 호출, DOM 제거 | `onPause` 호출, DOM 숨김       |
| 라우트 복귀 | `mount` 호출, DOM 재생성 | `onResume` 호출, DOM 다시 표시 |

### Keep-Alive와 라우터 동기화

차일드 앱이 자체 SPA 라우터(React Router, Vue Router 등)를 갖고 있을 때, 앱이 paused 상태에서 호스트 URL이 바뀌면 차일드 라우터가 어긋날 수 있습니다. 예를 들면:

1. 사용자가 cart 앱 안에서 `/cart/checkout`으로 이동
2. 호스트가 `/dashboard`로 이동 — cart 앱이 **pause** (DOM 숨김, 상태 보존)
3. 호스트가 `/cart`로 다시 이동 — cart 앱이 **resume**, 그러나 cart 라우터는 여전히 `/cart/checkout`

`onResume` 훅은 `props.pathname`(현재 호스트 URL)을 받습니다. 이 값을 프레임워크 라우터에 전달해 동기화할 수 있습니다.

#### React — `onResume`에서 data router 사용 (권장)

최신 `createBrowserRouter` + `RouterProvider` 패턴에서는 라우터 인스턴스가 React 트리 밖에 있으므로, `onResume`에서 `router.navigate`를 직접 호출합니다.

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

#### React — 레거시 `BrowserRouter`에서 `useRouteSync` 사용

`<BrowserRouter>`를 사용하는 경우 `useRouteSync`를 라우터 컨텍스트 안에서 렌더링합니다. resume 시 발행되는 `horizon:app:resume` 이벤트를 수신해 자동으로 이동합니다.

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

// <BrowserRouter> 안에서 <Routes>와 나란히 렌더링
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

#### Vue Router — `onResume` 옵션

`horizon-mfe/vue`도 `horizon:app:resume` 이벤트를 발행합니다. `onResume` 옵션에서 `router.push`를 호출하는 것이 가장 간단합니다.

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

또는 컴포저블 안에서 이벤트를 직접 수신할 수도 있습니다.

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

#### Vanilla / 기타 프레임워크

`onResume` 훅에서 라우터의 navigate 함수를 직접 호출합니다.

```ts
window.__HORIZON_LIFECYCLE__ = {
  async mount({ container }) {
    /* ... */
  },
  async unmount() {
    /* ... */
  },
  async onResume({ pathname }) {
    router.navigate(pathname); // 사용하는 라우터의 navigate
  },
};
```

> **자동으로 처리되지 않는 이유:** 해시 라우팅, 상대 경로, 라우터 없음 등 앱마다 다양한 방식을 사용할 수 있어, Horizon은 의도적으로 자동 이동을 하지 않습니다. `onResume`으로 직접 제어하세요.

---

## CSS 격리

### Scope Attribute (기본)

Horizon은 컨테이너 엘리먼트에 `data-horizon-app="<name>"` 속성을 추가합니다. 이는 **컨벤션 기반** 접근 방식으로, 스타일시트는 여전히 `document.head`에 전역으로 주입됩니다. 실제로 스타일을 격리하려면 차일드 앱의 **모든 CSS 선택자 앞에 이 속성을 직접 붙여야** 합니다.

```css
/* 차일드 앱 CSS는 반드시 이 형식으로 작성해야 합니다 */
[data-horizon-app="dashboard"] .header {
  color: red;
}
```

### Shadow DOM — `<horizon-app>` 커스텀 엘리먼트

**진정한 CSS 캡슐화**를 원한다면 `<horizon-app>` 커스텀 엘리먼트를 사용하세요. Horizon이 자동으로 Shadow DOM을 붙여, 차일드 스타일이 외부로 새어 나가거나 호스트 스타일이 안으로 침투하는 일이 없습니다.

```html
<!-- 호스트 HTML에서 일반 <div> 대신 사용 -->
<horizon-app name="cart"></horizon-app>
```

```ts
import { HorizonAppElement } from "horizon-mfe";
// import 시 자동으로 <horizon-app> 커스텀 엘리먼트 등록
```

`<horizon-app>` 엘리먼트가 DOM에 있으면, Horizon은 Shadow Root 안에 차일드를 마운트하고 스타일시트도 shadow root에 주입하여 완전히 격리합니다.

> **브라우저 호환성:** `attachShadow`는 Chrome 53+, Firefox 63+, Safari 10+, Edge 79+ 등 모든 최신 브라우저에서 지원됩니다. Shadow DOM을 지원하지 않는 환경에서는 자동으로 `scopeAttribute` 모드로 폴백하고 경고를 출력합니다.

> **주의:** Shadow DOM은 컨테이너 밖(`document.body` 등)에 렌더링되는 글로벌 모달·포털과 충돌할 수 있습니다. (일부 UI 라이브러리의 툴팁이 이에 해당합니다.)

---

## JS 샌드박스

각 차일드 앱은 자체 격리된 `window` 프록시를 받습니다.
차일드가 설정한 전역 변수는 **앱별 Map에만 저장되고 실제 `window`에는 절대 쓰이지 않으므로**, 호스트나 다른 앱으로 새어 나가지 않습니다.

- **ProxySandbox** — 현대 브라우저에서 자동 사용
- **SnapshotSandbox** — 레거시 환경 자동 폴백 (활성화 시 `window` 스냅샷, 비활성화 시 복원)

**라이프사이클:** 앱이 로드될 때 샌드박스가 활성화되어 스크립트가 샌드박스 컨텍스트 안에서 실행됩니다. mount/pause/resume 동안 유지되다가, unmount 시 완전히 초기화됩니다.

### 격리 보장 수준

| 스크립트 종류                  | 격리 수준                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| IIFE / UMD 번들                | ✅ 완전 격리 — 실제 `window` 미수정                                                                                         |
| 인라인 스크립트                | ✅ 완전 격리                                                                                                                |
| `<script type="module">` (ESM) | ⚠️ **격리 불가** — 브라우저가 ES 모듈을 실제 전역 스코프에서 실행합니다. 완전한 격리를 원한다면 IIFE/UMD 빌드를 사용하세요. |

---

## 알려진 제약사항

### ES 모듈은 샌드박스 격리 불가

`<script type="module">`으로 빌드된 차일드 앱은 실제 전역 스코프에서 실행됩니다. 이는 브라우저의 구조적 제약으로, 해결 방법이 없습니다. 완전한 JS 격리가 필요하다면 차일드 앱을 **IIFE 또는 UMD** 형식으로 빌드하세요.

```ts
// vite.config.ts (차일드 앱)
build: {
  lib: {
    formats: ["iife"];
  }
}
```

### Content Security Policy

Horizon은 IIFE/UMD 스크립트를 `new Function()`으로 실행하므로 CSP에 `unsafe-eval`이 필요합니다.

```
Content-Security-Policy: script-src 'self' 'unsafe-eval';
```

`unsafe-eval`을 허용하지 않는 엄격한 CSP 환경이라면, 명시적 asset 리스트 방식(`entry: { scripts: [...] }`)을 사용하거나 보안 요구사항에 맞는 다른 접근 방식을 고려하세요.

### 전역 변수 노출

기본적으로 `window.navigate`와 `window.navigateTo`가 전역으로 노출됩니다. 기존 전역 변수와 충돌할 경우 비활성화하세요.

```ts
createHorizon({ ..., exposeNavigate: false })
// 또는
start({ exposeNavigate: false })
```

---

## 차일드 앱 라이프사이클

```
NOT_LOADED
   │ load()          HTML / 스크립트를 가져와 샌드박스에서 실행
NOT_BOOTSTRAPPED
   │ bootstrap()     한 번만 호출되는 초기 설정
NOT_MOUNTED
   │ mount()   ←──────────────────────────────────┐
MOUNTED                                            │
   │ unmount() ──────────────────────────────────→ NOT_MOUNTED
   │
   │ (keepAlive 전용)
   │ onPause()  ─────────────────────────────────→ PAUSED
   │ onResume() ─────────────────────────────────→ MOUNTED
```

---

## 예제 실행 방법

레포에는 모든 지원 호스트 프레임워크에 대한 예제가 포함되어 있으며,  
**동일한 여섯 개 차일드 앱**을 공유합니다.

### 차일드 앱 (포트는 모든 예제에서 고정)

| 패키지          | 포트 | 스택                  |
| --------------- | ---- | --------------------- |
| `child-vanilla` | 3001 | Vanilla TS            |
| `child-react`   | 3002 | React 18              |
| `child-vue`     | 3003 | Vue 3                 |
| `child-solid`   | 3004 | Solid                 |
| `child-svelte`  | 3005 | Svelte 4              |
| `child-ember`   | 3006 | Ember-style lifecycle |

### 호스트 앱 (모두 3000번 포트)

| 커맨드                 | 호스트                                |
| ---------------------- | ------------------------------------- |
| `pnpm example:vanilla` | Vanilla TS                            |
| `pnpm example:react`   | React + `horizon-mfe/react` hooks     |
| `pnpm example:vue`     | Vue 3 + `horizon-mfe/vue` composables |
| `pnpm example:solid`   | Solid                                 |
| `pnpm example:svelte`  | Svelte 4                              |
| `pnpm example:ember`   | Ember-style lifecycle                 |

```bash
# 의존성 설치
pnpm install

# 호스트 하나를 선택하고, 관련 서버를 모두 동시에 실행
pnpm example:vanilla   # 또는 :react / :vue / :solid / :svelte / :ember
```

이후 **http://localhost:3000** 에 접속하면 됩니다.

> **동작 방식:** 차일드 앱은 IIFE 번들(`vite build --watch`)로 빌드되어 `vite preview`로 서빙됩니다.  
> 호스트는 이 번들을 가져와 JS 샌드박스 안에서 실행하고, 현재 라우트에 따라 mount/unmount를 제어합니다.

### 수동 실행

```bash
# 터미널 1 — core 라이브러리 watch build
pnpm dev

# 터미널 2-7 — 차일드 앱
pnpm --filter child-vanilla dev
pnpm --filter child-react   dev
pnpm --filter child-vue     dev
pnpm --filter child-solid   dev
pnpm --filter child-svelte  dev
pnpm --filter child-ember   dev

# 터미널 8 — 호스트 (택 1)
pnpm --filter host-vanilla dev
pnpm --filter host-react   dev
pnpm --filter host-vue     dev
```

---

## 기여하기

버그 리포트, 기능 제안, PR 모두 환영합니다!

---

## 라이선스

MIT
