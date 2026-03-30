import prisma from '@/lib/prisma';
import { Note } from '@/lib/types';
import { loadNotes } from '@/lib/storage';

// 从localStorage加载现有笔记并迁移到数据库
export async function migrateLocalStorageData(userId: string) {
  try {
    // 从localStorage加载现有笔记
    // 注意：由于我们现在在服务器端，需要特殊处理
    // 在实际实现中，我们会从前端接收现有数据

    console.log('开始数据迁移...');

    // 这里我们模拟从localStorage获取的数据
    // 在实际迁移过程中，我们会从浏览器的localStorage获取数据并发送到此API
    const localStorageNotes = await loadNotes();

    console.log(`找到 ${localStorageNotes.length} 条笔记进行迁移`);

    if (localStorageNotes.length === 0) {
      console.log('没有数据需要迁移');
      return { migrated: 0, skipped: 0 };
    }

    let migratedCount = 0;
    let skippedCount = 0;

    // 逐个迁移笔记到数据库
    for (const note of localStorageNotes) {
      try {
        // 检查是否已存在相同的笔记（基于内容和时间戳）
        const existingNote = await prisma.note.findFirst({
          where: {
            userId,
            title: note.title,
            content: note.content,
            createdAt: new Date(note.createdAt),
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
            title: note.title || "历史日记",
            content: note.content,
            tags: Array.isArray(note.tags) ? note.tags.join(",") : "",
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

    console.log(`数据迁移完成: ${migratedCount} 条已迁移, ${skippedCount} 条已跳过`);
    return { migrated: migratedCount, skipped: skippedCount };
  } catch (error) {
    console.error('数据迁移过程中发生错误:', error);
    throw error;
  }
}

// 获取localStorage中的笔记数据（用于前端调用）
export function getLocalStorageNotes(): Note[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const saved = window.localStorage.getItem('second-brain-notes');
  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as Note[];
  } catch (error) {
    console.error('解析localStorage数据时发生错误:', error);
    return [];
  }
}

// 将localStorage数据发送到服务器进行迁移
export async function sendLocalDataForMigration(userId: string, notes: Note[]) {
  try {
    const response = await fetch(`/api/migrate-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, notes }),
    });

    if (!response.ok) {
      throw new Error(`数据迁移请求失败: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('发送数据迁移请求时发生错误:', error);
    throw error;
  }
}
