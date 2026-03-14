import { useHorizonHost, useHostSharedState } from "horizon-mfe/react";
import "./style.css";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/vanilla", label: "Vanilla" },
  { href: "/react", label: "React" },
  { href: "/vue", label: "Vue" },
  { href: "/solid", label: "Solid" },
  { href: "/svelte", label: "Svelte" },
  { href: "/ember", label: "Ember" },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export default function App() {
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
      {
        name: "child-svelte",
        entry: "http://localhost:3005",
        route: "/svelte",
      },
      { name: "child-ember", entry: "http://localhost:3006", route: "/ember" },
    ],
  });

  const [count] = useHostSharedState<number>("count", 0);
  const showHome = pathname === "/";

  return (
    <>
      <header className="host-header">
        <span className="logo">Horizon · React Host</span>
        <nav>
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={isActive(href, pathname) ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                navigate(href);
              }}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="event-log">
          <span className="event-log-label">event bus</span>
          <span className="event-log-value">{count}</span>
        </div>
      </header>

      <main>
        {showHome && (
          <div className="home">
            <h1>Horizon Micro-Frontend Demo</h1>
            <p>
              One host app orchestrating six child apps — Vanilla TS, React, Vue
              3, Solid, Svelte, and Ember. Each runs in an isolated JS sandbox.
              Child apps have <strong>zero knowledge</strong> of Horizon.
            </p>
            <div className="cards">
              <button
                type="button"
                className="card card-vanilla"
                onClick={() => navigate("/vanilla")}
              >
                <h2>Vanilla TS →</h2>
                <p>
                  Pure DOM. Low-level <code>window.__HORIZON_LIFECYCLE__</code>{" "}
                  API.
                </p>
              </button>
              <button
                type="button"
                className="card card-react"
                onClick={() => navigate("/react")}
              >
                <h2>React 18 →</h2>
                <p>
                  Uses <code>horizon-mfe/react</code> — just{" "}
                  <code>defineApp(App)</code>.
                </p>
              </button>
              <button
                type="button"
                className="card card-vue"
                onClick={() => navigate("/vue")}
              >
                <h2>Vue 3 →</h2>
                <p>
                  Uses <code>horizon-mfe/vue</code> — just{" "}
                  <code>defineApp(App)</code>.
                </p>
              </button>
              <button
                type="button"
                className="card card-solid"
                onClick={() => navigate("/solid")}
              >
                <h2>Solid →</h2>
                <p>
                  Uses <code>horizon-mfe/solid</code> — just{" "}
                  <code>defineApp(App)</code>.
                </p>
              </button>
              <button
                type="button"
                className="card card-svelte"
                onClick={() => navigate("/svelte")}
              >
                <h2>Svelte →</h2>
                <p>
                  Uses <code>horizon-mfe/svelte</code> — just{" "}
                  <code>defineApp(App)</code>.
                </p>
              </button>
              <button
                type="button"
                className="card card-ember"
                onClick={() => navigate("/ember")}
              >
                <h2>Ember →</h2>
                <p>
                  Uses <code>horizon-mfe/ember</code> lifecycle.
                </p>
              </button>
            </div>
          </div>
        )}

        <div
          id="app-container"
          className={`app-container${showHome ? " app-container--hidden" : ""}`}
        />
      </main>
    </>
  );
}
