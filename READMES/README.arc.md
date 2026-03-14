# horizon-mfe(beta WIP)

**Version:** 0.0.1

[![npm version](https://img.shields.io/npm/v/horizon-mfe)](https://www.npmjs.com/package/horizon-mfe)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**لغات README** [EN [English]](https://github.com/racgoo/horizon) / [KR [한국어]](https://github.com/racgoo/horizon/blob/main/READMES/README.ko.md) / [中文 [简体]](https://github.com/racgoo/horizon/blob/main/READMES/README.zh.md) / [日本語](https://github.com/racgoo/horizon/blob/main/READMES/README.ja.md) / [Español](https://github.com/racgoo/horizon/blob/main/READMES/README.sp.md) / [Français](https://github.com/racgoo/horizon/blob/main/READMES/README.fr.md) / [हिन्दी](https://github.com/racgoo/horizon/blob/main/READMES/README.hi.md) / [Русский](https://github.com/racgoo/horizon/blob/main/READMES/README.ru.md) / [العربية](https://github.com/racgoo/horizon/blob/main/READMES/README.arc.md)

إطار عمل خفيف للواجهات الأمامية الصغيرة (micro-frontend).

- **بدون تبعيات** — ~8 kB مضغوط gzip
- **محولات أطر العمل** — React، Vue 3، Solid، Svelte 4، Ember / مخصص (`horizon-mfe/*`)
- **تحميل عبر مدخل HTML** — حدد عنوان URL، Horizon يجلب وينفذ كل شيء
- **حاوية JS** — عزل نافذة لكل تطبيق عبر Proxy (SnapshotSandbox للتصفحات القديمة)
- **عزل CSS** — نطاق `data-horizon-app` أو Shadow DOM
- **التفعيل حسب المسار** — بادئة مسار أو شرط مخصص
- **Keep-alive** — الحفاظ على حالة التطبيق عند تغيير المسار؛ إظهار/إخفاء دون إعادة التركيب
- **حالة مشتركة** — مزامنة حالة مُكتوبة بين التطبيقات عبر حافلة الأحداث المدمجة
- **TypeScript أولاً** — تعريفات أنواع كاملة

---

## التثبيت

```bash
pnpm add horizon-mfe
# أو
npm install horizon-mfe
```

---

## البداية السريعة

### واجهة مبسطة (`createHorizon`)

نقطة دخول باستدعاء واحد. يسجل التطبيقات ويشغل Horizon دفعة واحدة.

```ts
import { createHorizon } from "horizon-mfe";

createHorizon({
  container: "#app-container",
  keepAlive: true, // الحفاظ على الحالة عند تغيير المسار
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

### واجهة تقليدية (`registerApp` + `start`)

ما زالت مدعومة بالكامل — مفيدة عند الحاجة لتحكم دقيق.

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
    /* أعد false للإلغاء */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
});
```

### تطبيق فرعي (أي إطار عمل)

صدّر خطافات دورة الحياة عبر `window.__HORIZON_LIFECYCLE__`. يعمل مع كل إطار عمل.

```ts
// src/horizon.ts
window.__HORIZON_LIFECYCLE__ = {
  async bootstrap() {
    await loadConfig(); // يُستدعى مرة واحدة قبل أول تركيب
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
    /* DOM مخفي، الحالة محفوظة */
  },
  async onResume(props) {
    /* يُستدعى عند إعادة العرض */
  },
};
```

---

## محولات أطر العمل

كل محول يغلّف كود دورة الحياة بحيث **لا تستورد التطبيقات الفرعية Horizon مباشرة**. ثبّت المحول في التطبيق الفرعي.

### React (`horizon-mfe/react`)

```bash
pnpm add horizon-mfe react react-dom
```

**تطبيق فرعي:**

```tsx
// src/main.tsx
import { defineApp } from "horizon-mfe/react";
import App from "./App";

defineApp(App);
// أو مع خيارات:
defineApp(App, {
  onBootstrap: async () => await loadConfig(),
  onMount: (props) => {},
  onUnmount: () => {},
  onPause: (props) => {},
  onResume: (props) => {},
  mapProps: (props) => ({ ...props.props }), // تحويل props قبل تمريرها إلى الجذر
});
```

**تطبيق مضيف (React):**

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
      <span>العداد المشترك: {count}</span>
      <div id="app-container" />
    </>
  );
}
```

**حالة مشتركة (فرعي):**

```tsx
import { useSharedState } from "horizon-mfe/react";

function Counter() {
  const [count, setCount] = useSharedState<number>("count", 0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

**مزامنة المسارات (keep-alive + React Router):**

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

function RouterSync() {
  useRouteSync(useNavigate());
  return null;
}
// اعرض <RouterSync /> بجانب <Routes> داخل <BrowserRouter>
```

---

### Vue 3 (`horizon-mfe/vue`)

```bash
pnpm add horizon-mfe vue
```

**تطبيق فرعي:**

```ts
// src/main.ts
import { defineApp } from "horizon-mfe/vue";
import App from "./App.vue";
import router from "./router";

defineApp(App, {
  setup: (app, props) => app.use(router), // تثبيت الإضافات قبل التركيب
  onPause: (props) => {},
  onResume: (props) => {},
});
```

الوصول إلى props الخاصة بـ Horizon من أي مكوّن:

```vue
<script setup lang="ts">
import { inject } from "vue";
import { HorizonPropsKey } from "horizon-mfe/vue";

const horizonProps = inject(HorizonPropsKey);
horizonProps?.eventBus.emit("my:event", { data: 123 });
</script>
```

**حالة مشتركة (composable فرعي):**

```ts
import { useSharedState } from "horizon-mfe/vue";

const [count, setCount] = useSharedState<number>("count", 0);
// count هو Vue Ref<number> — استخدم count.value في السكربت أو {{ count }} في القالب
```

**تطبيق مضيف (Vue):**

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

**حالة مشتركة:**

```tsx
import { useSharedState } from "horizon-mfe/solid";

const [count, setCount] = useSharedState<number>("count", 0);
return <div>{count()}</div>; // count() — أداة الوصول لإشارة Solid
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

**حالة مشتركة (مخزن Svelte للكتابة):**

```svelte
<script>
  import { useSharedState } from 'horizon-mfe/svelte'
  const count = useSharedState('count', 0)
</script>
<button on:click={() => $count += 1}>{$count}</button>
```

**تطبيق مضيف (Svelte):**

```ts
import { useHorizonHost, useHostSharedState } from 'horizon-mfe/svelte'

const { pathname, navigate } = useHorizonHost({ ... })
const count = useHostSharedState('count', 0)
```

---

### Ember / مخصص (`horizon-mfe/ember`)

محول Ember يقبل كائناً بسيطاً لدورة الحياة — مفيد لـ Ember أو أي إطار يعالج العرض بنفسه.

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

## مرجع API

### `createHorizon(options)`

إعداد باستدعاء واحد.

| الحقل            | النوع                      | الوصف                                                   |
| ---------------- | -------------------------- | ------------------------------------------------------- |
| `apps`           | `CreateHorizonAppConfig[]` | تعريفات التطبيقات (`route` هو اسم بديل لـ `activeRule`) |
| `container`      | `string \| HTMLElement`    | الحاوية الافتراضية لجميع التطبيقات                      |
| `keepAlive`      | `boolean`                  | Keep-alive الافتراضي لجميع التطبيقات                    |
| `onMount`        | `(app) => Promise<void>`   | يُستدعى بعد تركيب كل تطبيق                              |
| `onUnmount`      | `(app) => Promise<void>`   | يُستدعى قبل إزالة تركيب كل تطبيق                        |
| `onPause`        | `(app) => Promise<void>`   | يُستدعى عند إخفاء تطبيق keep-alive                      |
| `onResume`       | `(app) => Promise<void>`   | يُستدعى عند إظهار تطبيق keep-alive                      |
| `onRouteChange`  | `() => void`               | يُستدعى عند كل تغيير في المسار                          |
| `exposeNavigate` | `boolean`                  | تصدير `window.navigateTo` globally (الافتراضي `true`)   |

---

### `registerApp(config | config[])`

تسجيل تطبيق واحد أو أكثر. يمكن الاستدعاء قبل أو بعد `start()`.

| الحقل        | النوع                                   | الوصف                                    |
| ------------ | --------------------------------------- | ---------------------------------------- |
| `name`       | `string`                                | معرف فريد                                |
| `entry`      | `string \| { scripts, styles?, html? }` | عنوان URL لمدخل HTML أو قائمة أصول صريحة |
| `container`  | `string \| HTMLElement`                 | محدد CSS أو عنصر للتركيب فيه             |
| `activeRule` | `string \| (location) => boolean`       | بادئة مسار أو شرط مخصص                   |
| `keepAlive`  | `boolean`                               | الحفاظ على الحالة عند تغيير المسار       |
| `props`      | `Record<string, unknown>`               | props إضافية لخطافات دورة الحياة         |

```ts
// مدخل HTML (موصى به)
registerApp({ entry: 'http://localhost:3001', ... })

// قائمة أصول صريحة — تخطي تحليل HTML
registerApp({ entry: { scripts: ['http://localhost:3001/app.iife.js'] }, ... })
```

---

### `start(config?)`

بدء مراقبة المسارات وتركيب التطبيقات المطابقة فوراً.

```ts
start({
  beforeMount: async (app) => {
    /* أعد false للإلغاء */
  },
  afterMount: async (app) => {},
  beforeUnmount: async (app) => {},
  afterUnmount: async (app) => {},
  onPause: async (app) => {},
  onResume: async (app) => {},
  onRouteChange: () => {},
  exposeNavigate: true, // تصدير window.navigateTo globally (الافتراضي true)
});
```

---

### `navigateTo(path)`

يضيف إدخالاً جديداً للسجل ويشغّل منطق إعادة التوجيه في Horizon.

```ts
import { navigateTo } from "horizon-mfe";
navigateTo("/dashboard");
```

يُصدَّر أيضاً على `window.navigateTo` و `window.navigate` افتراضياً.

---

### `getApp(name)`

الحصول على مثيل مسجّل لـ `App` لفحص الحالة أو التحكم اليدوي.

```ts
const app = getApp("dashboard");
console.log(app?.status);
// "NOT_LOADED" | "LOADING" | "NOT_BOOTSTRAPPED" | "BOOTSTRAPPING"
// | "NOT_MOUNTED" | "MOUNTING" | "MOUNTED" | "UNMOUNTING"
// | "PAUSING" | "PAUSED" | "RESUMING" | "LOAD_ERROR"
```

---

## حافلة الأحداث

اتصال مُكتوب بين التطبيقات وحالة مشتركة — بدون إعداد.

```ts
import { eventBus } from 'horizon-mfe'

// بث حدث لمرة واحدة
eventBus.emit('cart:updated', { count: 3 })

// الاشتراك (يعيد دالة إلغاء الاشتراك)
const off = eventBus.on('cart:updated', ({ count }) => updateBadge(count))

// الاستماع مرة واحدة
eventBus.once('user:logout', () => clearSession())

// حالة مشتركة — setState يبث "store:<key>" ويُخزّن القيمة
eventBus.setState('theme', 'dark')
eventBus.getState('theme')   // "dark"

// داخل تطبيق فرعي استخدم props.eventBus (نفس المفرد)
async mount({ eventBus }) {
  eventBus.on('theme:change', applyTheme)
}
```

المحولات تصدّر خطافات `useSharedState` / `useHostSharedState` التي تلفّ `setState` / `getState` تلقائياً.

---

## Keep-Alive

عند ضبط `keepAlive: true` على تطبيق، Horizon يخفّي الـ DOM عند تغيير المسار بدلاً من تدميره. الحالة والموقتات والاشتراكات تبقى عبر التنقل.

```ts
createHorizon({
  keepAlive: true, // ينطبق على جميع التطبيقات
  apps: [
    { name: "cart", entry: "...", route: "/cart", keepAlive: false },
    // ^ تجاوز لكل تطبيق
  ],
});
```

| الحدث         | عادي                             | Keep-Alive                    |
| ------------- | -------------------------------- | ----------------------------- |
| مغادرة المسار | استدعاء `unmount`، إزالة DOM     | استدعاء `onPause`، إخفاء DOM  |
| العودة للمسار | استدعاء `mount`، إعادة إنشاء DOM | استدعاء `onResume`، إظهار DOM |

### مزامنة المسار مع Keep-Alive

عندما يكون للتطبيق الفرعي مسيّر SPA خاص (React Router، Vue Router، إلخ)، قد تخرج حالة المسيّر الداخلية عن التزامن مع عنوان URL المضيف أثناء الإيقاف. مثال:

1. المستخدم ينتقل إلى `/cart/checkout` داخل تطبيق السلة الفرعي
2. المضيف ينتقل إلى `/dashboard` — السلة **متوقفة** (DOM مخفي، الحالة محفوظة)
3. المضيف يعود إلى `/cart` — السلة **تُستأنف**، لكن مسيّرها ما زال يشير إلى `/cart/checkout`

خطاف `onResume` يستقبل `props.pathname` (عنوان URL المضيف الحالي). مرّره إلى مسيّر إطار عملك لإعادة المزامنة.

#### React — `onResume` مع مسيّر البيانات (موصى به)

مع نمط `createBrowserRouter` + `RouterProvider`، مثيل المسيّر خارج شجرة React، لذا استدعِ `router.navigate` مباشرة في `onResume`:

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

#### React — `useRouteSync` مع `BrowserRouter` القديم

إذا كان التطبيق يستخدم `<BrowserRouter>`، استخدم `useRouteSync` داخل سياق المسيّر. يستمع لحدث `horizon:app:resume` المُرسَل عند الاستئناف:

```tsx
import { useRouteSync } from "horizon-mfe/react";
import { useNavigate } from "react-router-dom";

// اعرض هذا بجانب <Routes> داخل <BrowserRouter>
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

#### Vue Router — خيار `onResume`

`horizon-mfe/vue` يرسل أيضاً `horizon:app:resume`؛ أبسط طريقة هي خيار `onResume`:

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

#### Vanilla / أطر أخرى

استخدم خطاف `onResume` مباشرة مع التنقل الأمرِي لمسيّرك:

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

> **لماذا ليس تلقائياً؟** Horizon لا يوجّه مسيّري التطبيقات الفرعية تلقائياً عند الاستئناف — بعض التطبيقات تستخدم توجيهاً بالهاش أو مسارات نسبية أو بدون مسيّر. `onResume` يعطيك تحكماً صريحاً.

---

## عزل CSS

### سمة النطاق (الافتراضي)

Horizon يضيف `data-horizon-app="<name>"` لعنصر الحاوية. نهج **اتفاقي** — التطبيقات الفرعية يجب أن تسبق كل محددات CSS وفقاً ذلك. صحائف الأنماط ما زالت تُحقَن في `document.head`.

```css
/* CSS التطبيق الفرعي يُكتب هكذا */
[data-horizon-app="dashboard"] .header {
  color: red;
}
```

### Shadow DOM — العنصر المخصص `<horizon-app>`

لـ **تغليف CSS حقيقي** استخدم العنصر المخصص `<horizon-app>`. Horizon يرفق له Shadow DOM تلقائياً، فلا تتسرب أنماط الفرعي ولا تدخل أنماط المضيف.

```html
<!-- في HTML المضيف بدلاً من حاوية <div> عادية -->
<horizon-app name="cart"></horizon-app>
```

```ts
import { HorizonAppElement } from "horizon-mfe";
// يسجّل <horizon-app> عند الاستيراد
```

عند وجود عنصر `<horizon-app>` في الـ DOM، Horizon يركّب الفرعي داخل Shadow Root بدلاً من حاوية عادية. صحائف الأنماط تُحقَن في shadow root وهي محدودة بالكامل.

> **التوافق:** `attachShadow` مدعوم في المتصفحات الحديثة (Chrome 53+، Firefox 63+، Safari 10+، Edge 79+). إن تعذّر Shadow DOM ينتقل Horizon تلقائياً لوضع `scopeAttribute` ويسجّل تحذيراً.

> **تحذير:** Shadow DOM قد يكسر النوافذ المنبثقة أو البوابات التي تُعرض خارج الحاوية (مثلاً تلميحات تُحقَن في `document.body`).

---

## حاوية JS

كل تطبيق فرعي يحصل على وكيل `window` معزول. المتغيرات العامة التي يضبطها الفرعي تُخزَّن في Map لكل تطبيق ولا تُكتب أبداً في `window` الحقيقي، فلا تتسرب للمضيف أو التطبيقات الأخرى.

- **ProxySandbox** — يُستخدم تلقائياً في المتصفحات الحديثة
- **SnapshotSandbox** — احتياطي تلقائي للبيئات القديمة (لقطة/استعادة `window` الحقيقي عند إلغاء التفعيل)

**دورة الحياة:** الحاوية تُفعَّل عند تحميل التطبيق (السكربتات تُنفَّذ في سياق الحاوية)، تبقى نشطة خلال mount/pause/resume، وتُمسح بالكامل عند unmount.

### ضمانات العزل

| نوع السكربت                    | العزل                                                                                              |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| حزمة IIFE / UMD                | ✅ معزول بالكامل — `window` الحقيقي لا يُعدَّل أبداً                                               |
| سكربتات مضمنة                  | ✅ معزول بالكامل                                                                                   |
| `<script type="module">` (ESM) | ⚠️ **غير محاط** — المتصفحات تنفّذ وحدات ES في النطاق العام الحقيقي. استخدم حزم IIFE/UMD لعزل كامل. |

---

## قيود معروفة

### وحدات ES غير محاطة

التطبيقات الفرعية المُبناة كوحدات ES (`<script type="module">`) تُنفَّذ في النطاق العام الحقيقي — قيد على مستوى المتصفح. استخدم صيغة إخراج **IIFE أو UMD** في إعداد بناء التطبيق الفرعي لعزل JS كامل.

```ts
// vite.config.ts (تطبيق فرعي)
build: {
  lib: {
    formats: ["iife"],
  },
}
```

### سياسة أمان المحتوى (CSP)

Horizon ينفّذ سكربتات IIFE/UMD عبر `new Function()`، مما يتطلب `unsafe-eval` في الـ CSP:

```
Content-Security-Policy: script-src 'self' 'unsafe-eval';
```

إن فرض النشر CSP صارمة بدون `unsafe-eval`، استخدم صيغة مدخل قائمة أصول صريحة (`entry: { scripts: [...] }`) مع CDN/خدمة تقدم حزم موثوقة، أو إعادة النظر في نهج الحاوية لتهديدك.

### تلويث النطاق العام

افتراضياً يُصدَّر `window.navigate` و `window.navigateTo`. عطّل ذلك إن تعارض مع عموميات موجودة:

```ts
createHorizon({ ..., exposeNavigate: false })
// أو
start({ exposeNavigate: false })
```

---

## دورة حياة التطبيق الفرعي

```
NOT_LOADED
   │ load()          جلب HTML / السكربتات، التنفيذ في الحاوية
NOT_BOOTSTRAPPED
   │ bootstrap()     إعداد لمرة واحدة (يُستدعى مرة لكل جلسة)
NOT_MOUNTED
   │ mount()   ←──────────────────────────────────┐
MOUNTED                                            │
   │ unmount() ──────────────────────────────────→ NOT_MOUNTED
   │
   │ (فقط keepAlive)
   │ onPause()  ─────────────────────────────────→ PAUSED
   │ onResume() ─────────────────────────────────→ MOUNTED
```

---

## تشغيل الأمثلة

الريبو يتضمن أمثلة قابلة للتشغيل لكل إطار مضيف مدعوم، كلها تشارك نفس التطبيقات الفرعية الستة.

### التطبيقات الفرعية (المنافذ ثابتة في كل الأمثلة)

| الحزمة          | المنفذ | المكدس                 |
| --------------- | ------ | ---------------------- |
| `child-vanilla` | 3001   | Vanilla TS             |
| `child-react`   | 3002   | React 18               |
| `child-vue`     | 3003   | Vue 3                  |
| `child-solid`   | 3004   | Solid                  |
| `child-svelte`  | 3005   | Svelte 4               |
| `child-ember`   | 3006   | دورة حياة بأسلوب Ember |

### التطبيقات المضيفة (كلها على المنفذ 3000)

| الأمر                  | المضيف                                |
| ---------------------- | ------------------------------------- |
| `pnpm example:vanilla` | Vanilla TS                            |
| `pnpm example:react`   | React + خطافات `horizon-mfe/react`    |
| `pnpm example:vue`     | Vue 3 + composables `horizon-mfe/vue` |
| `pnpm example:solid`   | Solid                                 |
| `pnpm example:svelte`  | Svelte 4                              |
| `pnpm example:ember`   | دورة حياة بأسلوب Ember                |

```bash
# تثبيت كل شيء
pnpm install

# اختر مضيفاً وشغّل كل الخوادم
pnpm example:vanilla   # أو :react / :vue / :solid / :svelte / :ember
```

ثم افتح **http://localhost:3000**.

> **كيف يعمل:** التطبيقات الفرعية تُبنى كحزم IIFE (`vite build --watch`) وتُقدَّم عبر `vite preview`. المضيف يجلب هذه الحزم، ينفّذها داخل حاوية JS، ويركّب/يزيل التركيب حسب المسار الحالي.

### تشغيل يدوي

```bash
# الطرفية 1 — بناء النواة في وضع المراقبة
pnpm dev

# الطرفيات 2–7 — التطبيقات الفرعية
pnpm --filter child-vanilla dev
pnpm --filter child-react   dev
pnpm --filter child-vue     dev
pnpm --filter child-solid   dev
pnpm --filter child-svelte  dev
pnpm --filter child-ember   dev

# الطرفية 8 — المضيف (واحد من الخيارات)
pnpm --filter host-vanilla dev
pnpm --filter host-react   dev
pnpm --filter host-vue     dev
```

---

## المساهمة

المساهمات مرحّب بها. يمكن فتح issues للأخطاء أو طلبات الميزات، وطلبات السحب مقبولة دائماً.

---

## الترخيص

MIT
