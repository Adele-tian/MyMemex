import { Note } from "@/lib/types";

// Define analytics data structures
export interface NoteAnalytics {
  totalNotes: number;
  dailyActivity: DailyActivity[];
  tagFrequency: TagFrequency[];
  monthlyStats: MonthlyStats[];
  weeklyStats: WeeklyStats[];
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  count: number;
}

export interface TagFrequency {
  tag: string;
  count: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  created: number;
  updated: number;
}

export interface WeeklyStats {
  week: string; // YYYY-Www (ISO week)
  created: number;
  updated: number;
}

/**
 * Calculate comprehensive analytics from notes
 */
export function calculateAnalytics(notes: Note[]): NoteAnalytics {
  // Calculate total notes
  const totalNotes = notes.length;

  // Calculate daily activity
  const dailyActivityMap: Record<string, number> = {};
  const monthlyStatsMap: Record<string, { created: number; updated: number }> = {};
  const tagFrequencyMap: Record<string, number> = {};

  notes.forEach(note => {
    // Count daily activity by creation date
    const creationDate = new Date(note.createdAt).toISOString().split('T')[0];
    dailyActivityMap[creationDate] = (dailyActivityMap[creationDate] || 0) + 1;

    // Count monthly stats
    const month = note.createdAt.substring(0, 7); // YYYY-MM
    if (!monthlyStatsMap[month]) {
      monthlyStatsMap[month] = { created: 0, updated: 0 };
    }
    monthlyStatsMap[month].created++;

    // Count tag frequencies
    note.tags.forEach(tag => {
      tagFrequencyMap[tag] = (tagFrequencyMap[tag] || 0) + 1;
    });
  });

  // Convert maps to arrays
  const dailyActivity: DailyActivity[] = Object.entries(dailyActivityMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const tagFrequency: TagFrequency[] = Object.entries(tagFrequencyMap)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  const monthlyStats: MonthlyStats[] = Object.entries(monthlyStatsMap)
    .map(([month, stats]) => ({ month, ...stats }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Calculate weekly stats
  const weeklyStatsMap: Record<string, { created: number; updated: number }> = {};
  notes.forEach(note => {
    const date = new Date(note.createdAt);
    const week = getISOWeek(date);
    const weekStr = `${date.getFullYear()}-W${week.toString().padStart(2, '0')}`;

    if (!weeklyStatsMap[weekStr]) {
      weeklyStatsMap[weekStr] = { created: 0, updated: 0 };
    }
    weeklyStatsMap[weekStr].created++;
  });

  const weeklyStats: WeeklyStats[] = Object.entries(weeklyStatsMap)
    .map(([week, stats]) => ({ week, ...stats }))
    .sort((a, b) => a.week.localeCompare(b.week));

  return {
    totalNotes,
    dailyActivity,
    tagFrequency,
    monthlyStats,
    weeklyStats
  };
}

/**
 * Get ISO week number for a date
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get statistics summary
 */
export function getStatisticsSummary(notes: Note[]): {
  total: number;
  createdThisWeek: number;
  createdThisMonth: number;
  mostUsedTag: string | null;
  averageNoteLength: number;
} {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let createdThisWeek = 0;
  let createdThisMonth = 0;
  let totalLength = 0;

  const tagCounts: Record<string, number> = {};

  notes.forEach(note => {
    const noteDate = new Date(note.createdAt);

    if (noteDate >= oneWeekAgo) {
      createdThisWeek++;
    }
    if (noteDate >= oneMonthAgo) {
      createdThisMonth++;
    }

    totalLength += note.content.length;

    note.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  // Find most used tag
  let mostUsedTag: string | null = null;
  let maxCount = 0;
  for (const [tag, count] of Object.entries(tagCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostUsedTag = tag;
    }
  }

  const averageNoteLength = notes.length > 0 ? totalLength / notes.length : 0;

  return {
    total: notes.length,
    createdThisWeek,
    createdThisMonth,
    mostUsedTag,
    averageNoteLength
  };
}