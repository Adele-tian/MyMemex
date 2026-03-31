import { Note } from "@/lib/types";

// 读取浏览器本地旧版数据，交给 /api/migrate-data 导入到 InsForge。
export function getLocalStorageNotes(): Note[] {
  if (typeof window === "undefined") {
    return [];
  }

  const saved = window.localStorage.getItem("second-brain-notes");
  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved) as Note[];
  } catch (error) {
    console.error("解析 localStorage 数据时发生错误:", error);
    return [];
  }
}

export async function migrateLocalStorageData(notes = getLocalStorageNotes()) {
  if (notes.length === 0) {
    return { migrated: 0, skipped: 0, total: 0 };
  }

  return sendLocalDataForMigration(notes);
}

export async function sendLocalDataForMigration(notes: Note[]) {
  try {
    const response = await fetch("/api/migrate-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      throw new Error(`数据迁移请求失败: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("发送数据迁移请求时发生错误:", error);
    throw error;
  }
}
