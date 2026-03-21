import { sampleNotes } from "@/lib/sample-notes";
import { Note } from "@/lib/types";

const STORAGE_KEY = "second-brain-notes";

export function loadNotes(): Note[] {
  if (typeof window === "undefined") {
    return sampleNotes;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleNotes));
    return sampleNotes;
  }

  try {
    const parsed = JSON.parse(saved) as Note[];
    const normalized = parsed.map((note) => ({
      ...note,
      updatedAt: note.updatedAt ?? note.createdAt,
    }));
    if (normalized.length > 0) {
      return normalized;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleNotes));
    return sampleNotes;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleNotes));
    return sampleNotes;
  }
}

export function saveNotes(notes: Note[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}
