"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { InspirationInput } from "@/components/inspiration-input";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { NoteCard } from "@/components/note-card";
import { NoteEditorModal } from "@/components/note-editor-modal";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { TopBar } from "@/components/top-bar";
import { loadNotes, saveNotes } from "@/lib/storage";
import { Note, ViewFilter } from "@/lib/types";
import { extractTags, extractTitle } from "@/lib/utils";

function AppContent() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState<ViewFilter>("all");
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    setNotes(loadNotes());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveNotes(notes);
    }
  }, [hydrated, notes]);

  const tags = useMemo(
    () =>
      Array.from(new Set(notes.flatMap((note) => note.tags)))
        .sort((a, b) => a.localeCompare(b)),
    [notes],
  );

  const filteredNotes = useMemo(() => {
    const sorted = [...notes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    if (filter === "all") {
      return sorted;
    }

    if (filter === "recent") {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return sorted.filter((note) => new Date(note.createdAt).getTime() >= sevenDaysAgo);
    }

    if (filter.startsWith("tag:")) {
      const tag = filter.replace("tag:", "");
      return sorted.filter((note) => note.tags.includes(tag));
    }

    return sorted;
  }, [filter, notes]);

  const handleCreateNote = (content: string) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: extractTitle(content),
      content,
      tags: extractTags(content),
      createdAt: now,
    };

    setNotes((current) => [newNote, ...current]);
    setFilter("all");
  };

  const handleSaveEdit = (noteId: string, content: string) => {
    setNotes((current) =>
      current.map((note) =>
        note.id === noteId
          ? {
              ...note,
              title: extractTitle(content),
              content,
              tags: extractTags(content),
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
        onSelectFilter={setFilter}
        tags={tags}
        notesCount={notes.length}
      />

      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <Sidebar
          collapsed={collapsed}
          currentFilter={filter}
          onToggle={() => setCollapsed((value) => !value)}
          onSelectFilter={setFilter}
          tags={tags}
          notesCount={notes.length}
        />

        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <TopBar onOpenMenu={() => setMobileOpen(true)} noteCount={notes.length} />

          <div className="mt-6 space-y-6">
            <InspirationInput onSubmit={handleCreateNote} />

            <section>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">Knowledge Stream</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {filter === "all" && "全部卡片"}
                    {filter === "recent" && "最近更新"}
                    {filter.startsWith("tag:") && `#${filter.replace("tag:", "")}`}
                  </h3>
                </div>
                <p className="text-sm text-foreground/55">
                  用轻量卡片整理碎片灵感，让知识自然沉淀并随时回看。
                </p>
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
