import { useSharedState } from "horizon-mfe/react";
import "./style.css";
import { useNavigate } from "react-router-dom";

export default function Content() {
  const [count, setCount] = useSharedState<number>("count", 0);
  const navigate = useNavigate();

  return (
    <div className="react-app">
      <div className="app-badge">React 18</div>
      <nav className="child-nav">
        <button
          className="child-nav-button"
          onClick={() => navigate("/vanilla", { replace: true })}
        >
          /vanilla
        </button>
        <button
          className="child-nav-button is-active"
          onClick={() => navigate("/react")}
        >
          /react
        </button>
        <button className="child-nav-button" onClick={() => navigate("/vue")}>
          /vue
        </button>
        <button className="child-nav-button" onClick={() => navigate("/solid")}>
          /solid
        </button>
        <button
          className="child-nav-button"
          onClick={() => navigate("/svelte")}
        >
          /svelte
        </button>
        <button className="child-nav-button" onClick={() => navigate("/ember")}>
          /ember
        </button>
      </nav>
      <h2>Counter</h2>
      <div className="counter-display">{count}</div>
      <div className="counter-controls">
        <button className="btn btn-ghost" onClick={() => setCount(count - 1)}>
          −
        </button>
        <button className="btn btn-outline" onClick={() => setCount(0)}>
          Reset
        </button>
        <button className="btn btn-primary" onClick={() => setCount(count + 1)}>
          +
        </button>
      </div>
      <p className="hint">
        Shared count via <code>useSharedState("count", 0)</code>
      </p>
    </div>
  );
}
