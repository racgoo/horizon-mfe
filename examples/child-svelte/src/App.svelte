<script lang="ts">
  import { useSharedState } from "horizon-mfe/svelte";
  import { navigateTo } from "horizon-mfe";
  import "./style.css";

  const count = useSharedState("count", 0);
</script>

<div class="svelte-app">
  <div class="app-badge">Svelte</div>
  <nav class="child-nav">
    <button class="child-nav-button" on:click={() => navigateTo("/vanilla")}>/vanilla</button>
    <button class="child-nav-button" on:click={() => navigateTo("/react")}>/react</button>
    <button class="child-nav-button" on:click={() => navigateTo("/vue")}>/vue</button>
    <button class="child-nav-button" on:click={() => navigateTo("/solid")}>/solid</button>
    <button class="child-nav-button is-active" on:click={() => navigateTo("/svelte")}>/svelte</button>
    <button class="child-nav-button" on:click={() => navigateTo("/ember")}>/ember</button>
  </nav>
  <h2>Counter</h2>
  <div class="counter-display">{$count}</div>
  <div class="counter-controls">
    <button class="btn btn-ghost" on:click={() => count.set($count - 1)}>−</button>
    <button class="btn btn-outline" on:click={() => count.set(0)}>Reset</button>
    <button class="btn btn-primary" on:click={() => count.set($count + 1)}>+</button>
  </div>
  <p class="hint">
    Shared count via <code>useSharedState("count", 0)</code>
  </p>
</div>
