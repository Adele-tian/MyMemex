"use client";

import { BookText, Hash, History, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
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
      className={`border-r border-border/70 bg-card/70 backdrop-blur-xl ${
        mobileVisible ? "flex w-full" : "hidden lg:flex"
      } ${collapsed ? "w-24" : "w-80"} flex-col transition-all duration-300`}
    >
      <div className="border-b border-border/70 px-4 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className={collapsed ? "hidden" : "block flex-1"}>
            <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">Second Brain</p>
            <h1 className="mt-2 text-xl font-semibold text-foreground">Knowledge Atlas</h1>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="rounded-2xl border border-border/70 bg-background/80 p-2 text-foreground/70 transition hover:border-primary/30 hover:text-primary"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
        <div className="rounded-3xl border border-border/60 bg-background/65 p-2 shadow-soft">
          <NavButton
            collapsed={collapsed}
            active={currentFilter === "all"}
            icon={<BookText className="h-4 w-4" />}
            label="所有笔记"
            meta={`${notesCount} 条`}
            onClick={() => onSelectFilter("all")}
          />
          <NavButton
            collapsed={collapsed}
            active={currentFilter === "review"}
            icon={<History className="h-4 w-4" />}
            label="今日回顾"
            meta="3 条"
            onClick={() => onSelectFilter("review")}
          />
        </div>

        {!collapsed && (
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2 px-2 text-xs uppercase tracking-[0.24em] text-foreground/45">
              <Hash className="h-3.5 w-3.5" />
              标签云
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onSelectFilter(`tag:${tag}`)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      currentFilter === `tag:${tag}`
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border/70 bg-card/70 text-foreground/70 hover:border-primary/20 hover:text-primary"
                    }`}
                  >
                    #{tag}
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border/70 px-4 py-5 text-sm text-foreground/45">
                  添加 `#标签` 后会自动汇总到这里。
                </div>
              )}
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mt-6 flex justify-center">
            <div className="rounded-2xl border border-border/70 bg-background/70 p-3 text-foreground/50">
              <Search className="h-4 w-4" />
            </div>
          </div>
        )}
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
        active ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted/80 hover:text-foreground"
      }`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-current/10 bg-background/75">
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
