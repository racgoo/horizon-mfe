import { defineApp } from "horizon-mfe/solid";
import { Router, Route, useNavigate } from "@solidjs/router";
import type { ParentProps } from "solid-js";
import Content from "./Content";

// Capture router's navigate so onResume can sync it from outside the component tree.
// Must be done inside `root` — the layout component that has full router context.
let navigate: ReturnType<typeof useNavigate> | undefined;

function Root(props: ParentProps) {
  navigate = useNavigate();
  return <>{props.children}</>;
}

defineApp(
  () => (
    <Router root={Root}>
      <Route path="/solid" component={Content} />
      <Route path="*" component={() => null} />
    </Router>
  ),
  {
    onResume({ pathname }) {
      navigate?.(pathname, { replace: true });
    },
  },
);
