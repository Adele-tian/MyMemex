"use client";

import { X } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { ViewFilter } from "@/lib/types";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  currentFilter: ViewFilter;
  onSelectFilter: (filter: ViewFilter) => void;
  tags: string[];
  notesCount: number;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function MobileSidebar(props: MobileSidebarProps) {
  if (!props.open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden">
      <div className="absolute left-0 top-0 h-full w-[86%] max-w-sm bg-card shadow-soft">
        <div className="flex items-center justify-end px-4 py-4">
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-2xl border border-border/70 bg-background/80 p-2 text-foreground/70"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-[calc(100%-72px)]">
          <Sidebar
            collapsed={false}
            currentFilter={props.currentFilter}
            onToggle={props.onClose}
            onSelectFilter={(filter) => {
              props.onSelectFilter(filter);
              props.onClose();
            }}
            tags={props.tags}
            notesCount={props.notesCount}
            mobileVisible
            searchQuery={props.searchQuery}
            onSearchChange={props.onSearchChange}
          />
        </div>
      </div>
    </div>
  );
}
