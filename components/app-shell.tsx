"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Clock3, History, SquarePen } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { InspirationInput } from "@/components/inspiration-input";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { NoteCard } from "@/components/note-card";
import { NoteEditorModal } from "@/components/note-editor-modal";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { TopBar } from "@/components/top-bar";
import { sampleNotes } from "@/lib/sample-notes";
import { loadNotes, saveNotes } from "@/lib/storage";
import { Note, ViewFilter } from "@/lib/types";
import { extractTags, extractTitle } from "@/lib/utils";

type SortField = "updatedAt" | "createdAt";
type SortDirection = "desc" | "asc";

function getDailyReviewNotes(notes: Note[]) {
  const now = new Date();
  const daySeed = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

  const candidates = notes.filter((note) => {
    const ageMs = now.getTime() - new Date(note.createdAt).getTime();
    return ageMs >= 24 * 60 * 60 * 1000;
  });

  const source = candidates.length >= 3 ? candidates : notes;

  return [...source]
    .map((note) => {
      const createdAgeDays = Math.max(
        1,
        Math.floor((now.getTime() - new Date(note.createdAt).getTime()) / (24 * 60 * 60 * 1000)),
      );
      const updatedAgeDays = Math.max(
        1,
        Math.floor((now.getTime() - new Date(note.updatedAt).getTime()) / (24 * 60 * 60 * 1000)),
      );
      const jitter = [...`${daySeed}-${note.id}`].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 7;

      return {
        note,
        score: createdAgeDays * 0.65 + updatedAgeDays * 0.35 + jitter * 0.1,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.note);
}

function AppContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showCapture, setShowCapture] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    setNotes(loadNotes());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveNotes(notes);
    }
  }, [hydrated, notes]);

  useEffect(() => {
    if (hydrated && notes.length === 0) {
      setNotes(sampleNotes);
    }
  }, [hydrated, notes]);

  const tags = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.tags))).sort((a, b) => a.localeCompare(b)),
    [notes],
  );

  const dailyReviewNotes = useMemo(() => getDailyReviewNotes(notes), [notes]);

  const filteredNotes = useMemo(() => {
    const baseNotes = filter === "review" ? dailyReviewNotes : notes;

    const scoped = [...baseNotes]
      .filter((note) => {
        if (filter === "all") {
          return true;
        }

        if (filter === "review") {
          return true;
        }

        if (filter.startsWith("tag:")) {
          const tag = filter.replace("tag:", "");
          return note.tags.includes(tag);
        }

        return true;
      })
      .filter((note) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
          return true;
        }

        const haystack = [note.title, note.content, note.tags.join(" ")].join(" ").toLowerCase();
        return haystack.includes(query);
      });

    return scoped.sort((a, b) => {
      const left = new Date(a[sortField]).getTime();
      const right = new Date(b[sortField]).getTime();
      return sortDirection === "desc" ? right - left : left - right;
    });
  }, [dailyReviewNotes, filter, notes, searchQuery, sortDirection, sortField]);

  const handleCreateNote = (content: string) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: extractTitle(content),
      content,
      tags: extractTags(content),
      createdAt: now,
      updatedAt: now,
    };

    setNotes((current) => [newNote, ...current]);
    setFilter("all");
    setShowCapture(true);
  };

  const handleSaveEdit = (noteId: string, content: string) => {
    const now = new Date().toISOString();
    setNotes((current) =>
      current.map((note) =>
        note.id === noteId
          ? {
              ...note,
              title: extractTitle(content),
              content,
              tags: extractTags(content),
              updatedAt: now,
            }
          : note,
      ),
    );
  };

  const handleDeleteNote = (note: Note) => {
    const confirmed = window.confirm(`确认删除「${note.title}」吗？这条知识卡片会从本地存储中移除。`);
    if (!confirmed) {
      return;
    }

    setNotes((current) => current.filter((item) => item.id !== note.id));
    if (editingNote?.id === note.id) {
      setEditingNote(null);
    }
  };

  const handleSelectFilter = (nextFilter: ViewFilter) => {
    setFilter(nextFilter);
    setShowCapture(false);
  };

  const showSortControls = !showCapture || searchQuery.trim().length > 0;
  const allowSorting = filter !== "review";

  return (
    <div className="min-h-screen bg-paper">
      <NoteEditorModal
        note={editingNote}
        open={Boolean(editingNote)}
        onClose={() => setEditingNote(null)}
        onSave={handleSaveEdit}
      />

      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        currentFilter={filter}
        onSelectFilter={handleSelectFilter}
        tags={tags}
        notesCount={notes.length}
      />

      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <Sidebar
          collapsed={collapsed}
          currentFilter={filter}
          onToggle={() => setCollapsed((value) => !value)}
          onSelectFilter={handleSelectFilter}
          tags={tags}
          notesCount={notes.length}
        />

        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <TopBar
            onOpenMenu={() => setMobileOpen(true)}
            noteCount={notes.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <div className="mt-6 space-y-6">
            {showCapture && <InspirationInput onSubmit={handleCreateNote} />}

            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">Knowledge Stream</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {filter === "all" && "全部卡片"}
                    {filter === "review" && "今日回顾"}
                    {filter.startsWith("tag:") && `#${filter.replace("tag:", "")}`}
                  </h3>
                </div>
                {showSortControls ? (
                  <div className="flex flex-col gap-3 sm:items-end">
                    <div className="flex flex-wrap gap-2">
                      {!showCapture && (
                        <button
                          type="button"
                          onClick={() => setShowCapture(true)}
                          className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-2 text-sm text-foreground/65 transition hover:text-foreground"
                        >
                          <SquarePen className="h-4 w-4" />
                          打开灵感框
                        </button>
                      )}
                      {allowSorting && (
                        <>
                          <button
                            type="button"
                            onClick={() => setSortField("updatedAt")}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                              sortField === "updatedAt"
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border/70 bg-card/70 text-foreground/65 hover:text-foreground"
                            }`}
                          >
                            <History className="h-4 w-4" />
                            按修改时间
                          </button>
                          <button
                            type="button"
                            onClick={() => setSortField("createdAt")}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                              sortField === "createdAt"
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border/70 bg-card/70 text-foreground/65 hover:text-foreground"
                            }`}
                          >
                            <Clock3 className="h-4 w-4" />
                            按创建时间
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSortDirection((current) => (current === "desc" ? "asc" : "desc"))
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-2 text-sm text-foreground/65 transition hover:text-foreground"
                          >
                            {sortDirection === "desc" ? (
                              <ArrowDownAZ className="h-4 w-4" />
                            ) : (
                              <ArrowUpAZ className="h-4 w-4" />
                            )}
                            {sortDirection === "desc" ? "从近到远" : "从远到近"}
                          </button>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-foreground/55">
                      {searchQuery.trim()
                        ? `当前搜索：${searchQuery}`
                        : filter === "review"
                          ? "基于旧笔记年龄与最近编辑时间，自动挑选 3 条值得今天回顾的内容。"
                        : "浏览历史笔记，并按创建或修改时间切换排序。"}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-foreground/55">
                    用轻量卡片整理碎片灵感，让知识自然沉淀并随时回看。
                  </p>
                )}
              </div>

              {filteredNotes.length > 0 ? (
                <div className="columns-1 gap-4 space-y-4 md:columns-2 xl:columns-3">
                  {filteredNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onEdit={setEditingNote}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
