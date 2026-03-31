import { NextRequest } from 'next/server';
import { deleteNote, updateNote } from '@/lib/insforge-db';
import { getServerAuthContext } from '@/lib/server-auth';

// 更新笔记
export async function PUT(request: NextRequest) {
  try {
    const auth = await getServerAuthContext(request);

    if (!auth) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id, title, content, tags, entryDate, moodLevel } = await request.json();

    const updatedNote = await updateNote(auth, id, {
      title,
      content,
      tags: Array.isArray(tags) ? tags : [],
      entryDate,
      moodLevel: typeof moodLevel === "number" ? moodLevel : null,
    });

    return new Response(JSON.stringify(updatedNote), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('更新笔记时发生错误:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// 删除笔记
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getServerAuthContext(request);

    if (!auth) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { id } = await request.json();
    await deleteNote(auth, id);

    return new Response('Note deleted successfully', {
      status: 200,
    });
  } catch (error) {
    console.error('删除笔记时发生错误:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
