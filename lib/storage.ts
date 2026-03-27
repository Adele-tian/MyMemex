import { sampleNotes } from "@/lib/sample-notes";
import { Note } from "@/lib/types";

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
    return notes.map((note: any) => ({
      id: note.id,
      title: note.title,
      content: note.content,
      tags: Array.isArray(note.tags) ? note.tags : (note.tags ? note.tags.split(',').filter((tag: string) => tag.trim()) : []),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));
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

// 创建单个笔记
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
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('用户未登录');
      }
      throw new Error(`创建笔记失败: ${response.statusText}`);
    }

    const newNote = await response.json();
    return {
      id: newNote.id,
      title: newNote.title,
      content: newNote.content,
      tags: Array.isArray(newNote.tags) ? newNote.tags : (newNote.tags ? newNote.tags.split(',').filter((tag: string) => tag.trim()) : []),
      createdAt: newNote.createdAt,
      updatedAt: newNote.updatedAt,
    };
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
        title: note.title,
        content: note.content,
        tags: note.tags,
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('用户未登录');
      }
      throw new Error(`更新笔记失败: ${response.statusText}`);
    }

    const updatedNote = await response.json();
    return {
      id: updatedNote.id,
      title: updatedNote.title,
      content: updatedNote.content,
      tags: Array.isArray(updatedNote.tags) ? updatedNote.tags : (updatedNote.tags ? updatedNote.tags.split(',').filter((tag: string) => tag.trim()) : []),
      createdAt: updatedNote.createdAt,
      updatedAt: updatedNote.updatedAt,
    };
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
