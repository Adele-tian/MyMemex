import type { HabitCheckin, Note } from "@/lib/types";
import { createInsforgeServerClient } from "@/lib/insforge";

type NoteRow = {
  id: string;
  title: string | null;
  content: string;
  tags: string[] | string | null;
  entry_date: string;
  mood_level: number | null;
  created_at: string;
  updated_at: string;
  user_id: string;
};

type HabitCheckinRow = {
  id: string;
  date: string;
  habit_key: HabitCheckin["habitKey"];
  completed: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
};

type NoteInput = {
  title: string;
  content: string;
  tags: string[];
  entryDate: string;
  moodLevel?: number | null;
};

type AuthContext = {
  userId: string;
  accessToken: string;
};

function mapNote(row: NoteRow): Note {
  return {
    id: row.id,
    title: row.title || "未命名日记",
    content: row.content,
    tags: Array.isArray(row.tags) ? row.tags : [],
    entryDate: row.entry_date,
    moodLevel: isMoodLevel(row.mood_level) ? row.mood_level : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isMoodLevel(value: number | null): value is 1 | 2 | 3 | 4 | 5 {
  return value !== null && [1, 2, 3, 4, 5].includes(value);
}

function mapHabitCheckin(row: HabitCheckinRow): HabitCheckin {
  return {
    id: row.id,
    date: row.date,
    habitKey: row.habit_key,
    completed: Boolean(row.completed),
  };
}

function normalizeTags(tags: string[] | string | null | undefined) {
  if (Array.isArray(tags)) {
    return tags.filter(Boolean);
  }

  if (typeof tags === "string" && tags.trim()) {
    return tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function createDatabaseClient(accessToken: string) {
  return createInsforgeServerClient(accessToken).database;
}

export async function listNotes({ userId, accessToken }: AuthContext) {
  const { data, error } = await createDatabaseClient(accessToken)
    .from("notes")
    .select("id,title,content,tags,entry_date,mood_level,created_at,updated_at,user_id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data as NoteRow[] | null) ?? []).map((row) =>
    mapNote({
      ...row,
      tags: normalizeTags(row.tags),
    }),
  );
}

export async function createNote(auth: AuthContext, input: NoteInput) {
  const payload = {
    title: input.title,
    content: input.content,
    tags: input.tags,
    entry_date: input.entryDate,
    mood_level: typeof input.moodLevel === "number" ? input.moodLevel : null,
    user_id: auth.userId,
  };

  const { data, error } = await createDatabaseClient(auth.accessToken)
    .from("notes")
    .insert([payload])
    .select("id,title,content,tags,entry_date,mood_level,created_at,updated_at,user_id")
    .single();

  if (error) {
    throw error;
  }

  return mapNote({
    ...(data as NoteRow),
    tags: normalizeTags((data as NoteRow).tags),
  });
}

export async function updateNote(auth: AuthContext, noteId: string, input: NoteInput) {
  const { data, error } = await createDatabaseClient(auth.accessToken)
    .from("notes")
    .update({
      title: input.title,
      content: input.content,
      tags: input.tags,
      entry_date: input.entryDate,
      mood_level: typeof input.moodLevel === "number" ? input.moodLevel : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .eq("user_id", auth.userId)
    .select("id,title,content,tags,entry_date,mood_level,created_at,updated_at,user_id")
    .single();

  if (error) {
    throw error;
  }

  return mapNote({
    ...(data as NoteRow),
    tags: normalizeTags((data as NoteRow).tags),
  });
}

export async function deleteNote(auth: AuthContext, noteId: string) {
  const { error } = await createDatabaseClient(auth.accessToken)
    .from("notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", auth.userId);

  if (error) {
    throw error;
  }
}

export async function listHabitCheckins({ userId, accessToken }: AuthContext) {
  const { data, error } = await createDatabaseClient(accessToken)
    .from("habit_checkins")
    .select("id,date,habit_key,completed,created_at,updated_at,user_id")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .order("habit_key", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data as HabitCheckinRow[] | null) ?? []).map(mapHabitCheckin);
}

export async function upsertHabitCheckin(auth: AuthContext, checkin: HabitCheckin) {
  const payload = {
    user_id: auth.userId,
    date: checkin.date,
    habit_key: checkin.habitKey,
    completed: Boolean(checkin.completed),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await createDatabaseClient(auth.accessToken)
    .from("habit_checkins")
    .upsert([payload], {
      onConflict: "user_id,date,habit_key",
    })
    .select("id,date,habit_key,completed,created_at,updated_at,user_id")
    .single();

  if (error) {
    throw error;
  }

  return mapHabitCheckin(data as HabitCheckinRow);
}

export async function migrateNotes(auth: AuthContext, notes: Note[]) {
  let migrated = 0;
  let skipped = 0;

  for (const note of notes) {
    const { data: existing, error: existingError } = await createDatabaseClient(auth.accessToken)
      .from("notes")
      .select("id")
      .eq("id", note.id)
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing) {
      skipped += 1;
      continue;
    }

    const { error } = await createDatabaseClient(auth.accessToken)
      .from("notes")
      .insert([
        {
          id: note.id,
          title: note.title || "历史日记",
          content: note.content,
          tags: note.tags,
          entry_date: note.entryDate,
          mood_level: typeof note.moodLevel === "number" ? note.moodLevel : null,
          created_at: note.createdAt,
          updated_at: note.updatedAt,
          user_id: auth.userId,
        },
      ]);

    if (error) {
      skipped += 1;
      continue;
    }

    migrated += 1;
  }

  return {
    migrated,
    skipped,
    total: notes.length,
  };
}
