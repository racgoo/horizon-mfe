import { defineApp } from "horizon-mfe/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Content from "./Content";
import "./style.css";

const router = createBrowserRouter([
  { path: "/react", element: <Content /> },
  { path: "*", element: null },
]);

defineApp(() => <RouterProvider router={router} />, {
  onResume({ pathname }) {
    router.navigate(pathname, { replace: true });
  },
});
