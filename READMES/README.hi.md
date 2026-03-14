# horizon-mfe(beta WIP)

**Version:** 0.0.1

[![npm version](https://img.shields.io/npm/v/horizon-mfe)](https://www.npmjs.com/package/horizon-mfe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**README भाषाएँ** [EN [English]](https://github.com/racgoo/horizon) / [KR [한국어]](https://github.com/racgoo/horizon/blob/main/READMES/README.ko.md) / [中文 [简体]](https://github.com/racgoo/horizon/blob/main/READMES/README.zh.md) / [日本語](https://github.com/racgoo/horizon/blob/main/READMES/README.ja.md) / [Español](https://github.com/racgoo/horizon/blob/main/READMES/README.sp.md) / [Français](https://github.com/racgoo/horizon/blob/main/READMES/README.fr.md) / [हिन्दी](https://github.com/racgoo/horizon/blob/main/READMES/README.hi.md) / [Русский](https://github.com/racgoo/horizon/blob/main/READMES/README.ru.md) / [العربية](https://github.com/racgoo/horizon/blob/main/READMES/README.arc.md)

हल्का माइक्रो-फ्रंटएंड फ्रेमवर्क।

- **शून्य निर्भरता** — gzip में लगभग 8 kB
- **फ्रेमवर्क एडाप्टर** — React, Vue 3, Solid, Svelte 4, Ember / कस्टम (`horizon-mfe/*`)
- **HTML एंट्री लोडिंग** — URL दें, Horizon सब कुछ फ़ेच और एक्ज़िक्यूट करता है
- **JS सैंडबॉक्स** — ऐप के हिसाब से Proxy आधारित window आइसोलेशन (पुराने ब्राउज़र के लिए SnapshotSandbox फॉलबैक)
- **CSS आइसोलेशन** — `data-horizon-app` स्कोपिंग या Shadow DOM
- **रूट-आधारित एक्टिवेशन** — पाथ प्रीफिक्स या कस्टम प्रिडिकेट
- **Keep-alive** — रूट बदलने पर ऐप स्टेट बनाए रखें; री-माउंट बिना दिखाएं/छुपाएं
- **शेयर्ड स्टेट** — बिल्ट-इन इवेंट बस से टाइप्ड क्रॉस-ऐप स्टेट सिंक
- **TypeScript-first** — पूरी टाइप डेफिनिशन शामिल

---

## इंस्टॉलेशन

```bash
pnpm add horizon-mfe
# या
npm install horizon-mfe
```

---

## त्वरित शुरुआत

### सरल API (`createHorizon`)

सिंगल-कॉल एंट्री पॉइंट। एक बार में ऐप्स रजिस्टर करता है और Horizon शुरू करता है।

```ts
import { createHorizon } from "horizon-mfe";

createHorizon({
  container: "#app-container",
  keepAlive: true, // रूट बदलने पर स्टेट बनाए रखें
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

### क्लासिक API (`registerApp` + `start`)

पूरी तरह सपोर्टेड — जब बारीक नियंत्रण चाहिए तब काम आता है।

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
    /* कैंसल करने के लिए false लौटाएं */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
});
```

### चाइल्ड ऐप (कोई भी फ्रेमवर्क)

`window.__HORIZON_LIFECYCLE__` के ज़रिए लाइफसाइकल हुक एक्सपोर्ट करें। हर फ्रेमवर्क के साथ काम करता है।

```ts
// src/horizon.ts
window.__HORIZON_LIFECYCLE__ = {
  async bootstrap() {
    await loadConfig(); // पहले माउंट से पहले एक बार बुलाया जाता है
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
    /* DOM छिपा, स्टेट बचा रहता है */
  },
  async onResume(props) {
    /* दोबारा दिखाने पर बुलाया जाता है */
  },
};
```

---

## फ्रेमवर्क एडाप्टर

हर एडाप्टर लाइफसाइकल बॉयलरप्लेट रैप करता है ताकि **चाइल्ड ऐप्स में Horizon का कोई डायरेक्ट इम्पोर्ट न हो**। चाइल्ड ऐप के साथ एडाप्टर इंस्टॉल करें।

### React (`horizon-mfe/react`)

```bash
pnpm add horizon-mfe react react-dom
```

**चाइल्ड ऐप:**

```tsx
// src/main.tsx
import { defineApp } from "horizon-mfe/react";
import App from "./App";

defineApp(App);
// या ऑप्शन के साथ:
defineApp(App, {
  onBootstrap: async () => await loadConfig(),
  onMount: (props) => {},
  onUnmount: () => {},
  onPause: (props) => {},
  onResume: (props) => {},
  mapProps: (props) => ({ ...props.props }), // root को देने से पहले Horizon props ट्रांसफॉर्म करें
});
```

**होस्ट ऐप (React):**

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
      <span>शेयर्ड काउंट: {count}</span>
      <div id="app-container" />
    </>
  );
}
```

**शेयर्ड स्टेट (चाइल्ड):**

```tsx
import { useSharedState } from "horizon-mfe/react";

function Counter() {
  const [count, setCount] = useSharedState<number>("count", 0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**राउटर सिंक (keep-alive + React Router):**

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

function RouterSync() {
  useRouteSync(useNavigate());
  return null;
}
// <BrowserRouter> के अंदर <Routes> के साथ <RouterSync /> रेंडर करें
```

---

### Vue 3 (`horizon-mfe/vue`)

```bash
pnpm add horizon-mfe vue
```

**चाइल्ड ऐप:**

```ts
// src/main.ts
import { defineApp } from "horizon-mfe/vue";
import App from "./App.vue";
import router from "./router";

defineApp(App, {
  setup: (app, props) => app.use(router), // माउंट से पहले प्लगइन इंस्टॉल करें
  onPause: (props) => {},
  onResume: (props) => {},
});
```

किसी भी कंपोनेंट में Horizon props एक्सेस करें:

```vue
<script setup lang="ts">
import { inject } from "vue";
import { HorizonPropsKey } from "horizon-mfe/vue";

const horizonProps = inject(HorizonPropsKey);
horizonProps?.eventBus.emit("my:event", { data: 123 });
</script>
```

**शेयर्ड स्टेट (चाइल्ड composable):**

```ts
import { useSharedState } from "horizon-mfe/vue";

const [count, setCount] = useSharedState<number>("count", 0);
// count एक Vue Ref<number> है — स्क्रिप्ट में count.value, टेम्पलेट में {{ count }}
```

**होस्ट ऐप (Vue):**

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

**शेयर्ड स्टेट:**

```tsx
import { useSharedState } from "horizon-mfe/solid";

const [count, setCount] = useSharedState<number>("count", 0);
return <div>{count()}</div>; // count() — Solid सिग्नल एक्सेसर
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

**शेयर्ड स्टेट (Svelte writable store):**

```svelte
<script>
  import { useSharedState } from 'horizon-mfe/svelte'
  const count = useSharedState('count', 0)
</script>
<button on:click={() => $count += 1}>{$count}</button>
```

**होस्ट ऐप (Svelte):**

```ts
import { useHorizonHost, useHostSharedState } from 'horizon-mfe/svelte'

const { pathname, navigate } = useHorizonHost({ ... })
const count = useHostSharedState('count', 0)
```

---

### Ember / कस्टम (`horizon-mfe/ember`)

Ember एडाप्टर एक सादा लाइफसाइकल ऑब्जेक्ट लेता है — Ember या ऐसे फ्रेमवर्क के लिए जो अपना रेंडर खुद मैनेज करते हैं।

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

## API रेफरेंस

### `createHorizon(options)`

सिंगल-कॉल सेटअप।

| फ़ील्ड           | टाइप                       | विवरण                                                         |
| ---------------- | -------------------------- | ------------------------------------------------------------- |
| `apps`           | `CreateHorizonAppConfig[]` | ऐप डेफिनिशन (`route` यहाँ `activeRule` का अलियास है)          |
| `container`      | `string \| HTMLElement`    | सभी ऐप्स के लिए डिफॉल्ट कंटेनर                                |
| `keepAlive`      | `boolean`                  | सभी ऐप्स के लिए डिफॉल्ट keep-alive                            |
| `onMount`        | `(app) => Promise<void>`   | हर ऐप माउंट होने के बाद बुलाया जाता है                        |
| `onUnmount`      | `(app) => Promise<void>`   | हर ऐप अनमाउंट से पहले बुलाया जाता है                          |
| `onPause`        | `(app) => Promise<void>`   | keep-alive ऐप छिपने पर बुलाया जाता है                         |
| `onResume`       | `(app) => Promise<void>`   | keep-alive ऐप दिखने पर बुलाया जाता है                         |
| `onRouteChange`  | `() => void`               | हर रूट बदलने पर बुलाया जाता है                                |
| `exposeNavigate` | `boolean`                  | ग्लोबल में `window.navigateTo` एक्सपोज़ करें (डिफॉल्ट `true`) |

---

### `registerApp(config | config[])`

एक या ज़्यादा ऐप रजिस्टर करें। `start()` से पहले या बाद में बुलाया जा सकता है।

| फ़ील्ड       | टाइप                                    | विवरण                                           |
| ------------ | --------------------------------------- | ----------------------------------------------- |
| `name`       | `string`                                | यूनीक आइडेंटिफायर                               |
| `entry`      | `string \| { scripts, styles?, html? }` | HTML एंट्री URL या एक्सप्लिसिट ऐसेट लिस्ट       |
| `container`  | `string \| HTMLElement`                 | माउंट करने के लिए CSS सेलेक्टर या एलिमेंट       |
| `activeRule` | `string \| (location) => boolean`       | पाथ प्रीफिक्स या कस्टम प्रिडिकेट                |
| `keepAlive`  | `boolean`                               | रूट बदलने पर स्टेट बनाए रखें                    |
| `props`      | `Record<string, unknown>`               | लाइफसाइकल हुक को भेजे जाने वाले एक्स्ट्रा props |

```ts
// HTML एंट्री (रिकमेंडेड)
registerApp({ entry: 'http://localhost:3001', ... })

// एक्सप्लिसिट ऐसेट लिस्ट — HTML पार्सिंग स्किप
registerApp({ entry: { scripts: ['http://localhost:3001/app.iife.js'] }, ... })
```

---

### `start(config?)`

रूट वॉचिंग शुरू करें और मैचिंग ऐप्स तुरंत माउंट करें।

```ts
start({
  beforeMount: async (app) => {
    /* कैंसल के लिए false लौटाएं */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
  onPause: async (app) => {},
  onResume: async (app) => {},
  onRouteChange: () => {},
  exposeNavigate: true, // ग्लोबल में window.navigateTo एक्सपोज़ (डिफॉल्ट true)
});
```

---

### `navigateTo(path)`

नया हिस्ट्री एंट्री पुश करता है और Horizon की री-रूट लॉजिक चलाता है।

```ts
import { navigateTo } from "horizon-mfe";
navigateTo("/dashboard");
```

डिफॉल्ट में `window.navigateTo` और `window.navigate` पर भी एक्सपोज़ होता है।

---

### `getApp(name)`

स्टेटस चेक या मैनुअल कंट्रोल के लिए रजिस्टर्ड `App` इंस्टेंस पाएं।

```ts
const app = getApp("dashboard");
console.log(app?.status);
// "NOT_LOADED" | "LOADING" | "NOT_BOOTSTRAPPED" | "BOOTSTRAPPING"
// | "NOT_MOUNTED" | "MOUNTING" | "MOUNTED" | "UNMOUNTING"
// | "PAUSING" | "PAUSED" | "RESUMING" | "LOAD_ERROR"
```

---

## इवेंट बस

टाइप्ड क्रॉस-ऐप कम्युनिकेशन और शेयर्ड स्टेट — ज़ीरो कॉन्फिग।

```ts
import { eventBus } from 'horizon-mfe'

// एक बार का इवेंट एमिट करें
eventBus.emit('cart:updated', { count: 3 })

// सब्सक्राइब करें (अनसब्सक्राइब फंक्शन लौटाता है)
const off = eventBus.on('cart:updated', ({ count }) => updateBadge(count))

// एक बार सुनें
eventBus.once('user:logout', () => clearSession())

// शेयर्ड स्टेट — setState "store:<key>" ब्रॉडकास्ट करता है और वैल्यू पर्सिस्ट करता है
eventBus.setState('theme', 'dark')
eventBus.getState('theme')   // "dark"

// चाइल्ड ऐप के अंदर props.eventBus इस्तेमाल करें (वही सिंगलटन)
async mount({ eventBus }) {
  eventBus.on('theme:change', applyTheme)
}
```

फ्रेमवर्क एडाप्टर `useSharedState` / `useHostSharedState` हुक एक्सपोज़ करते हैं जो `setState` / `getState` को ऑटो रैप करते हैं।

---

## Keep-Alive

जब किसी ऐप पर `keepAlive: true` सेट होता है, रूट बदलने पर Horizon DOM को डिस्ट्रॉय नहीं करता बल्कि छिपाता है। स्टेट, टाइमर और सब्सक्रिप्शन नेविगेशन के बाद भी रहते हैं।

```ts
createHorizon({
  keepAlive: true, // सभी ऐप्स पर लागू
  apps: [
    { name: "cart", entry: "...", route: "/cart", keepAlive: false },
    // ^ ऐप के हिसाब से ओवरराइड
  ],
});
```

| इवेंट      | नॉर्मल                         | Keep-Alive                    |
| ---------- | ------------------------------ | ----------------------------- |
| रूट छोड़ें | `unmount` बुलाया, DOM हटाया    | `onPause` बुलाया, DOM छिपाया  |
| रूट वापस   | `mount` बुलाया, DOM दोबारा बना | `onResume` बुलाया, DOM दिखाया |

### Keep-Alive के साथ रूट सिंक

जब चाइल्ड ऐप का अपना SPA राउटर हो (React Router, Vue Router आदि), ऐप पॉज़ होने पर उस राउटर का इंटरनल स्टेट होस्ट URL से आउट ऑफ सिंक हो सकता है। उदाहरण:

1. यूज़र कार्ट चाइल्ड ऐप में `/cart/checkout` पर जाता है
2. होस्ट `/dashboard` पर जाता है — कार्ट **पॉज़** (DOM छिपा, स्टेट बचा)
3. होस्ट वापस `/cart` पर आता है — कार्ट **रिज़्यूम**, लेकिन उसका राउटर अभी भी `/cart/checkout` पर है

`onResume` लाइफसाइकल हुक को `props.pathname` (करंट होस्ट URL) मिलता है। री-सिंक के लिए इसे अपने फ्रेमवर्क के राउटर को दें।

#### React — डेटा राउटर के साथ `onResume` (रिकमेंडेड)

`createBrowserRouter` + `RouterProvider` पैटर्न में राउटर इंस्टेंस React ट्री के बाहर होता है, इसलिए `onResume` में सीधे `router.navigate` बुलाएं:

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

#### React — लेगेसी `BrowserRouter` के साथ `useRouteSync`

अगर ऐप `<BrowserRouter>` इस्तेमाल करता है, राउटर कॉन्टेक्स्ट के अंदर `useRouteSync` इस्तेमाल करें। यह रिज़्यूम पर डिस्पैच होने वाले `horizon:app:resume` कस्टम इवेंट को सुनता है:

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

// इसे <BrowserRouter> के अंदर <Routes> के साथ रेंडर करें
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

#### Vue Router — `onResume` ऑप्शन

`horizon-mfe/vue` भी `horizon:app:resume` डिस्पैच करता है, लेकिन सबसे आसान तरीका `onResume` ऑप्शन है:

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

#### Vanilla / दूसरे फ्रेमवर्क

अपने राउटर की इम्पेरेटिव नेविगेट के साथ सीधे `onResume` लाइफसाइकल हुक इस्तेमाल करें:

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

> **यह ऑटो क्यों नहीं?** Horizon रिज़्यूम पर चाइल्ड राउटर को खुद नेविगेट नहीं करता — कुछ ऐप्स hash रूटिंग, रिलेटिव पाथ या बिना राउटर के होते हैं। `onResume` से आपको एक्सप्लिसिट कंट्रोल मिलता है।

---

## CSS आइसोलेशन

### स्कोप एट्रिब्यूट (डिफॉल्ट)

Horizon कंटेनर एलिमेंट पर `data-horizon-app="<name>"` जोड़ता है। यह **कन्वेंशन-आधारित** तरीका है — स्कोपिंग के लिए चाइल्ड ऐप्स को अपने सभी CSS सेलेक्टर इसी के अनुसार प्रीफिक्स करने होंगे। स्टाइलशीट अभी भी `document.head` में इंजेक्ट होती हैं।

```css
/* चाइल्ड ऐप CSS ऐसे लिखें */
[data-horizon-app="dashboard"] .header {
  color: red;
}
```

### Shadow DOM — `<horizon-app>` कस्टम एलिमेंट

**सच्ची CSS एनकैप्सुलेशन** के लिए `<horizon-app>` कस्टम एलिमेंट इस्तेमाल करें। Horizon इसमें ऑटो Shadow DOM अटैच करता है, तो चाइल्ड स्टाइल बाहर नहीं लीक होतीं और होस्ट स्टाइल अंदर नहीं आतीं।

```html
<!-- होस्ट HTML में, सादे <div> कंटेनर की जगह -->
<horizon-app name="cart"></horizon-app>
```

```ts
import { HorizonAppElement } from "horizon-mfe";
// इम्पोर्ट पर <horizon-app> ऑटो-रजिस्टर
```

जब DOM में `<horizon-app>` एलिमेंट होता है, Horizon चाइल्ड को सादे कंटेनर की जगह उसके Shadow Root के अंदर माउंट करता है। स्टाइलशीट shadow root में इंजेक्ट होती हैं और पूरी तरह स्कोप्ड होती हैं।

> **ब्राउज़र कंपैट:** `attachShadow` सभी मॉडर्न ब्राउज़र में सपोर्टेड (Chrome 53+, Firefox 63+, Safari 10+, Edge 79+)। अगर Shadow DOM नहीं मिलता तो Horizon ऑटो `scopeAttribute` मोड पर फॉलबैक करता है और वॉर्निंग लॉग करता है।

> **ध्यान:** Shadow DOM उन ग्लोबल मोडल/पोर्टल को तोड़ सकता है जो कंटेनर के बाहर रेंडर होते हैं (जैसे कुछ UI लाइब्रेरी tooltip `document.body` में इंजेक्ट करती हैं)।

---

## JS सैंडबॉक्स

हर चाइल्ड ऐप को अपना अलग `window` प्रॉक्सी मिलता है। चाइल्ड द्वारा सेट किए गए ग्लोबल्स ऐप के हिसाब से Map में स्टोर होते हैं और रियल `window` पर कभी नहीं लिखे जाते, इसलिए होस्ट या दूसरी ऐप्स तक लीक नहीं हो सकते।

- **ProxySandbox** — सभी मॉडर्न ब्राउज़र में ऑटो इस्तेमाल
- **SnapshotSandbox** — पुराने एनवायरनमेंट के लिए ऑटो फॉलबैक (डिएक्टिवेट पर रियल `window` स्नैपशॉट/रिस्टोर)

**लाइफसाइकल:** ऐप लोड होने पर सैंडबॉक्स एक्टिवेट (स्क्रिप्ट सैंडबॉक्स कॉन्टेक्स्ट में चलती हैं), mount/pause/resume तक एक्टिव रहता है, और unmount पर पूरी तरह क्लियर हो जाता है।

### आइसोलेशन गारंटी

| स्क्रिप्ट टाइप                 | आइसोलेशन                                                                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| IIFE / UMD बंडल                | ✅ पूरी तरह आइसोलेटेड — रियल `window` कभी बदला नहीं जाता                                                                        |
| इनलाइन स्क्रिप्ट               | ✅ पूरी तरह आइसोलेटेड                                                                                                           |
| `<script type="module">` (ESM) | ⚠️ **सैंडबॉक्स नहीं** — ब्राउज़र ES मॉड्यूल रियल ग्लोबल स्कोप में चलाते हैं। पूरे आइसोलेशन के लिए IIFE/UMD बिल्ड इस्तेमाल करें। |

---

## ज्ञात सीमाएँ

### ES मॉड्यूल सैंडबॉक्स नहीं हैं

ES मॉड्यूल (`<script type="module">`) के रूप में बनाए गए चाइल्ड ऐप रियल ग्लोबल स्कोप में चलते हैं — यह ब्राउज़र लेवल की बाधा है। पूरे JS आइसोलेशन के लिए चाइल्ड ऐप बिल्ड कॉन्फिग में **IIFE या UMD** आउटपुट फॉर्मैट इस्तेमाल करें।

```ts
// vite.config.ts (चाइल्ड ऐप)
build: {
  lib: {
    formats: ["iife"],
  },
}
```

### Content Security Policy

Horizon IIFE/UMD स्क्रिप्ट `new Function()` से चलाता है, इसलिए CSP में `unsafe-eval` चाहिए:

```
Content-Security-Policy: script-src 'self' 'unsafe-eval';
```

अगर डिप्लॉयमेंट सख्त CSP लागू करता है जो `unsafe-eval` नहीं देता, तो एक्सप्लिसिट ऐसेट लिस्ट एंट्री फॉर्मैट (`entry: { scripts: [...] }`) और विश्वसनीय बंडल सर्व करने वाला CDN/सर्विस इस्तेमाल करें, या अपने थ्रेट मॉडल के लिए सैंडबॉक्स अप्रोच दोबारा सोचें।

### ग्लोबल नेमस्पेस पॉल्यूशन

डिफॉल्ट में `window.navigate` और `window.navigateTo` एक्सपोज़ होते हैं। मौजूदा ग्लोबल से टकराव हो तो बंद करें:

```ts
createHorizon({ ..., exposeNavigate: false })
// या
start({ exposeNavigate: false })
```

---

## चाइल्ड ऐप लाइफसाइकल

```
NOT_LOADED
   │ load()          HTML / स्क्रिप्ट फ़ेच करें, सैंडबॉक्स में एक्ज़िक्यूट करें
NOT_BOOTSTRAPPED
   │ bootstrap()     एक बार का सेटअप (सेशन में एक बार बुलाया जाता है)
NOT_MOUNTED
   │ mount()   ←──────────────────────────────────┐
MOUNTED                                            │
   │ unmount() ──────────────────────────────────→ NOT_MOUNTED
   │
   │ (केवल keepAlive)
   │ onPause()  ─────────────────────────────────→ PAUSED
   │ onResume() ─────────────────────────────────→ MOUNTED
```

---

## उदाहरण चलाना

रिपो में हर सपोर्टेड होस्ट फ्रेमवर्क के लिए चलने वाले उदाहरण हैं, सभी वही छह चाइल्ड ऐप शेयर करते हैं।

### चाइल्ड ऐप (सभी उदाहरणों में पोर्ट फिक्स)

| पैकेज           | पोर्ट | स्टैक                  |
| --------------- | ----- | ---------------------- |
| `child-vanilla` | 3001  | Vanilla TS             |
| `child-react`   | 3002  | React 18               |
| `child-vue`     | 3003  | Vue 3                  |
| `child-solid`   | 3004  | Solid                  |
| `child-svelte`  | 3005  | Svelte 4               |
| `child-ember`   | 3006  | Ember-स्टाइल लाइफसाइकल |

### होस्ट ऐप (सभी पोर्ट 3000 पर)

| कमांड                  | होस्ट                                 |
| ---------------------- | ------------------------------------- |
| `pnpm example:vanilla` | Vanilla TS                            |
| `pnpm example:react`   | React + `horizon-mfe/react` हुक       |
| `pnpm example:vue`     | Vue 3 + `horizon-mfe/vue` composables |
| `pnpm example:solid`   | Solid                                 |
| `pnpm example:svelte`  | Svelte 4                              |
| `pnpm example:ember`   | Ember-स्टाइल लाइफसाइकल                |

```bash
# सब इंस्टॉल करें
pnpm install

# होस्ट चुनें और सभी सर्वर शुरू करें
pnpm example:vanilla   # या :react / :vue / :solid / :svelte / :ember
```

फिर **http://localhost:3000** खोलें।

> **कैसे काम करता है:** चाइल्ड ऐप IIFE बंडल (`vite build --watch`) के रूप में बनते हैं और `vite preview` से सर्व होते हैं। होस्ट ये बंडल फ़ेच करता है, JS सैंडबॉक्स में एक्ज़िक्यूट करता है, और करंट रूट के हिसाब से माउंट/अनमाउंट करता है।

### मैनुअल स्टार्ट

```bash
# टर्मिनल 1 — कोर लाइब्रेरी वॉच बिल्ड
pnpm dev

# टर्मिनल 2-7 — चाइल्ड ऐप
pnpm --filter child-vanilla dev
pnpm --filter child-react   dev
pnpm --filter child-vue     dev
pnpm --filter child-solid   dev
pnpm --filter child-svelte  dev
pnpm --filter child-ember   dev

# टर्मिनल 8 — होस्ट (एक चुनें)
pnpm --filter host-vanilla dev
pnpm --filter host-react   dev
pnpm --filter host-vue     dev
```

---

## योगदान

योगदान का स्वागत है। बग रिपोर्ट या फीचर रिक्वेस्ट के लिए issue खोलें, और pull request हमेशा अच्छी लगती हैं।

---

## लाइसेंस

MIT
