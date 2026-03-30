"use client";

import { useEffect, useMemo, useState } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Heart,
  NotebookPen,
  Save,
  Sparkles,
  Sunrise,
} from "lucide-react";
import { DataVisualization } from "@/components/data-visualization";
import { EmptyState } from "@/components/empty-state";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { NoteCard } from "@/components/note-card";
import { NoteEditorModal } from "@/components/note-editor-modal";
import { SettingsPanel } from "@/components/settings-panel";
import { Sidebar } from "@/components/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { TopBar } from "@/components/top-bar";
import {
  DiaryEntry,
  HABIT_DEFINITIONS,
  HabitCheckin,
  MoodLevel,
  Note,
  ViewFilter,
} from "@/lib/types";
import { createNote, deleteNote, loadHabitCheckins, loadNotes, saveHabitCheckin, updateNote } from "@/lib/storage";
import {
  extractTitle,
  type DiarySections,
  formatEntryDate,
  formatFullDate,
  getMoodEmoji,
  getMoodLabel,
  parseDiarySections,
  serializeDiarySections,
  toDateOnly,
} from "@/lib/utils";

const EMPTY_SECTIONS: DiarySections = {
  events: "",
  moodNote: "",
  reflection: "",
  tomorrow: "",
  photoNote: "",
  habitsNote: "",
};

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
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [journalSections, setJournalSections] = useState<DiarySections>(EMPTY_SECTIONS);
  const [isSavingSections, setIsSavingSections] = useState(false);

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
      setJournalSections(EMPTY_SECTIONS);
      return;
    }

    setJournalSections(parseDiarySections(selectedPrimaryEntry.content));
  }, [selectedPrimaryEntry]);

  const visibleEntries = useMemo(() => {
    let scoped = [...entries];

    if (filter === "today") {
      scoped = scoped.filter((entry) => entry.entryDate === today);
    } else if (filter === "home") {
      scoped = scoped.filter((entry) => entry.entryDate !== selectedDateOnly).slice(0, 6);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      scoped = scoped.filter((entry) =>
        [entry.title, entry.content, entry.entryDate, ...entry.tags].filter(Boolean).join(" ").toLowerCase().includes(query),
      );
    }

    return scoped.sort((a, b) => `${b.entryDate}${b.createdAt}`.localeCompare(`${a.entryDate}${a.createdAt}`));
  }, [entries, filter, searchQuery, selectedDateOnly, today]);

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

  const calendarDays = useMemo(() => buildCalendarDays(selectedDate), [selectedDate]);

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

  async function handleSaveSections() {
    setIsSavingSections(true);
    const content = serializeDiarySections(journalSections);
    const title = extractTitle(journalSections.events || journalSections.reflection || "今天的日记");

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
      setIsSavingSections(false);
    }
  }

  const handleSaveEdit = async (entryId: string, content: string) => {
    const current = entries.find((entry) => entry.id === entryId);
    if (!current) {
      return;
    }

    const updated = await updateNote({
      ...current,
      title: extractTitle(content),
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
      title: "今天的心情记录",
      content: serializeDiarySections(journalSections),
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
            onSearchChange={setSearchQuery}
            onClearSearch={() => setSearchQuery("")}
            userName={session?.user?.name || session?.user?.email || "访客"}
            onLogout={() => signOut({ callbackUrl: "/login" })}
          />

          {(filter === "home" || filter === "today" || filter === "insights") && (
            <section className="glass-card rounded-[2.3rem] border border-white/60 px-8 py-10 shadow-soft">
              <div className="text-center">
                <h1 className="font-display text-6xl leading-none text-[#d29ac5] sm:text-7xl">Journal</h1>
                <p className="mt-3 text-sm uppercase tracking-[0.38em] text-foreground/45">Daily Reflections</p>
              </div>

              <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.35fr_1fr]">
                <section className="glass-card rounded-[1.9rem] border border-white/60 p-5 shadow-soft">
                  <div className="flex items-center justify-between text-foreground/55">
                    <p className="text-sm">Calendar</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                        className="rounded-full p-1 hover:bg-white/70"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                        className="rounded-full p-1 hover:bg-white/70"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 text-center font-medium text-foreground">
                    {selectedDate.toLocaleString("en-US", { month: "short", year: "numeric" })}
                  </p>

                  <div className="mt-4 grid grid-cols-7 gap-2 text-center text-xs text-foreground/40">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                      <span key={day}>{day}</span>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => {
                      if (!day.date) {
                        return <div key={day.key} className="h-9" />;
                      }

                      const hasEntry = entries.some((entry) => entry.entryDate === day.date);
                      const isSelected = day.date === selectedDateOnly;
                      const isToday = day.date === today;

                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => setSelectedDate(new Date(`${day.date}T12:00:00`))}
                          className={`h-9 rounded-2xl text-sm transition ${
                            isSelected
                              ? "gradient-pill text-white"
                              : hasEntry
                                ? "bg-[#fdf0f6] text-[#a1698f] hover:bg-[#f7d8ea]"
                                : "bg-white/45 text-foreground/55 hover:bg-white/70"
                          } ${isToday && !isSelected ? "ring-1 ring-[#f1bed8]" : ""}`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedDate(new Date())}
                    className="gradient-pill mt-6 w-full rounded-full px-4 py-2 text-sm text-white shadow-soft"
                  >
                    Back to Today
                  </button>
                </section>

                <section className="glass-card rounded-[1.9rem] border border-white/60 p-5 shadow-soft">
                  <DataVisualization entries={entries} habits={habitCheckins} />
                </section>

                <section className="glass-card rounded-[1.9rem] border border-white/60 p-5 shadow-soft">
                  <p className="text-sm text-foreground/55">On This Day Last Year</p>
                  <div className="mt-4 rounded-[1.5rem] bg-white/55 p-4">
                    {onThisDayEntry ? (
                      <>
                        <p className="text-sm text-foreground/45">{formatEntryDate(onThisDayEntry.entryDate)}</p>
                        <h3 className="mt-2 text-lg font-medium text-foreground">{onThisDayEntry.title || "历史日记"}</h3>
                        <p className="mt-3 text-sm leading-7 text-foreground/60">{extractPreview(onThisDayEntry.content)}</p>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-2xl text-[#c995bd]">No memory</p>
                        <p className="mt-3 text-sm text-foreground/50">去年的今天还没有留下记录，等明年回来看今天吧。</p>
                      </>
                    )}
                  </div>

                  <div className="mt-6 rounded-[1.5rem] bg-white/55 p-4">
                    <p className="text-sm text-foreground/55">Today’s Mood</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => void handleMoodChange(level as MoodLevel)}
                          className={`rounded-full px-3 py-2 text-sm transition ${
                            selectedMood === level
                              ? "gradient-pill text-white"
                              : "bg-white/75 text-foreground/65 hover:bg-white"
                          }`}
                        >
                          {getMoodEmoji(level)} {getMoodLabel(level)}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </section>
          )}

          {filter !== "settings" && (
            <section className="glass-card rounded-[2.3rem] border border-white/60 px-8 py-10 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setFilter("home")}
                  className="text-sm text-foreground/55 transition hover:text-foreground"
                >
                  ← Back
                </button>
                <div className="text-center">
                  <p className="font-display text-5xl leading-none text-foreground">{formatFullDate(selectedDate.toISOString())}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.32em] text-foreground/40">Daily Notes</p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleSaveSections()}
                  disabled={isSavingSections}
                  className="gradient-pill inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-white shadow-soft disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {isSavingSections ? "Saving..." : "Save"}
                </button>
              </div>

              <div className="mt-10 grid gap-4 lg:grid-cols-3">
                <JournalCard
                  icon={<NotebookPen className="h-5 w-5" />}
                  title="Events"
                  subtitle="Tap to write..."
                  value={journalSections.events}
                  onChange={(value) => setJournalSections((current: DiarySections) => ({ ...current, events: value }))}
                />
                <JournalCard
                  icon={<Heart className="h-5 w-5" />}
                  title="Mood"
                  subtitle="Rate your mood..."
                  value={journalSections.moodNote}
                  onChange={(value) => setJournalSections((current: DiarySections) => ({ ...current, moodNote: value }))}
                />
                <JournalCard
                  icon={<Sparkles className="h-5 w-5" />}
                  title="Reflection"
                  subtitle="Tap to write..."
                  value={journalSections.reflection}
                  onChange={(value) => setJournalSections((current: DiarySections) => ({ ...current, reflection: value }))}
                />
                <JournalCard
                  icon={<Sunrise className="h-5 w-5" />}
                  title="Tomorrow"
                  subtitle="Tap to write..."
                  value={journalSections.tomorrow}
                  onChange={(value) => setJournalSections((current: DiarySections) => ({ ...current, tomorrow: value }))}
                />
                <JournalCard
                  icon={<Camera className="h-5 w-5" />}
                  title="Photos"
                  subtitle="Add photos..."
                  value={journalSections.photoNote}
                  onChange={(value) => setJournalSections((current: DiarySections) => ({ ...current, photoNote: value }))}
                />
                <JournalCard
                  icon={<CircleDot className="h-5 w-5" />}
                  title="Habits"
                  subtitle={`${Array.from(selectedHabitMap.values()).filter(Boolean).length} / ${HABIT_DEFINITIONS.length} completed`}
                  value={journalSections.habitsNote}
                  onChange={(value) => setJournalSections((current: DiarySections) => ({ ...current, habitsNote: value }))}
                >
                  <div className="mt-4 flex flex-wrap gap-2">
                    {HABIT_DEFINITIONS.map((habit) => {
                      const completed = selectedHabitMap.get(habit.key);
                      return (
                        <button
                          key={habit.key}
                          type="button"
                          onClick={() => void toggleHabit(habit.key)}
                          className={`rounded-full px-3 py-2 text-xs transition ${
                            completed ? "gradient-pill text-white" : "bg-white/70 text-foreground/65"
                          }`}
                        >
                          {habit.icon} {habit.label}
                        </button>
                      );
                    })}
                  </div>
                </JournalCard>
              </div>
            </section>
          )}

          {filter === "settings" && (
            <section className="glass-card rounded-[2.2rem] border border-white/60 p-6 shadow-soft">
              <SettingsPanel notes={entries} onImportSuccess={(imported) => setEntries((current) => [...imported, ...current])} />
            </section>
          )}

          {filter !== "settings" && (
            <section className="glass-card rounded-[2.3rem] border border-white/60 px-8 py-8 shadow-soft">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-foreground/40">
                    {filter === "today" ? "Today Entries" : filter === "all" ? "All Entries" : "Recent Entries"}
                  </p>
                  <h3 className="font-display mt-2 text-4xl text-foreground">
                    {filter === "today" ? "Today" : filter === "all" ? "Archive" : "Recent"}
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

function JournalCard({
  icon,
  title,
  subtitle,
  value,
  onChange,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
  onChange: (value: string) => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="glass-card min-h-[220px] rounded-[1.8rem] border border-white/60 p-5 shadow-soft">
      <div className="flex h-full flex-col">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffd5c8] to-[#efc4ff] text-[#8d6282]">
          {icon}
        </div>
        <h4 className="mt-4 text-lg font-medium text-foreground">{title}</h4>
        <p className="mt-1 text-sm text-foreground/45">{subtitle}</p>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-4 min-h-[80px] flex-1 resize-none bg-transparent text-sm leading-7 text-foreground outline-none placeholder:text-foreground/28"
          placeholder="Tap to write..."
        />
        {children}
      </div>
    </div>
  );
}

function buildCalendarDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Array<{ key: string; date?: string; label?: number }> = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    days.push({ key: `empty-${i}` });
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    const current = new Date(year, month, day);
    days.push({
      key: toDateOnly(current),
      date: toDateOnly(current),
      label: day,
    });
  }

  while (days.length % 7 !== 0) {
    days.push({ key: `tail-${days.length}` });
  }

  return days;
}

function extractPreview(content: string) {
  const sections = parseDiarySections(content);
  return [sections.events, sections.reflection, sections.moodNote].filter(Boolean).join(" ").slice(0, 140) || "这一天有些内容被留在了这里。";
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
