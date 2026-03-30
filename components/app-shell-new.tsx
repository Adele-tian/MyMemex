"use client";

import { useEffect, useMemo, useState } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { CalendarDays, Heart, Sparkles } from "lucide-react";
import { DataVisualization } from "@/components/data-visualization";
import { EmptyState } from "@/components/empty-state";
import { InspirationInput } from "@/components/inspiration-input";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { NoteCard } from "@/components/note-card";
import { NoteEditorModal } from "@/components/note-editor-modal";
import { SettingsPanel } from "@/components/settings-panel";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { TopBar } from "@/components/top-bar";
import { DiaryEntry, HABIT_DEFINITIONS, HabitCheckin, MoodLevel, Note, ViewFilter } from "@/lib/types";
import { createNote, deleteNote, loadHabitCheckins, loadNotes, saveHabitCheckin, updateNote } from "@/lib/storage";
import { extractTags, extractTitle, formatFullDate, getMoodEmoji, getMoodLabel, suggestTags, toDateOnly } from "@/lib/utils";

function AppContent() {
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [habitCheckins, setHabitCheckins] = useState<HabitCheckin[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState<ViewFilter>("home");
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const today = toDateOnly(new Date());

  useEffect(() => {
    async function fetchData() {
      if (status !== "authenticated") {
        setEntries(await loadNotes());
        setHabitCheckins([]);
        setHydrated(true);
        return;
      }

      const [loadedEntries, loadedCheckins] = await Promise.all([loadNotes(), loadHabitCheckins()]);
      setEntries(loadedEntries);
      setHabitCheckins(loadedCheckins);
      setHydrated(true);
    }

    void fetchData();
  }, [status]);

  const todayEntries = useMemo(
    () => entries.filter((entry) => entry.entryDate === today).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [entries, today],
  );

  const visibleEntries = useMemo(() => {
    let scoped = [...entries];

    if (filter === "today") {
      scoped = scoped.filter((entry) => entry.entryDate === today);
    } else if (filter === "home") {
      scoped = scoped.slice(0, 6);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      scoped = scoped.filter((entry) =>
        [entry.title, entry.content, entry.entryDate, ...entry.tags].filter(Boolean).join(" ").toLowerCase().includes(query),
      );
    }

    return scoped.sort((a, b) => `${b.entryDate}${b.createdAt}`.localeCompare(`${a.entryDate}${a.createdAt}`));
  }, [entries, filter, searchQuery, today]);

  const todayMood = useMemo(() => {
    const moodEntry = todayEntries.find((entry) => entry.moodLevel);
    return moodEntry?.moodLevel;
  }, [todayEntries]);

  const handleCreateEntry = async (content: string) => {
    const extractedTags = extractTags(content);
    const allKnownTags = Array.from(new Set(entries.flatMap((entry) => entry.tags))).filter((tag) => !extractedTags.includes(tag));
    const suggested = suggestTags(content, extractedTags, allKnownTags);

    const newEntry = await createNote({
      title: extractTitle(content),
      content,
      tags: Array.from(new Set([...extractedTags, ...suggested.slice(0, 2)])),
      entryDate: today,
      moodLevel: todayMood,
    });

    if (newEntry) {
      setEntries((current) => [newEntry, ...current]);
      setFilter("home");
    }
  };

  const handleSaveEdit = async (entryId: string, content: string) => {
    const current = entries.find((entry) => entry.id === entryId);
    if (!current) {
      return;
    }

    const updated = await updateNote({
      ...current,
      title: extractTitle(content),
      content,
      tags: extractTags(content),
    });

    if (updated) {
      setEntries((currentEntries) => currentEntries.map((entry) => (entry.id === entryId ? updated : entry)));
    }
  };

  const handleDeleteEntry = async (entry: Note) => {
    const confirmed = window.confirm(`确认删除 ${entry.entryDate} 这条日记吗？`);
    if (!confirmed) {
      return;
    }

    const success = await deleteNote(entry.id);
    if (success) {
      setEntries((current) => current.filter((item) => item.id !== entry.id));
      if (editingEntry?.id === entry.id) {
        setEditingEntry(null);
      }
    }
  };

  const handleMoodChange = async (level: MoodLevel) => {
    if (todayEntries.length > 0) {
      const target = todayEntries[0];
      const updated = await updateNote({ ...target, moodLevel: level });
      if (updated) {
        setEntries((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      }
      return;
    }

    const created = await createNote({
      title: "今天的心情记录",
      content: "今天先记录一下自己的心情，稍后再补完整的日记内容。",
      tags: [],
      entryDate: today,
      moodLevel: level,
    });

    if (created) {
      setEntries((current) => [created, ...current]);
    }
  };

  const toggleHabit = async (habitKey: HabitCheckin["habitKey"]) => {
    const current = habitCheckins.find((item) => item.date === today && item.habitKey === habitKey);
    const next = await saveHabitCheckin({
      date: today,
      habitKey,
      completed: !current?.completed,
    });

    if (next) {
      setHabitCheckins((existing) => {
        const rest = existing.filter((item) => !(item.date === today && item.habitKey === habitKey));
        return [...rest, next];
      });
    }
  };

  const todayHabitMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const item of habitCheckins) {
      if (item.date === today) {
        map.set(item.habitKey, item.completed);
      }
    }
    return map;
  }, [habitCheckins, today]);

  if (status === "loading" || !hydrated) {
    return <div className="min-h-screen flex items-center justify-center bg-paper">正在加载...</div>;
  }

  return (
    <div className="min-h-screen bg-paper">
      <NoteEditorModal
        note={editingEntry}
        open={Boolean(editingEntry)}
        onClose={() => setEditingEntry(null)}
        onSave={handleSaveEdit}
        allKnownTags={Array.from(new Set(entries.flatMap((entry) => entry.tags)))}
      />

      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        currentFilter={filter}
        onSelectFilter={setFilter}
        tags={[]}
        notesCount={entries.length}
      />

      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <Sidebar
          collapsed={collapsed}
          currentFilter={filter}
          onToggle={() => setCollapsed((value) => !value)}
          onSelectFilter={setFilter}
          tags={[]}
          notesCount={entries.length}
        />

        <main className="flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <TopBar
            onOpenMenu={() => setMobileOpen(true)}
            noteCount={entries.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery("")}
            userName={session?.user?.name || session?.user?.email || "访客"}
            onLogout={() => signOut({ callbackUrl: "/login" })}
          />

          <div className="mt-6 space-y-6">
            {filter !== "settings" && (
              <section className="rounded-[2rem] border border-border/70 bg-card/85 p-5 shadow-soft">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-accent/70 px-3 py-1 text-xs uppercase tracking-[0.22em] text-primary">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Today
                    </div>
                    <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">{formatFullDate(new Date().toISOString())}</h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/60">
                      先记录今天的心情，再完成习惯打卡，最后写下你今天最想记住的一件事。
                    </p>
                  </div>

                  <div className="rounded-[1.6rem] border border-border/70 bg-background/70 p-4 lg:w-[360px]">
                    <div className="flex items-center gap-2 text-sm text-foreground/55">
                      <Heart className="h-4 w-4" />
                      今日心情
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => void handleMoodChange(level as MoodLevel)}
                          className={`rounded-2xl border px-4 py-3 text-sm transition ${
                            todayMood === level
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border/70 bg-card/70 text-foreground/70 hover:border-primary/20 hover:text-primary"
                          }`}
                        >
                          <span className="mr-2">{getMoodEmoji(level)}</span>
                          {getMoodLabel(level)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {HABIT_DEFINITIONS.map((habit) => {
                    const completed = todayHabitMap.get(habit.key);
                    return (
                      <button
                        key={habit.key}
                        type="button"
                        onClick={() => void toggleHabit(habit.key)}
                        className={`rounded-[1.5rem] border p-4 text-left transition ${
                          completed
                            ? "border-primary/30 bg-primary/10"
                            : "border-border/70 bg-background/70 hover:border-primary/20"
                        }`}
                      >
                        <div className="text-2xl">{habit.icon}</div>
                        <p className="mt-3 font-medium text-foreground">{habit.label}</p>
                        <p className="mt-1 text-sm text-foreground/55">{completed ? "今天已完成" : "今天还没打卡"}</p>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {(filter === "home" || filter === "today") && <InspirationInput onSubmit={(content) => void handleCreateEntry(content)} />}

            {(filter === "home" || filter === "insights") && (
              <DataVisualization entries={entries} habits={habitCheckins} />
            )}

            {filter === "settings" && (
              <section>
                <SettingsPanel notes={entries} onImportSuccess={(imported) => setEntries((current) => [...imported, ...current])} />
              </section>
            )}

            {filter !== "settings" && (
              <section>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">
                      {filter === "today" ? "Today Diary" : filter === "all" ? "All Diaries" : "Recent Diaries"}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                      {filter === "today" ? "今日日记" : filter === "all" ? "全部日记" : "最近日记"}
                    </h3>
                  </div>
                  <p className="text-sm text-foreground/55">
                    {searchQuery.trim() ? `当前搜索到 ${visibleEntries.length} 条结果` : "把每天的状态、感受和成长，慢慢记成自己的长期轨迹。"}
                  </p>
                </div>

                {visibleEntries.length > 0 ? (
                  <div className="columns-1 gap-4 space-y-4 md:columns-2 xl:columns-3">
                    {visibleEntries.map((entry) => (
                      <NoteCard key={entry.id} note={entry} onEdit={setEditingEntry} onDelete={handleDeleteEntry} />
                    ))}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export function AppShell() {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </SessionProvider>
  );
}
