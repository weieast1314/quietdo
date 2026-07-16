export type TaskFlowRuntime = "web" | "desktop" | "android";

function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.protocol === "tauri:" || "__TAURI_INTERNALS__" in window)
  );
}

export function currentRuntime(): TaskFlowRuntime {
  if (typeof window === "undefined") return "web";
  if (!isTauri()) return "web";
  return /Android/i.test(window.navigator.userAgent) ? "android" : "desktop";
}

export function isDesktopRuntime(): boolean {
  return currentRuntime() === "desktop";
}

export function isNativeRuntime(): boolean {
  return currentRuntime() !== "web";
}
