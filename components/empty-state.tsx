import { NotebookTabs } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/70 bg-card/60 px-6 py-10 text-center">
      <div className="rounded-3xl bg-muted p-4 text-primary">
        <NotebookTabs className="h-8 w-8" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-foreground">这里还没有匹配的知识卡片</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-foreground/55">
        试试切换筛选条件，或者直接在上方输入框写下一条新的灵感。
      </p>
    </div>
  );
}
