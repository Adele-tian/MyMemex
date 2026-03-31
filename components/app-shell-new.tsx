"use client";

import { useEffect, useMemo, useState } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { CalendarDays, ChevronLeft, ChevronRight, Heart, Save } from "lucide-react";
import { DataVisualization } from "@/components/data-visualization";
import { EmptyState } from "@/components/empty-state";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { NoteCard } from "@/components/note-card";
import { NoteEditorModal } from "@/components/note-editor-modal";
import { SettingsPanel } from "@/components/settings-panel";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { TopBar } from "@/components/top-bar";
import { DiaryEntry, HABIT_DEFINITIONS, HabitCheckin, MoodLevel, Note, ViewFilter } from "@/lib/types";
import { createNote, deleteNote, loadHabitCheckins, loadNotes, saveHabitCheckin, updateNote } from "@/lib/storage";
import {
  diaryContentToPlainText,
  extractTitle,
  formatEntryDate,
  formatFullDate,
  getMoodEmoji,
  getMoodLabel,
  toDateOnly,
} from "@/lib/utils";

function AppContent() {
  const { data: session, status } = useSession();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [habitCheckins, setHabitCheckins] = useState<HabitCheckin[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [filter, setFilter] = useState<ViewFilter>("today");
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [journalText, setJournalText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const today = toDateOnly(new Date());
  const selectedDateOnly = toDateOnly(selectedDate);

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

  const selectedDateEntries = useMemo(
    () => entries.filter((entry) => entry.entryDate === selectedDateOnly).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [entries, selectedDateOnly],
  );

  const selectedPrimaryEntry = selectedDateEntries[0] ?? null;

  useEffect(() => {
    if (!selectedPrimaryEntry) {
      setJournalText("");
      return;
    }

    setJournalText(diaryContentToPlainText(selectedPrimaryEntry.content));
  }, [selectedPrimaryEntry]);

  const selectedMood = useMemo(() => {
    const moodEntry = selectedDateEntries.find((entry) => entry.moodLevel);
    return moodEntry?.moodLevel;
  }, [selectedDateEntries]);

  const selectedHabitMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const item of habitCheckins) {
      if (item.date === selectedDateOnly) {
        map.set(item.habitKey, item.completed);
      }
    }
    return map;
  }, [habitCheckins, selectedDateOnly]);

  const onThisDayEntry = useMemo(() => {
    const current = new Date(selectedDate);
    const month = current.getMonth();
    const day = current.getDate();
    const year = current.getFullYear();

    return entries
      .filter((entry) => {
        const date = new Date(entry.entryDate);
        return date.getMonth() === month && date.getDate() === day && date.getFullYear() < year;
      })
      .sort((a, b) => b.entryDate.localeCompare(a.entryDate))[0] ?? null;
  }, [entries, selectedDate]);

  const visibleEntries = useMemo(() => {
    let scoped = [...entries];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      scoped = scoped.filter((entry) =>
        [entry.entryDate, entry.title, diaryContentToPlainText(entry.content), ...entry.tags]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    } else if (filter === "all") {
      scoped = [...entries];
    } else if (filter === "home") {
      scoped = [...entries].slice(0, 9);
    } else if (filter === "insights") {
      scoped = [...entries].slice(0, 12);
    } else {
      scoped = [];
    }

    return scoped.sort((a, b) => `${b.entryDate}${b.createdAt}`.localeCompare(`${a.entryDate}${a.createdAt}`));
  }, [entries, filter, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setFilter("all");
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilter("all");
  };

  async function handleSaveToday() {
    setIsSaving(true);
    const content = journalText.trim();
    const title = extractTitle(content || "今天的日记");

    try {
      if (selectedPrimaryEntry) {
        const updated = await updateNote({
          ...selectedPrimaryEntry,
          title,
          content,
          moodLevel: selectedMood,
        });

        if (updated) {
          setEntries((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
        }
      } else {
        const created = await createNote({
          title,
          content,
          tags: [],
          entryDate: selectedDateOnly,
          moodLevel: selectedMood,
        });

        if (created) {
          setEntries((current) => [created, ...current]);
        }
      }
    } finally {
      setIsSaving(false);
    }
  }

  const handleSaveEdit = async (entryId: string, content: string) => {
    const current = entries.find((entry) => entry.id === entryId);
    if (!current) {
      return;
    }

    const updated = await updateNote({
      ...current,
      title: extractTitle(diaryContentToPlainText(content)),
      content,
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
    if (selectedPrimaryEntry) {
      const updated = await updateNote({ ...selectedPrimaryEntry, moodLevel: level });
      if (updated) {
        setEntries((current) => current.map((entry) => (entry.id === updated.id ? updated : entry)));
      }
      return;
    }

    const created = await createNote({
      title: extractTitle(journalText || "今天的心情记录"),
      content: journalText,
      tags: [],
      entryDate: selectedDateOnly,
      moodLevel: level,
    });

    if (created) {
      setEntries((current) => [created, ...current]);
    }
  };

  const toggleHabit = async (habitKey: HabitCheckin["habitKey"]) => {
    const current = habitCheckins.find((item) => item.date === selectedDateOnly && item.habitKey === habitKey);
    const next = await saveHabitCheckin({
      date: selectedDateOnly,
      habitKey,
      completed: !current?.completed,
    });

    if (next) {
      setHabitCheckins((existing) => {
        const rest = existing.filter((item) => !(item.date === selectedDateOnly && item.habitKey === habitKey));
        return [...rest, next];
      });
    }
  };

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
      />

      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        currentFilter={filter}
        onSelectFilter={setFilter}
        tags={[]}
        notesCount={entries.length}
      />

      <div className="mx-auto flex min-h-screen max-w-[1800px] gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <Sidebar
          collapsed={collapsed}
          currentFilter={filter}
          onToggle={() => setCollapsed((value) => !value)}
          onSelectFilter={setFilter}
          tags={[]}
          notesCount={entries.length}
        />

        <main className="flex-1 space-y-6">
          <TopBar
            onOpenMenu={() => setMobileOpen(true)}
            noteCount={entries.length}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
            userName={session?.user?.name || session?.user?.email || "访客"}
            onLogout={() => signOut({ callbackUrl: "/login" })}
          />

          {filter === "today" && (
            <section className="glass-card rounded-[2.3rem] border border-white/60 px-8 py-8 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-foreground/40">Today</p>
                  <h1 className="font-display mt-2 text-5xl leading-none text-foreground">
                    {formatFullDate(selectedDate.toISOString())}
                  </h1>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDate((current) => shiftDate(current, -1))}
                    className="rounded-2xl border border-white/55 bg-white/60 p-2 text-foreground/70 transition hover:border-primary/30 hover:text-primary"
                    aria-label="Previous day"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(new Date())}
                    className="inline-flex items-center gap-2 rounded-full border border-white/55 bg-white/60 px-4 py-2 text-sm text-foreground/70 transition hover:border-primary/30 hover:text-primary"
                  >
                    <CalendarDays className="h-4 w-4" />
                    今天
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDate((current) => shiftDate(current, 1))}
                    className="rounded-2xl border border-white/55 bg-white/60 p-2 text-foreground/70 transition hover:border-primary/30 hover:text-primary"
                    aria-label="Next day"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveToday()}
                    disabled={isSaving}
                    className="gradient-pill inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-white shadow-soft disabled:opacity-60"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <textarea
                  value={journalText}
                  onChange={(event) => setJournalText(event.target.value)}
                  placeholder="今天想记下什么，就从这里开始写。"
                  className="min-h-[520px] w-full resize-none rounded-[2rem] border border-white/60 bg-white/45 px-6 py-5 text-base leading-8 text-foreground outline-none placeholder:text-foreground/30"
                />
              </div>
            </section>
          )}

          {filter === "home" && (
            <section className="grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
              <div>
                <DataVisualization entries={entries} habits={habitCheckins} />
              </div>

              <section className="glass-card rounded-[2rem] border border-white/60 p-5 shadow-soft">
                <div className="rounded-[1.5rem] bg-white/55 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-foreground/55">Date</p>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(new Date())}
                      className="gradient-pill rounded-full px-3 py-1 text-xs text-white"
                    >
                      今天
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedDate((current) => shiftDate(current, -1))}
                      className="rounded-full p-1.5 text-foreground/60 transition hover:bg-white/70"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <p className="text-center text-sm font-medium text-foreground">{formatEntryDate(selectedDate.toISOString())}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedDate((current) => shiftDate(current, 1))}
                      className="rounded-full p-1.5 text-foreground/60 transition hover:bg-white/70"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.5rem] bg-white/55 p-4">
                  <p className="text-sm text-foreground/55">On This Day Last Year</p>
                  {onThisDayEntry ? (
                    <>
                      <h3 className="mt-3 text-lg font-medium text-foreground">{onThisDayEntry.title || "历史日记"}</h3>
                      <p className="mt-3 text-sm leading-7 text-foreground/60">{extractPreview(onThisDayEntry.content)}</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 font-display text-2xl text-[#c995bd]">No memory</p>
                      <p className="mt-2 text-sm text-foreground/50">去年的今天还没有留下记录，等明年回来看今天吧。</p>
                    </>
                  )}
                </div>

                <div className="mt-4 rounded-[1.5rem] bg-white/55 p-4">
                  <p className="text-sm text-foreground/55">Today’s Mood</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => void handleMoodChange(level as MoodLevel)}
                        className={`rounded-full px-3 py-2 text-sm transition ${
                          selectedMood === level ? "gradient-pill text-white" : "bg-white/75 text-foreground/65 hover:bg-white"
                        }`}
                      >
                        {getMoodEmoji(level)} {getMoodLabel(level)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 rounded-[1.5rem] bg-white/55 p-4">
                  <p className="text-sm text-foreground/55">Today’s Habits</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {HABIT_DEFINITIONS.map((habit) => {
                      const completed = selectedHabitMap.get(habit.key);
                      return (
                        <button
                          key={habit.key}
                          type="button"
                          onClick={() => void toggleHabit(habit.key)}
                          className={`rounded-full px-3 py-2 text-xs transition ${
                            completed ? "gradient-pill text-white" : "bg-white/75 text-foreground/65 hover:bg-white"
                          }`}
                        >
                          {habit.icon} {habit.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            </section>
          )}

          {filter === "insights" && (
            <section className="glass-card rounded-[2.3rem] border border-white/60 px-8 py-8 shadow-soft">
              <div className="mb-6">
                <p className="text-xs uppercase tracking-[0.32em] text-foreground/40">Trends</p>
                <h2 className="font-display mt-2 text-4xl text-foreground">回顾趋势</h2>
              </div>
              <DataVisualization entries={entries} habits={habitCheckins} />
            </section>
          )}

          {filter === "settings" && (
            <section className="glass-card rounded-[2.2rem] border border-white/60 p-6 shadow-soft">
              <SettingsPanel notes={entries} onImportSuccess={(imported) => setEntries((current) => [...imported, ...current])} />
            </section>
          )}

          {(filter === "all" || filter === "home" || filter === "insights" || searchQuery.trim()) && filter !== "settings" && (
            <section className="glass-card rounded-[2.3rem] border border-white/60 px-8 py-8 shadow-soft">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-foreground/40">
                    {searchQuery.trim() ? "Search Results" : filter === "all" ? "All Entries" : "Recent Entries"}
                  </p>
                  <h3 className="font-display mt-2 text-4xl text-foreground">
                    {searchQuery.trim() ? "搜索结果" : filter === "all" ? "全部日记" : "最近日记"}
                  </h3>
                </div>
                <p className="text-sm text-foreground/55">
                  {searchQuery.trim() ? `找到 ${visibleEntries.length} 条结果` : "保留那些值得你回头再看的日子。"}
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
        </main>
      </div>
    </div>
  );
}

function shiftDate(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function extractPreview(content: string) {
  return diaryContentToPlainText(content).slice(0, 140) || "这一天有些内容被留在了这里。";
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

export default AppShell;
