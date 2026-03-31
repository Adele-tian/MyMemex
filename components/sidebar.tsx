"use client";

import { BookHeart, CalendarDays, NotebookPen, PanelLeftClose, PanelLeftOpen, Settings } from "lucide-react";
import { ViewFilter } from "@/lib/types";

interface SidebarProps {
  collapsed: boolean;
  currentFilter: ViewFilter;
  onToggle: () => void;
  onSelectFilter: (filter: ViewFilter) => void;
  tags: string[];
  notesCount: number;
  mobileVisible?: boolean;
}

export function Sidebar({
  collapsed,
  currentFilter,
  onToggle,
  onSelectFilter,
  tags,
  notesCount,
  mobileVisible = false,
}: SidebarProps) {
  return (
    <aside
      className={`glass-card border-r border-white/45 ${
        mobileVisible ? "flex w-full" : "hidden lg:flex"
      } ${collapsed ? "w-24" : "w-80"} flex-col transition-all duration-300`}
    >
      <div className="border-b border-white/45 px-4 py-5">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-2xl border border-white/55 bg-white/60 p-2 text-foreground/70 transition hover:border-primary/30 hover:text-primary"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        <div className="rounded-3xl border border-white/55 bg-white/45 p-2 shadow-soft">
          <NavButton
            collapsed={collapsed}
            active={currentFilter === "today"}
            icon={<NotebookPen className="h-4 w-4" />}
            label="今日日记"
            meta="专注记录今天"
            onClick={() => onSelectFilter("today")}
          />

          <NavButton
            collapsed={collapsed}
            active={currentFilter === "home"}
            icon={<BookHeart className="h-4 w-4" />}
            label="首页总览"
            meta="情绪与习惯"
            onClick={() => onSelectFilter("home")}
          />

          <NavButton
            collapsed={collapsed}
            active={currentFilter === "all"}
            icon={<CalendarDays className="h-4 w-4" />}
            label="全部日记"
            meta={`${notesCount} 条`}
            onClick={() => onSelectFilter("all")}
          />

          <NavButton
            collapsed={collapsed}
            active={currentFilter === "settings"}
            icon={<Settings className="h-4 w-4" />}
            label="设置"
            meta=""
            onClick={() => onSelectFilter("settings")}
          />
        </div>
      </div>
    </aside>
  );
}

function NavButton({
  active,
  collapsed,
  icon,
  label,
  meta,
  onClick,
}: {
  active: boolean;
  collapsed: boolean;
  icon: React.ReactNode;
  label: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-[1.35rem] px-3 py-3 text-left transition ${
        active ? "bg-gradient-to-r from-[#ffc6cf] to-[#dca4ff] text-white" : "text-foreground/70 hover:bg-white/65 hover:text-foreground"
      }`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${active ? "border-white/20 bg-white/20" : "border-current/10 bg-white/70"}`}>
        {icon}
      </span>
      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{label}</span>
          <span className="block truncate text-xs text-current/60">{meta}</span>
        </span>
      )}
    </button>
  );
}
