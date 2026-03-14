import { defineApp } from "horizon-mfe/vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import Content from "./Content.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/vue", component: Content },
    { path: "/vanilla", component: { template: "<div />" } },
    { path: "/react", component: { template: "<div />" } },
  ],
});

defineApp(App, {
  setup(app) {
    app.use(router);
  },
  onResume({ pathname }) {
    router.replace(pathname);
  },
});
