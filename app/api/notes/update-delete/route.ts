import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

// 更新笔记
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const { id, title, content, tags, entryDate, moodLevel } = await request.json();

    // 确保用户只能更新自己的笔记
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingNote) {
      return new Response('Note not found or unauthorized', { status: 404 });
    }

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        title,
        content,
        tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
        entryDate: entryDate ? new Date(`${entryDate}T00:00:00.000Z`) : existingNote.entryDate,
        moodLevel: typeof moodLevel === "number" ? moodLevel : null,
        updatedAt: new Date(),
      },
    });

    const noteWithTagsArray = {
      ...updatedNote,
      entryDate: updatedNote.entryDate.toISOString(),
      tags: updatedNote.tags ? updatedNote.tags.split(',').filter(tag => tag.trim()) : []
    };

    return new Response(JSON.stringify(noteWithTagsArray), {
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
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await request.json(); // 从请求体中获取笔记ID

    // 确保用户只能删除自己的笔记
    const existingNote = await prisma.note.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingNote) {
      return new Response('Note not found or unauthorized', { status: 404 });
    }

    await prisma.note.delete({
      where: { id },
    });

    return new Response('Note deleted successfully', {
      status: 200,
    });
  } catch (error) {
    console.error('删除笔记时发生错误:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
