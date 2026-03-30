import { sampleNotes } from "@/lib/sample-notes";
import { HabitCheckin, HabitKey, Note } from "@/lib/types";
import { extractTitle, toDateOnly } from "@/lib/utils";

function normalizeNote(note: any): Note {
  return {
    id: note.id,
    title: note.title || extractTitle(note.content),
    content: note.content,
    tags: Array.isArray(note.tags) ? note.tags : (note.tags ? note.tags.split(',').filter((tag: string) => tag.trim()) : []),
    entryDate: note.entryDate ? toDateOnly(note.entryDate) : toDateOnly(note.createdAt),
    moodLevel: typeof note.moodLevel === "number" ? note.moodLevel : undefined,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

// 当应用处于服务器端或未登录状态下，返回示例数据
export async function loadNotes(): Promise<Note[]> {
  if (typeof window === "undefined") {
    return sampleNotes;
  }

  try {
    // 尝试从API获取用户笔记
    const response = await fetch('/api/notes');

    if (!response.ok) {
      // 如果用户未登录或出现错误，返回示例数据
      if (response.status === 401) {
        // 用户未登录，提示需要登录
        console.warn('用户未登录，显示示例数据。请先登录以访问您的笔记。');
      }
      return sampleNotes;
    }

    const notes = await response.json();
    return notes.map(normalizeNote);
  } catch (error) {
    console.error('加载笔记时发生错误:', error);
    return sampleNotes;
  }
}

// 保存笔记到服务器
export async function saveNotes(notes: Note[]): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }

  try {
    // 批量保存笔记到服务器
    // 注意：在实际应用中，我们通常不会批量保存所有笔记
    // 而是在每次创建/更新/删除笔记时单独调用API
    // 这里的实现是为了兼容现有代码
  } catch (error) {
    console.error('保存笔记时发生错误:', error);
  }
}

// 创建单个日记
export async function createNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const response = await fetch('/api/notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: noteData.title || extractTitle(noteData.content),
        content: noteData.content,
        tags: noteData.tags,
        entryDate: noteData.entryDate,
        moodLevel: noteData.moodLevel,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('用户未登录');
      }
      throw new Error(`创建笔记失败: ${response.statusText}`);
    }

    const newNote = await response.json();
    return normalizeNote(newNote);
  } catch (error) {
    console.error('创建笔记时发生错误:', error);
    throw error;
  }
}

// 更新单个笔记
export async function updateNote(note: Note): Promise<Note | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const response = await fetch('/api/notes/update-delete', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: note.id,
        title: note.title || extractTitle(note.content),
        content: note.content,
        tags: note.tags,
        entryDate: note.entryDate,
        moodLevel: note.moodLevel,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('用户未登录');
      }
      throw new Error(`更新笔记失败: ${response.statusText}`);
    }

    const updatedNote = await response.json();
    return normalizeNote(updatedNote);
  } catch (error) {
    console.error('更新笔记时发生错误:', error);
    throw error;
  }
}

// 删除单个笔记
export async function deleteNote(noteId: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const response = await fetch('/api/notes/update-delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: noteId }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('用户未登录');
      }
      throw new Error(`删除笔记失败: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('删除笔记时发生错误:', error);
    throw error;
  }
}

export async function loadHabitCheckins(): Promise<HabitCheckin[]> {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const response = await fetch("/api/habits");
    if (!response.ok) {
      if (response.status === 401) {
        return [];
      }
      throw new Error(`加载打卡失败: ${response.statusText}`);
    }

    const checkins = await response.json();
    return checkins.map((item: any) => ({
      id: item.id,
      date: toDateOnly(item.date),
      habitKey: item.habitKey as HabitKey,
      completed: Boolean(item.completed),
    }));
  } catch (error) {
    console.error("加载习惯打卡时发生错误:", error);
    return [];
  }
}

export async function saveHabitCheckin(checkin: HabitCheckin): Promise<HabitCheckin | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const response = await fetch("/api/habits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkin),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("用户未登录");
      }
      throw new Error(`保存打卡失败: ${response.statusText}`);
    }

    const item = await response.json();
    return {
      id: item.id,
      date: toDateOnly(item.date),
      habitKey: item.habitKey as HabitKey,
      completed: Boolean(item.completed),
    };
  } catch (error) {
    console.error("保存习惯打卡时发生错误:", error);
    throw error;
  }
}
