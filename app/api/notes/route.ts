import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@/lib/generated/prisma/client';

const prisma = new PrismaClient();

// 获取当前用户的笔记
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user?.id;

    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    // 将逗号分隔的标签字符串转换回数组格式
    const notesWithTagsArray = notes.map(note => ({
      ...note,
      tags: note.tags ? note.tags.split(',').filter(tag => tag.trim()) : []
    }));

    return new Response(JSON.stringify(notesWithTagsArray), {
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
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user?.id;
    const { title, content, tags } = await request.json();

    const newNote = await prisma.note.create({
      data: {
        title,
        content,
        tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
        userId,
      },
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