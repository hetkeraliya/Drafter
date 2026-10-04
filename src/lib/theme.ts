import type { PaperTheme } from "./types";

export const THEME_COLORS = { light: "#eeeef0", dark: "#0b0b0c" } as const;

export function isDarkNow(theme: PaperTheme) {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Sets the theme on <html> and keeps the browser / PWA status bar colour in step with it.
export function applyTheme(theme: PaperTheme) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  const color = isDarkNow(theme) ? THEME_COLORS.dark : THEME_COLORS.light;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", color));
}
