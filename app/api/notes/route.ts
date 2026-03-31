import { NextRequest } from 'next/server';
import { createNote, listNotes } from '@/lib/insforge-db';
import { getServerAuthContext } from '@/lib/server-auth';

// 获取当前用户的笔记
export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthContext(request);

    if (!auth) {
      return new Response('Unauthorized', { status: 401 });
    }

    const notes = await listNotes(auth);

    return new Response(JSON.stringify(notes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('获取笔记时发生错误:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// 创建新笔记
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthContext(request);

    if (!auth) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { title, content, tags, entryDate, moodLevel } = await request.json();

    const newNote = await createNote(auth, {
      title,
      content,
      tags: Array.isArray(tags) ? tags : [],
      entryDate: entryDate || new Date().toISOString().slice(0, 10),
      moodLevel: typeof moodLevel === "number" ? moodLevel : null,
    });

    return new Response(JSON.stringify(newNote), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('创建笔记时发生错误:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
