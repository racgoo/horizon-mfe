<script setup lang="ts">
import { computed } from "vue";
import { useHorizonHost, useHostSharedState } from "horizon-mfe/vue";
import "./style.css";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/vanilla", label: "Vanilla" },
  { href: "/react", label: "React" },
  { href: "/vue", label: "Vue" },
  { href: "/solid", label: "Solid" },
  { href: "/svelte", label: "Svelte" },
  { href: "/ember", label: "Ember" },
];

const { pathname, navigate } = useHorizonHost({
  container: "#app-container",
  keepAlive: true,
  apps: [
    {
      name: "child-vanilla",
      entry: {
        scripts: ["http://localhost:3001/child-vanilla.iife.js"],
        styles: ["http://localhost:3001/style.css"],
      },
      route: "/vanilla",
    },
    { name: "child-react", entry: "http://localhost:3002", route: "/react" },
    { name: "child-vue", entry: "http://localhost:3003", route: "/vue" },
    { name: "child-solid", entry: "http://localhost:3004", route: "/solid" },
    { name: "child-svelte", entry: "http://localhost:3005", route: "/svelte" },
    { name: "child-ember", entry: "http://localhost:3006", route: "/ember" },
  ],
});

const [count] = useHostSharedState<number>("count", 0);
const showHome = computed(() => pathname.value === "/");

function isActive(href: string): boolean {
  if (href === "/") return pathname.value === "/";
  return pathname.value.startsWith(href);
}

function handleNav(e: Event, href: string) {
  e.preventDefault();
  navigate(href);
}
</script>

<template>
  <header class="host-header">
    <span class="logo">Horizon · Vue Host</span>
    <nav>
      <a
        v-for="link in NAV_LINKS"
        :key="link.href"
        :href="link.href"
        :class="{ active: isActive(link.href) }"
        @click="(e) => handleNav(e, link.href)"
      >
        {{ link.label }}
      </a>
    </nav>
    <div class="event-log">
      <span class="event-log-label">event bus</span>
      <span class="event-log-value">{{ count }}</span>
    </div>
  </header>

  <main>
    <div v-if="showHome" class="home">
      <h1>Horizon Micro-Frontend Demo</h1>
      <p>
        One host app orchestrating six child apps — Vanilla TS, React, Vue 3,
        Solid, Svelte, and Ember. Each runs in an isolated JS sandbox. Child
        apps have
        <strong>zero knowledge</strong> of Horizon.
      </p>
      <div class="cards">
        <button
          type="button"
          class="card card-vanilla"
          @click="navigate('/vanilla')"
        >
          <h2>Vanilla TS →</h2>
          <p>
            Pure DOM. Low-level <code>window.__HORIZON_LIFECYCLE__</code> API.
          </p>
        </button>
        <button
          type="button"
          class="card card-react"
          @click="navigate('/react')"
        >
          <h2>React 18 →</h2>
          <p>
            Uses <code>horizon-mfe/react</code> — just
            <code>defineApp(App)</code>.
          </p>
        </button>
        <button type="button" class="card card-vue" @click="navigate('/vue')">
          <h2>Vue 3 →</h2>
          <p>
            Uses <code>horizon-mfe/vue</code> — just
            <code>defineApp(App)</code>.
          </p>
        </button>
        <button
          type="button"
          class="card card-solid"
          @click="navigate('/solid')"
        >
          <h2>Solid →</h2>
          <p>
            Uses <code>horizon-mfe/solid</code> — just
            <code>defineApp(App)</code>.
          </p>
        </button>
        <button
          type="button"
          class="card card-svelte"
          @click="navigate('/svelte')"
        >
          <h2>Svelte →</h2>
          <p>
            Uses <code>horizon-mfe/svelte</code> — just
            <code>defineApp(App)</code>.
          </p>
        </button>
        <button
          type="button"
          class="card card-ember"
          @click="navigate('/ember')"
        >
          <h2>Ember →</h2>
          <p>Uses <code>horizon-mfe/ember</code> lifecycle.</p>
        </button>
      </div>
    </div>

    <div
      id="app-container"
      :class="['app-container', { 'app-container--hidden': showHome }]"
    />
  </main>
</template>
