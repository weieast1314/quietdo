import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TaskFlowApp } from "@/app/taskflow-app";
import "@/app/globals.css";
import "./desktop.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("QuietDo root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <TaskFlowApp />
  </StrictMode>,
);
