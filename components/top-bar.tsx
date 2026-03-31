"use client";

import { Menu, MoonStar, Search, SunMedium, X } from "lucide-react";
import { LogOut } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

interface TopBarProps {
  onOpenMenu: () => void;
  noteCount: number;
  mode: "encouragement" | "search";
  message?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch?: () => void;
  userName: string;
  onLogout: () => void;
}

export function TopBar({
  onOpenMenu,
  noteCount,
  mode,
  message,
  searchQuery,
  onSearchChange,
  onClearSearch,
  userName,
  onLogout,
}: TopBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="glass-card rounded-[2rem] border border-white/55 px-5 py-4 shadow-soft">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="inline-flex rounded-2xl border border-border/70 bg-background/80 p-2.5 text-foreground/70 lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="hidden rounded-full bg-white/65 px-3 py-1.5 text-sm text-foreground/60 sm:block">
            {noteCount} 条日记
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-white/55 bg-white/55 px-3 py-1.5 text-sm text-foreground/60 lg:block">
            {userName}
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/55 bg-white/60 px-3 py-2 text-sm text-foreground/70 transition hover:border-primary/25 hover:text-primary"
          >
            {theme === "light" ? <MoonStar className="h-4 w-4" /> : <SunMedium className="h-4 w-4" />}
            <span className="hidden sm:inline">{theme === "light" ? "Dark" : "Light"}</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/55 bg-white/60 px-3 py-2 text-sm text-foreground/70 transition hover:border-primary/25 hover:text-primary"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">退出</span>
          </button>
        </div>
      </div>

      {mode === "encouragement" ? (
        <div className="mt-4 rounded-[1.35rem] border border-white/55 bg-white/60 px-4 py-4">
          <p className="text-xs uppercase tracking-[0.28em] text-foreground/40">Today&apos;s Prompt</p>
          <p className="mt-2 text-sm leading-7 text-foreground/75">{message}</p>
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2">
          <label className="flex-1 flex items-center gap-3 rounded-[1.35rem] border border-white/55 bg-white/60 px-4 py-3 text-foreground/55 focus-within:border-primary/30 focus-within:text-primary">
            <Search className="h-4 w-4 shrink-0" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="搜索日期、标题或正文内容"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
            />
          </label>
          {searchQuery && (
            <button
              type="button"
              onClick={onClearSearch || (() => onSearchChange(""))}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/55 bg-white/60 p-2.5 text-sm text-foreground/70 transition hover:border-primary/20 hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
