export type ViewFilter = "home" | "today" | "all" | "insights" | "settings";

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  createdAt: string;
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export type HabitKey = "sleep" | "learn_ai" | "exercise" | "reading";

export interface HabitDefinition {
  key: HabitKey;
  label: string;
  icon: string;
}

export interface HabitCheckin {
  id?: string;
  date: string;
  habitKey: HabitKey;
  completed: boolean;
}

export interface DiaryEntry {
  id: string;
  title?: string;
  content: string;
  tags: string[];
  entryDate: string;
  moodLevel?: MoodLevel;
  createdAt: string;
  updatedAt: string;
}

export type Note = DiaryEntry;

export const HABIT_DEFINITIONS: HabitDefinition[] = [
  { key: "sleep", label: "早睡", icon: "🌙" },
  { key: "learn_ai", label: "学习 AI", icon: "🤖" },
  { key: "exercise", label: "运动", icon: "🏃" },
  { key: "reading", label: "阅读", icon: "📚" },
];
