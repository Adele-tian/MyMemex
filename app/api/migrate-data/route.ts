import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { Note } from '@/lib/types';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { notes } = await request.json();
    const userId = session.user?.id;

    if (!Array.isArray(notes)) {
      return new Response('Invalid data format', { status: 400 });
    }

    let migratedCount = 0;
    let skippedCount = 0;

    // 逐个迁移笔记到数据库
    for (const note of notes) {
      try {
        // 检查是否已存在相同的笔记（基于ID）
        const existingNote = await prisma.note.findFirst({
          where: {
            id: note.id,
            userId,
          },
        });

        if (existingNote) {
          console.log(`笔记 "${note.title}" 已存在，跳过`);
          skippedCount++;
          continue;
        }

        // 创建新笔记
        await prisma.note.create({
          data: {
            id: note.id,
            title: note.title,
            content: note.content,
            tags: note.tags || [],
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
            userId,
          },
        });

        migratedCount++;
        console.log(`成功迁移笔记: ${note.title}`);
      } catch (error) {
        console.error(`迁移笔记 "${note.title}" 时发生错误:`, error);
        skippedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        migrated: migratedCount,
        skipped: skippedCount,
        total: notes.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('数据迁移过程中发生错误:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}