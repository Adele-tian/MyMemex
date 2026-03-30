"use client";

import { useState } from "react";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface InspirationInputProps {
  onSubmit: (content: string) => void;
}

export function InspirationInput({ onSubmit }: InspirationInputProps) {
  const [draft, setDraft] = useState("");

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    onSubmit(trimmed);
    setDraft("");
  };

  return (
    <section className="rounded-[2rem] border border-border/70 bg-card/80 p-4 shadow-soft backdrop-blur-xl sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/70 px-3 py-1 text-xs uppercase tracking-[0.22em] text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Today Entry
          </div>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">写下今天的日记</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/60">
            可以直接记录今天发生的事、你的想法，或者此刻的感受。首行会自动作为标题。
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="hidden shrink-0 items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 sm:inline-flex"
        >
          保存今天
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 rounded-[1.6rem] border border-border/70 bg-background/70 p-3">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={"今天最想记下来的是什么？\n\n比如：今天虽然有点累，但我还是坚持学了 AI，也完成了阅读计划。"}
          className="min-h-[180px] w-full resize-none bg-transparent px-2 py-2 text-[15px] leading-7 text-foreground outline-none placeholder:text-foreground/35"
        />
        <div className="mt-3 flex flex-col gap-3 border-t border-border/60 px-2 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-foreground/50">支持 Markdown，适合写短日记，也适合写长一点的反思。</div>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-white transition hover:opacity-90 sm:hidden"
          >
            保存今天
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
