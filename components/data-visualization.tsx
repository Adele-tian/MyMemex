import { Note } from "@/lib/types";
import { calculateAnalytics, getStatisticsSummary, TagFrequency } from "@/lib/analytics-utils";

interface DataVisualizationProps {
  notes: Note[];
}

export function DataVisualization({ notes }: DataVisualizationProps) {
  if (notes.length === 0) {
    return (
      <div className="rounded-xl border border-border/70 bg-card/70 p-6 text-center">
        <p className="text-foreground/60">暂无数据可显示，请先添加一些笔记。</p>
      </div>
    );
  }

  const analytics = calculateAnalytics(notes);
  const summary = getStatisticsSummary(notes);

  // Prepare data for tag frequency chart (top 10)
  const topTags: TagFrequency[] = analytics.tagFrequency.slice(0, 10);

  // Find max count for scaling
  const maxTagCount = topTags.length > 0 ? Math.max(...topTags.map(t => t.count)) : 1;

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <p className="text-sm text-foreground/60">总笔记数</p>
          <p className="text-2xl font-bold text-foreground mt-1">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <p className="text-sm text-foreground/60">本周新增</p>
          <p className="text-2xl font-bold text-foreground mt-1">{summary.createdThisWeek}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <p className="text-sm text-foreground/60">本月新增</p>
          <p className="text-2xl font-bold text-foreground mt-1">{summary.createdThisMonth}</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <p className="text-sm text-foreground/60">最常用标签</p>
          <p className="text-lg font-bold text-foreground mt-1 truncate">
            {summary.mostUsedTag || '无'}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity Visualization */}
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <h3 className="text-lg font-semibold mb-4">最近30天活动</h3>
          {analytics.dailyActivity.length > 0 ? (
            <div className="space-y-2">
              {analytics.dailyActivity.slice(-30).map((activity, index) => {
                // Calculate percentage for bar width
                const maxCount = Math.max(...analytics.dailyActivity.map(a => a.count));
                const percentage = maxCount > 0 ? (activity.count / maxCount) * 100 : 0;

                return (
                  <div key={index} className="flex items-center">
                    <span className="w-16 text-xs text-foreground/70">{activity.date.split('-').pop()}</span>
                    <div className="flex-1 ml-2">
                      <div className="h-4 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="w-8 text-right text-xs text-foreground/70">{activity.count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-foreground/60 text-center py-4">暂无最近活动数据</p>
          )}
        </div>

        {/* Top Tags Visualization */}
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <h3 className="text-lg font-semibold mb-4">标签频率 Top 10</h3>
          {topTags.length > 0 ? (
            <div className="space-y-3">
              {topTags.map((tag, index) => {
                const percentage = (tag.count / maxTagCount) * 100;

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground/80">#{tag.tag}</span>
                      <span className="text-foreground/60">{tag.count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-foreground/60 text-center py-4">暂无标签数据</p>
          )}
        </div>
      </div>

      {/* Monthly Stats */}
      {analytics.monthlyStats.length > 0 && (
        <div className="rounded-xl border border-border/70 bg-card/70 p-4">
          <h3 className="text-lg font-semibold mb-4">月度统计</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="pb-2 text-left text-foreground/70">月份</th>
                  <th className="pb-2 text-right text-foreground/70">新增笔记</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyStats.map((stat, index) => (
                  <tr key={index} className="border-b border-border/20 last:border-0">
                    <td className="py-3 text-foreground">{stat.month}</td>
                    <td className="py-3 text-right text-foreground">{stat.created}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}