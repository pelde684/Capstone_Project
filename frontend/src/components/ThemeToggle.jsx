import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ iconOnly = false, className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? "Light mode" : "Dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${label.toLowerCase()}`}
      title={`Switch to ${label.toLowerCase()}`}
      className={`flex items-center justify-center gap-2 rounded-xl border border-line bg-panel text-sm font-medium text-body backdrop-blur-md transition-colors hover:bg-hover ${
        iconOnly ? "h-9 w-9" : "px-3 py-2"
      } ${className}`}
    >
      <Icon className="h-4 w-4" />
      {!iconOnly && label}
    </button>
  );
}