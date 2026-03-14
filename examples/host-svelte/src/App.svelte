<script lang="ts">
  import { onMount } from "svelte";
  import { createHorizon, eventBus, navigateTo } from "horizon-mfe";
  import "./style.css";

  let pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  let countText = "—";

  onMount(() => {
    createHorizon({
      container: "#app-container",
      keepAlive: true,
      onRouteChange: () => {
        pathname = window.location.pathname;
      },
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
    eventBus.on<number>("store:count", (value) => {
      countText = String(value);
    });
  });

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/vanilla", label: "Vanilla" },
    { href: "/react", label: "React" },
    { href: "/vue", label: "Vue" },
    { href: "/solid", label: "Solid" },
    { href: "/svelte", label: "Svelte" },
    { href: "/ember", label: "Ember" },
  ];
</script>

<header class="host-header">
  <span class="logo">Horizon · Svelte Host</span>
  <nav>
    {#each navLinks as { href, label }}
      <a
        href={href}
        class:active={isActive(href)}
        on:click|preventDefault={() => navigateTo(href)}
      >
        {label}
      </a>
    {/each}
  </nav>
  <div class="event-log">
    <span class="event-log-label">event bus</span>
    <span class="event-log-value">{countText}</span>
  </div>
</header>

<main>
  {#if pathname === "/"}
    <div class="home">
      <h1>Horizon Micro-Frontend Demo</h1>
      <p>
        One host app orchestrating six child apps — Vanilla TS, React, Vue 3,
        Solid, Svelte, and Ember. Each runs in an isolated JS sandbox. Child
        apps have <strong>zero knowledge</strong> of Horizon.
      </p>
      <div class="cards">
        <button type="button" class="card card-vanilla" on:click={() => navigateTo("/vanilla")}>
          <h2>Vanilla TS →</h2>
          <p>Pure DOM. Low-level <code>window.__HORIZON_LIFECYCLE__</code> API.</p>
        </button>
        <button type="button" class="card card-react" on:click={() => navigateTo("/react")}>
          <h2>React 18 →</h2>
          <p>Uses <code>horizon-mfe/react</code> — just <code>defineApp(App)</code>.</p>
        </button>
        <button type="button" class="card card-vue" on:click={() => navigateTo("/vue")}>
          <h2>Vue 3 →</h2>
          <p>Uses <code>horizon-mfe/vue</code> — just <code>defineApp(App)</code>.</p>
        </button>
        <button type="button" class="card card-solid" on:click={() => navigateTo("/solid")}>
          <h2>Solid →</h2>
          <p>Uses <code>horizon-mfe/solid</code> — just <code>defineApp(App)</code>.</p>
        </button>
        <button type="button" class="card card-svelte" on:click={() => navigateTo("/svelte")}>
          <h2>Svelte →</h2>
          <p>Uses <code>horizon-mfe/svelte</code> — just <code>defineApp(App)</code>.</p>
        </button>
        <button type="button" class="card card-ember" on:click={() => navigateTo("/ember")}>
          <h2>Ember →</h2>
          <p>Uses <code>horizon-mfe/ember</code> lifecycle.</p>
        </button>
      </div>
    </div>
  {/if}

  <div
    id="app-container"
    class="app-container"
    class:app-container--hidden={pathname === "/"}
  />
</main>
