import { Clock3, FilePenLine, Hash, Trash2 } from "lucide-react";
import { Note } from "@/lib/types";
import { formatDate, summarize } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

export function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  return (
    <article className="break-inside-avoid rounded-[1.7rem] border border-border/70 bg-card/85 p-5 shadow-soft backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-primary/20">
      <div className="space-y-3">
        <h3 className="break-words text-lg font-semibold leading-8 text-foreground">{note.title}</h3>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground/50">
            <Clock3 className="h-3.5 w-3.5" />
            {formatDate(note.createdAt)}
          </div>
          <button
            type="button"
            onClick={() => onEdit(note)}
            className="inline-flex rounded-xl border border-border/70 bg-background/80 p-2 text-foreground/55 transition hover:border-primary/20 hover:text-primary"
            aria-label={`Edit ${note.title}`}
          >
            <FilePenLine className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(note)}
            className="inline-flex rounded-xl border border-border/70 bg-background/80 p-2 text-foreground/50 transition hover:border-red-300/50 hover:text-red-500"
            aria-label={`Delete ${note.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-4 text-sm leading-7 text-foreground/70">{summarize(note.content, 180)}</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {note.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/75 px-3 py-1.5 text-xs text-foreground/60"
          >
            <Hash className="h-3 w-3" />
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}
