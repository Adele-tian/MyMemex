import { DiaryEntry, HABIT_DEFINITIONS, HabitCheckin } from "@/lib/types";
import { getMoodEmoji, getMoodLabel, toDateOnly } from "@/lib/utils";

interface DataVisualizationProps {
  entries: DiaryEntry[];
  habits: HabitCheckin[];
}

function getRecentDates(days: number) {
  const dates: string[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const next = new Date(now);
    next.setDate(now.getDate() - i);
    dates.push(toDateOnly(next));
  }

  return dates;
}

export function DataVisualization({ entries, habits }: DataVisualizationProps) {
  const recentDates = getRecentDates(7);
  const extendedDates = getRecentDates(56);

  const moodByDate = new Map<string, number>();
  for (const entry of entries) {
    if (entry.moodLevel) {
      const key = entry.entryDate;
      const current = moodByDate.get(key);
      if (!current || current < entry.moodLevel) {
        moodByDate.set(key, entry.moodLevel);
      }
    }
  }

  const dailyMoodSeries = recentDates.map((date) => ({
    date,
    level: moodByDate.get(date),
  }));

  const habitMap = new Map<string, boolean>();
  for (const item of habits) {
    habitMap.set(`${item.date}-${item.habitKey}`, item.completed);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_1fr]">
      <section className="glass-card rounded-[2rem] border border-white/60 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-foreground/45">Mood Trends</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">最近情绪周期</h3>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-[#f9d2e7] px-3 py-1 text-[#9a628a]">7 Days</span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-foreground/55">30 Days</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-7 gap-3">
          {dailyMoodSeries.map((item) => {
            const height = item.level ? `${28 + item.level * 12}px` : "20px";
            return (
              <div key={item.date} className="flex flex-col items-center gap-2">
                <div className="flex h-36 items-end">
                  <div
                    className={`w-8 rounded-t-2xl transition ${
                      item.level ? "bg-gradient-to-b from-[#f7bfd6] to-[#ca94ff]" : "bg-white/65"
                    }`}
                    style={{ height }}
                    title={item.level ? `${getMoodEmoji(item.level)} ${getMoodLabel(item.level)}` : "未记录"}
                  />
                </div>
                <div className="text-center">
                  <div className="text-lg">{getMoodEmoji(item.level)}</div>
                  <div className="text-xs text-foreground/55">{item.date.slice(5)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass-card rounded-[2rem] border border-white/60 p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-foreground/45">Habit Heatmap</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">最近习惯打卡</h3>
          </div>
          <div className="flex gap-2 text-xs">
            <span className="rounded-full bg-[#f9d2e7] px-3 py-1 text-[#9a628a]">4 Weeks</span>
            <span className="rounded-full bg-white/70 px-3 py-1 text-foreground/55">8 Weeks</span>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {HABIT_DEFINITIONS.map((habit) => (
            <div key={habit.key}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {habit.icon} {habit.label}
                </span>
                <span className="text-xs text-foreground/55">
                  {extendedDates.filter((date) => habitMap.get(`${date}-${habit.key}`)).length} / 56
                </span>
              </div>
              <div className="grid grid-cols-8 gap-1.5">
                {extendedDates.map((date) => {
                  const completed = habitMap.get(`${date}-${habit.key}`);
                  return (
                    <div
                      key={`${habit.key}-${date}`}
                      className={`h-6 rounded-md ${
                        completed ? "bg-gradient-to-br from-[#ffe8ac] to-[#e5a5ff]" : "bg-white/65"
                      }`}
                      title={`${habit.label} ${date} ${completed ? "已完成" : "未完成"}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
