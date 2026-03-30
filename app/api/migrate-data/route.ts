import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { notes } = await request.json();
    const userId = session.user.id;

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
            title: note.title || '历史日记',
            content: note.content,
            tags: Array.isArray(note.tags) ? note.tags.join(',') : '',
            entryDate: note.entryDate ? new Date(`${note.entryDate}T00:00:00.000Z`) : new Date(note.createdAt),
            moodLevel: typeof note.moodLevel === "number" ? note.moodLevel : null,
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
