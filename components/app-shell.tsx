"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Clock3, History, SquarePen, Filter, Bookmark, Calendar, X, DatabaseBackup, BarChart3, Settings } from "lucide-react";
import { DataVisualization } from "@/components/data-visualization";
import { AuthScreen } from "@/components/auth-screen";
import { EmptyState } from "@/components/empty-state";
import { ExportImportPanel } from "@/components/export-import-panel";
import { InspirationInput } from "@/components/inspiration-input";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { NoteCard } from "@/components/note-card";
import { NoteEditorModal } from "@/components/note-editor-modal";
import { SettingsPanel } from "@/components/settings-panel";
import { Sidebar } from "@/components/sidebar";
import { TagSuggestion } from "@/components/tag-suggestion";
import { ThemeProvider } from "@/components/theme-provider";
import { TopBar } from "@/components/top-bar";
import { clearSessionUser, getSessionUser, SessionUser } from "@/lib/auth";
import { sampleNotes } from "@/lib/sample-notes";
import { loadNotes, saveNotes } from "@/lib/storage";
import { Note, ViewFilter, SavedSearch } from "@/lib/types";
import { extractTags, extractTitle, suggestTags } from "@/lib/utils";
import { parseSearchQuery, performSearch, SearchOptions } from "@/lib/search-utils";

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
  const [user, setUser] = useState<SessionUser | null>(null);
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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Advanced search options
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [excludeTags, setExcludeTags] = useState<string[]>([]);

  useEffect(() => {
    const sessionUser = getSessionUser();
    setUser(sessionUser);
    setNotes(sessionUser ? loadNotes(sessionUser.id) : []);
    setHydrated(true);

    // Load saved searches from localStorage
    const saved = localStorage.getItem("mymemex-saved-searches");
    if (saved) {
      try {
        setSavedSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved searches", e);
      }
    }
  }, []);

  useEffect(() => {
    if (hydrated && user) {
      saveNotes(user.id, notes);
    }
  }, [hydrated, notes, user]);

  useEffect(() => {
    if (hydrated && user && notes.length === 0) {
      setNotes(sampleNotes);
    }
  }, [hydrated, notes, user]);

  // Save searches to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("mymemex-saved-searches", JSON.stringify(savedSearches));
  }, [savedSearches]);

  const tags = useMemo(
    () => Array.from(new Set(notes.flatMap((note) => note.tags))).sort((a, b) => a.localeCompare(b)),
    [notes],
  );

  const dailyReviewNotes = useMemo(() => getDailyReviewNotes(notes), [notes]);

  const filteredNotes = useMemo(() => {
    // If we have an active search query, use advanced search
    if (searchQuery.trim()) {
      // Prepare search options
      const searchOptions: SearchOptions = {
        query: searchQuery,
        sortBy: sortField === 'updatedAt' || sortField === 'createdAt' ? 'date' : 'relevance',
        sortOrder: sortDirection,
      };

      // Add date filters if specified
      if (dateFrom) {
        searchOptions.dateFrom = new Date(dateFrom);
      }
      if (dateTo) {
        searchOptions.dateTo = new Date(dateTo);
      }

      // Add tag filters if specified
      if (selectedTags.length > 0) {
        searchOptions.tags = selectedTags;
      }
      if (excludeTags.length > 0) {
        searchOptions.excludeTags = excludeTags;
      }

      // Perform advanced search
      const searchResults = performSearch(notes, searchOptions);
      return searchResults.map(result =>
        notes.find(note => note.id === result.noteId) as Note
      ).filter(Boolean) as Note[];
    }

    // If filter is settings, return empty array (settings view doesn't show notes)
    if (filter === "settings") {
      return [];
    }

    // If filter is visualization, return empty array (visualization view doesn't show notes)
    if (filter === "visualization") {
      return [];
    }

    // Otherwise, use the original filtering logic
    const scoped = [...notes]
      .filter((note) => {
        if (filter === "all") {
          return true;
        }

        if (filter.startsWith("tag:")) {
          const tag = filter.replace("tag:", "");
          return note.tags.includes(tag);
        }

        return true;
      });

    return scoped.sort((a, b) => {
      const left = new Date(a[sortField]).getTime();
      const right = new Date(b[sortField]).getTime();
      return sortDirection === "desc" ? right - left : left - right;
    });
  }, [filter, notes, searchQuery, sortDirection, sortField, dateFrom, dateTo, selectedTags, excludeTags]);

  const handleCreateNote = (content: string) => {
    const now = new Date().toISOString();
    const extractedTags = extractTags(content);

    // Suggest additional tags based on content
    const allKnownTags = tags.filter(tag => !extractedTags.includes(tag));
    const suggestedTags = suggestTags(content, extractedTags, allKnownTags);
    const combinedTags = Array.from(new Set([...extractedTags, ...suggestedTags.slice(0, 3)])); // Limit to 3 suggestions

    const newNote: Note = {
      id: crypto.randomUUID(),
      title: extractTitle(content),
      content,
      tags: combinedTags,
      createdAt: now,
      updatedAt: now,
    };

    setNotes((current) => [newNote, ...current]);
    setFilter("all");
    setShowCapture(true);
  };

  const handleSaveEdit = (noteId: string, content: string) => {
    const now = new Date().toISOString();
    const extractedTags = extractTags(content);

    // Suggest additional tags based on content
    const allKnownTags = tags.filter(tag => !extractedTags.includes(tag));
    const suggestedTags = suggestTags(content, extractedTags, allKnownTags);
    const combinedTags = Array.from(new Set([...extractedTags, ...suggestedTags.slice(0, 3)])); // Limit to 3 suggestions

    setNotes((current) =>
      current.map((note) =>
        note.id === noteId
          ? {
              ...note,
              title: extractTitle(content),
              content,
              tags: combinedTags,
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

  const handleSaveCurrentSearch = () => {
    if (!searchQuery.trim()) return;

    const newSavedSearch: SavedSearch = {
      id: crypto.randomUUID(),
      name: `搜索: ${searchQuery.substring(0, 30)}${searchQuery.length > 30 ? '...' : ''}`,
      query: searchQuery,
      createdAt: new Date().toISOString(),
    };

    setSavedSearches(prev => [...prev, newSavedSearch]);
  };

  const handleImportNotes = (importedNotes: Note[]) => {
    // Add imported notes to existing notes, avoiding duplicates by ID
    setNotes(currentNotes => {
      const currentIds = new Set(currentNotes.map(note => note.id));
      const newNotes = importedNotes.filter(note => !currentIds.has(note.id));

      return [...newNotes, ...currentNotes]; // New notes first
    });

    alert(`成功导入 ${importedNotes.length} 条笔记！`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setExcludeTags([]);
  };

  const handleLoadSearch = (search: SavedSearch) => {
    setSearchQuery(search.query);
  };

  const addSelectedTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeSelectedTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const addExcludedTag = (tag: string) => {
    if (!excludeTags.includes(tag)) {
      setExcludeTags([...excludeTags, tag]);
    }
  };

  const removeExcludedTag = (tag: string) => {
    setExcludeTags(excludeTags.filter(t => t !== tag));
  };

  const handleAuthenticated = (nextUser: SessionUser) => {
    setUser(nextUser);
    setNotes(loadNotes(nextUser.id));
    setFilter("all");
    setShowCapture(true);
    setSearchQuery("");
  };

  const handleLogout = () => {
    clearSessionUser();
    setUser(null);
    setNotes([]);
    setEditingNote(null);
    setSearchQuery("");
    setSelectedTags([]);
    setExcludeTags([]);
    setShowCapture(true);
    setFilter("all");
  };

  const showSortControls = !showCapture || searchQuery.trim().length > 0;
  const showDailyReview = showCapture && filter === "all" && searchQuery.trim().length === 0;

  if (hydrated && !user) {
    return (
      <div className="min-h-screen bg-paper">
        <AuthScreen onAuthenticated={handleAuthenticated} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <NoteEditorModal
        note={editingNote}
        open={Boolean(editingNote)}
        onClose={() => setEditingNote(null)}
        onSave={handleSaveEdit}
        allKnownTags={tags}
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
          {filter !== "settings" && filter !== "visualization" && (
            <TopBar
              onOpenMenu={() => setMobileOpen(true)}
              noteCount={notes.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onClearSearch={handleClearSearch}
              userName={user?.name ?? "访客"}
              onLogout={handleLogout}
            />
          )}

          <div className="mt-6 space-y-6">
            {(showCapture && filter !== "visualization") && <InspirationInput onSubmit={handleCreateNote} />}

            {showDailyReview && dailyReviewNotes.length > 0 && (
              <section>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">Today Review</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">今日回顾</h3>
                  </div>
                  <p className="text-sm text-foreground/55">
                    从旧笔记里自动挑选 3 条内容，帮助你在首页快速回顾重点。
                  </p>
                </div>

                <div className="columns-1 gap-4 space-y-4 md:columns-2 xl:columns-3">
                  {dailyReviewNotes.map((note) => (
                    <NoteCard
                      key={`review-${note.id}`}
                      note={note}
                      onEdit={setEditingNote}
                      onDelete={handleDeleteNote}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Show Settings Panel when filter is "settings" */}
            {filter === "settings" && (
              <section>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">SETTINGS</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">设置</h3>
                  </div>
                </div>

                <SettingsPanel
                  notes={notes}
                  onImportSuccess={handleImportNotes}
                />
              </section>
            )}

            {/* Show Data Visualization when filter is "visualization" */}
            {filter === "visualization" && (
              <section>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">DATA ANALYTICS</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">数据可视化</h3>
                  </div>
                </div>
                <DataVisualization notes={notes} />
              </section>
            )}

            {/* Show Knowledge Stream section only when not in settings or visualization view */}
            {filter !== "settings" && filter !== "visualization" && (
              <section>
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">Knowledge Stream</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                      {filter === "all" && "全部卡片"}
                      {filter.startsWith("tag:") && `#${filter.replace("tag:", "")}`}
                      {searchQuery.trim() && `搜索结果: ${searchQuery}`}
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
                        <button
                          type="button"
                          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                            showAdvancedFilters
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : "border-border/70 bg-card/70 text-foreground/65 hover:text-foreground"
                          }`}
                        >
                          <Filter className="h-4 w-4" />
                          高级筛选
                        </button>
                        {searchQuery.trim() && (
                          <button
                            type="button"
                            onClick={handleSaveCurrentSearch}
                            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-2 text-sm text-foreground/65 transition hover:text-foreground"
                          >
                            <Bookmark className="h-4 w-4" />
                            保存搜索
                          </button>
                        )}
                      </div>

                      {/* Advanced Filters Panel */}
                      {showAdvancedFilters && (
                        <div className="mt-3 p-4 rounded-xl border border-border/70 bg-card/70">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground/80 mb-1">开始日期</label>
                              <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/35"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground/80 mb-1">结束日期</label>
                              <input
                                  type="date"
                                  value={dateTo}
                                  onChange={(e) => setDateTo(e.target.value)}
                                  className="w-full rounded-lg border border-border/70 bg-background/80 px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground/35"
                                />
                            </div>
                          </div>

                          <div className="mb-4">
                            <label className="block text-sm font-medium text-foreground/80 mb-1">包含标签</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {tags.map(tag => (
                                <button
                                  key={`include-${tag}`}
                                  type="button"
                                  onClick={() => addSelectedTag(tag)}
                                  className={`px-3 py-1 rounded-full text-xs ${
                                    selectedTags.includes(tag)
                                      ? 'bg-primary text-white'
                                      : 'bg-border/30 text-foreground/70 hover:bg-border/50'
                                  }`}
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {selectedTags.map(tag => (
                                <span key={`sel-${tag}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-white text-xs">
                                  #{tag}
                                  <button
                                    type="button"
                                    onClick={() => removeSelectedTag(tag)}
                                    className="ml-1"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground/80 mb-1">排除标签</label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {tags.map(tag => (
                                <button
                                  key={`exclude-${tag}`}
                                  type="button"
                                  onClick={() => addExcludedTag(tag)}
                                  className={`px-3 py-1 rounded-full text-xs ${
                                    excludeTags.includes(tag)
                                      ? 'bg-destructive text-white'
                                      : 'bg-border/30 text-foreground/70 hover:bg-border/50'
                                  }`}
                                >
                                  #{tag}
                                </button>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {excludeTags.map(tag => (
                                <span key={`exc-${tag}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-destructive text-white text-xs">
                                  #{tag}
                                  <button
                                    type="button"
                                    onClick={() => removeExcludedTag(tag)}
                                    className="ml-1"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end mt-4">
                            <button
                              type="button"
                              onClick={() => {
                                setDateFrom("");
                                setDateTo("");
                                setSelectedTags([]);
                                setExcludeTags([]);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-border/70 text-sm text-foreground/70 hover:bg-card/50"
                            >
                              清空筛选条件
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Saved Searches */}
                      {savedSearches.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="text-sm text-foreground/60">保存的搜索:</span>
                          {savedSearches.map(search => (
                            <button
                              key={search.id}
                              type="button"
                              onClick={() => handleLoadSearch(search)}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {search.name}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="text-sm text-foreground/60 hover:text-foreground"
                        >
                          清空搜索
                        </button>
                        <span className="text-sm text-foreground/55">
                          {searchQuery.trim()
                            ? `找到 ${filteredNotes.length} 条结果`
                            : "浏览历史笔记，并按创建或修改时间切换排序。"}
                        </span>
                      </div>
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
            )}
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
