<script setup lang="ts">
import { useSharedState } from "horizon-mfe/vue";
import { useRouter } from "vue-router";

const [count, setCount] = useSharedState<number>("count", 0);
const router = useRouter();
</script>

<template>
  <div class="vue-app">
    <div class="app-badge">Vue 3</div>
    <nav class="child-nav">
      <button class="child-nav-button" @click="router.replace('/vanilla')">
        /vanilla
      </button>
      <button class="child-nav-button" @click="router.push('/react')">
        /react
      </button>
      <button class="child-nav-button is-active" @click="router.push('/vue')">
        /vue
      </button>
      <button class="child-nav-button" @click="router.push('/solid')">
        /solid
      </button>
      <button class="child-nav-button" @click="router.push('/svelte')">
        /svelte
      </button>
      <button class="child-nav-button" @click="router.push('/ember')">
        /ember
      </button>
    </nav>
    <h2>Counter</h2>
    <div class="counter-display">{{ count }}</div>
    <div class="counter-controls">
      <button class="btn btn-ghost" @click="setCount(count - 1)">−</button>
      <button class="btn btn-outline" @click="setCount(0)">Reset</button>
      <button class="btn btn-primary" @click="setCount(count + 1)">+</button>
    </div>
    <p class="hint">Shared count via <code>useSharedState("count", 0)</code></p>
  </div>
</template>

<style scoped>
.vue-app {
  padding: 32px;
  max-width: 440px;
}

.app-badge {
  display: inline-block;
  background: rgba(66, 184, 131, 0.12);
  color: #42b883;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  margin-bottom: 20px;
  letter-spacing: 0.5px;
}

.child-nav {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border-radius: 999px;
  background: #0d1117;
  border: 1px solid #1f2937;
  margin-bottom: 28px;
}

.child-nav-button {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 500;
  background: transparent;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.child-nav-button:hover {
  background: #1f2937;
  color: #e5e7eb;
}

.child-nav-button.is-active {
  background: rgba(66, 184, 131, 0.18);
  color: #42b883;
  font-weight: 600;
}

h2 {
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: #8888aa;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.counter-display {
  font-size: 5rem;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 24px;
  color: #e2e2f0;
  font-variant-numeric: tabular-nums;
}

.counter-controls {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
}

.btn {
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition:
    opacity 0.15s,
    transform 0.1s;
}
.btn:active {
  transform: scale(0.96);
}

.btn-primary {
  background: #42b883;
  color: #0f0f13;
}
.btn-ghost {
  background: #1f2937;
  color: #e2e2f0;
}
.btn-outline {
  background: transparent;
  border: 1px solid #2e2e40;
  color: #8888aa;
}

.hint {
  font-size: 0.8rem;
  color: #8888aa;
}
.hint code {
  background: #2e2e40;
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
