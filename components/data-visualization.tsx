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
  const monthlyDates = getRecentDates(30);

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

  const currentStreak = (() => {
    let streak = 0;
    for (let i = monthlyDates.length - 1; i >= 0; i -= 1) {
      const date = monthlyDates[i];
      const hasEntry = entries.some((entry) => entry.entryDate === date);
      if (hasEntry) {
        streak += 1;
      } else {
        break;
      }
    }
    return streak;
  })();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="日记总数" value={`${entries.length}`} />
        <StatCard label="连续记录" value={`${currentStreak} 天`} />
        <StatCard label="最近7天心情" value={`${dailyMoodSeries.filter((item) => item.level).length} 天`} />
        <StatCard
          label="本月打卡"
          value={`${habits.filter((item) => item.completed && monthlyDates.includes(item.date)).length} 次`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[1.7rem] border border-border/70 bg-card/80 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">Mood Rhythm</p>
              <h3 className="mt-2 text-xl font-semibold text-foreground">最近 7 天情绪周期</h3>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-3">
            {dailyMoodSeries.map((item) => {
              const height = item.level ? `${28 + item.level * 12}px` : "20px";
              return (
                <div key={item.date} className="flex flex-col items-center gap-2">
                  <div className="flex h-36 items-end">
                    <div
                      className={`w-8 rounded-full transition ${
                        item.level ? "bg-primary" : "bg-muted"
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

        <section className="rounded-[1.7rem] border border-border/70 bg-card/80 p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">Habit Rhythm</p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">最近 30 天习惯打卡</h3>

          <div className="mt-5 space-y-4">
            {HABIT_DEFINITIONS.map((habit) => (
              <div key={habit.key}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {habit.icon} {habit.label}
                  </span>
                  <span className="text-xs text-foreground/55">
                    {monthlyDates.filter((date) => habitMap.get(`${date}-${habit.key}`)).length} / 30
                  </span>
                </div>
                <div className="grid grid-cols-10 gap-1">
                  {monthlyDates.map((date) => {
                    const completed = habitMap.get(`${date}-${habit.key}`);
                    return (
                      <div
                        key={`${habit.key}-${date}`}
                        className={`h-5 rounded-md ${
                          completed ? "bg-primary" : "bg-muted"
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
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-border/70 bg-card/80 p-4 shadow-soft">
      <p className="text-sm text-foreground/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
