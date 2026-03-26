import { sampleNotes } from "@/lib/sample-notes";
import { Note } from "@/lib/types";

function getStorageKey(userId: string) {
  return `second-brain-notes:${userId}`;
}

export function loadNotes(userId: string): Note[] {
  if (typeof window === "undefined") {
    return sampleNotes;
  }

  const storageKey = getStorageKey(userId);
  const saved = window.localStorage.getItem(storageKey);
  if (!saved) {
    window.localStorage.setItem(storageKey, JSON.stringify(sampleNotes));
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

    window.localStorage.setItem(storageKey, JSON.stringify(sampleNotes));
    return sampleNotes;
  } catch {
    window.localStorage.setItem(storageKey, JSON.stringify(sampleNotes));
    return sampleNotes;
  }
}

export function saveNotes(userId: string, notes: Note[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(userId), JSON.stringify(notes));
}
