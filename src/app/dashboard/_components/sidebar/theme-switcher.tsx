"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { persistPreference } from "@/lib/preferences/preferences-storage";
import { usePreferencesStore } from "@/stores/preferences/preferences-provider";

export function ThemeSwitcher() {
  const themeMode = usePreferencesStore((s) => s.themeMode);
  const resolvedThemeMode = usePreferencesStore((s) => s.resolvedThemeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);

  const cycleTheme = () => {
    const current: "light" | "dark" =
      themeMode === "system" ? resolvedThemeMode : themeMode === "dark" ? "dark" : "light";
    const next = current === "light" ? "dark" : "light";
    setThemeMode(next);
    persistPreference("theme_mode", next);
  };

  const nextLabel = resolvedThemeMode === "light" ? "dark" : "light";

  return (
    <Button
      size="icon"
      onClick={cycleTheme}
      aria-label={`Theme is ${resolvedThemeMode}. Switch to ${nextLabel} mode.`}
    >
      <Sun className="hidden dark:block" />
      <Moon className="block dark:hidden" />
    </Button>
  );
}
