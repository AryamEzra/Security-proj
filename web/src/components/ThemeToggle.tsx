"use client";

import { useTheme } from "./ThemeProvider";


export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      className="btn"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      title="Toggle theme"
    >
      {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}