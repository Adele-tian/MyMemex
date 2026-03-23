"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { Note } from "@/lib/types";
import { TagSuggestion } from "@/components/tag-suggestion";
import { RichTextEditor } from "@/components/rich-text-editor";
import { extractTags } from "@/lib/utils";

interface NoteEditorModalProps {
  note: Note | null;
  open: boolean;
  onClose: () => void;
  onSave: (noteId: string, content: string) => void;
  allKnownTags?: string[];
}

export function NoteEditorModal({ note, open, onClose, onSave, allKnownTags = [] }: NoteEditorModalProps) {
  const [draft, setDraft] = useState("");
  const [isRichTextMode, setIsRichTextMode] = useState(true);

  useEffect(() => {
    if (open && note) {
      setDraft(note.content);
    }
  }, [note, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose, open]);

  if (!open || !note) {
    return null;
  }

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      return;
    }

    onSave(note.id, trimmed);
    onClose();
  };

  const handleAddTag = (tag: string) => {
    // Add the tag to the content if it's not already there
    const currentTags = extractTags(draft);
    if (!currentTags.includes(tag)) {
      setDraft(prev => `${prev} #${tag}`);
    }
  };

  const currentTags = extractTags(draft);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/35 p-3 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-3xl rounded-[2rem] border border-border/70 bg-card p-5 shadow-soft sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">Edit Note</p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{note.title}</h3>
            <p className="mt-2 text-sm text-foreground/55">
              <button
                type="button"
                onClick={() => setIsRichTextMode(!isRichTextMode)}
                className="text-primary hover:underline"
              >
                {isRichTextMode ? "切换到纯文本" : "切换到富文本"}
              </button>
              {" "} | 支持直接修改 Markdown 内容和 `#标签`。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-border/70 bg-background/80 p-2 text-foreground/60 transition hover:text-foreground"
            aria-label="Close editor"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-[1.6rem] border border-border/70 bg-background/70 p-3">
          {isRichTextMode ? (
            <RichTextEditor
              content={draft}
              onChange={setDraft}
              placeholder="在这里输入笔记内容..."
            />
          ) : (
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="min-h-[280px] w-full resize-none bg-transparent px-2 py-2 text-[15px] leading-7 text-foreground outline-none placeholder:text-foreground/35"
            />
          )}
        </div>

        <TagSuggestion
          content={draft}
          existingTags={currentTags}
          allKnownTags={allKnownTags.filter(tag => !currentTags.includes(tag))}
          onAddTag={handleAddTag}
          onRemoveTag={() => {}} // We don't need removal in the editor
        />

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-foreground/50">首行会重新作为标题，标签会从内容中的 `#tag` 自动提取。</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm font-medium text-foreground/70 transition hover:text-foreground"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              保存修改
              <Save className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
