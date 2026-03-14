import { useSharedState } from "horizon-mfe/solid";
import { useNavigate } from "@solidjs/router";
import "./style.css";

export default function Content() {
  const [count, setCount] = useSharedState<number>("count", 0);
  const navigate = useNavigate();

  return (
    <div class="solid-app">
      <div class="app-badge">Solid</div>
      <nav class="child-nav">
        <button
          class="child-nav-button"
          onClick={() => navigate("/vanilla", { replace: true })}
        >
          /vanilla
        </button>
        <button class="child-nav-button" onClick={() => navigate("/react")}>
          /react
        </button>
        <button class="child-nav-button" onClick={() => navigate("/vue")}>
          /vue
        </button>
        <button
          class="child-nav-button is-active"
          onClick={() => navigate("/solid")}
        >
          /solid
        </button>
        <button class="child-nav-button" onClick={() => navigate("/svelte")}>
          /svelte
        </button>
        <button class="child-nav-button" onClick={() => navigate("/ember")}>
          /ember
        </button>
      </nav>
      <h2>Counter</h2>
      <div class="counter-display">{count()}</div>
      <div class="counter-controls">
        <button class="btn btn-ghost" onClick={() => setCount(count() - 1)}>
          −
        </button>
        <button class="btn btn-outline" onClick={() => setCount(0)}>
          Reset
        </button>
        <button class="btn btn-primary" onClick={() => setCount(count() + 1)}>
          +
        </button>
      </div>
      <p class="hint">
        Shared count via <code>useSharedState("count", 0)</code>
      </p>
    </div>
  );
}
