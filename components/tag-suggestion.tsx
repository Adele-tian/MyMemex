import { suggestTags } from "@/lib/utils";
import { PlusCircle } from "lucide-react";

interface TagSuggestionProps {
  content: string;
  existingTags: string[];
  allKnownTags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  disabled?: boolean;
}

export function TagSuggestion({
  content,
  existingTags,
  allKnownTags,
  onAddTag,
  onRemoveTag,
  disabled = false
}: TagSuggestionProps) {
  // Generate tag suggestions based on content
  const suggestedTags = content
    ? suggestTags(content, existingTags, allKnownTags).slice(0, 5)
    : [];

  if (suggestedTags.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-border/30">
      <p className="text-xs uppercase tracking-wide text-foreground/60 mb-2">推荐标签</p>
      <div className="flex flex-wrap gap-2">
        {suggestedTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/70 px-2.5 py-1.5 text-xs text-foreground/70 transition hover:border-primary/30 hover:text-primary disabled:opacity-50"
            onClick={() => onAddTag(tag)}
            disabled={disabled}
          >
            <PlusCircle className="h-3 w-3" />
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}