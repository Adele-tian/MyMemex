import { Note } from "@/lib/types";

export const sampleNotes: Note[] = [
  {
    id: "note-1",
    title: "设计系统灵感",
    content:
      "整理了一组值得借鉴的卡片式知识 UI：重点是层次感、呼吸感和稳定的留白。下一步可以把标签与摘要的关系做得更轻一点。",
    tags: ["Design", "UI"],
    createdAt: "2026-03-20T09:30:00.000Z",
    updatedAt: "2026-03-20T09:30:00.000Z",
  },
  {
    id: "note-2",
    title: "关于第二大脑的产品假设",
    content:
      "用户最常见的路径不是搜索，而是快速记录后在某个情境下重新遇见。所以首页更适合做动态回顾，而不是文档树。",
    tags: ["Product", "Research"],
    createdAt: "2026-03-19T14:10:00.000Z",
    updatedAt: "2026-03-19T14:10:00.000Z",
  },
  {
    id: "note-3",
    title: "每周复盘模板",
    content:
      "## Wins\n- 做对了什么\n## Blockers\n- 卡在哪里\n## Next\n- 下周一个最重要动作\n\n这个模板适合直接插入输入框快速扩展。",
    tags: ["Workflow", "Markdown"],
    createdAt: "2026-03-18T07:20:00.000Z",
    updatedAt: "2026-03-18T07:20:00.000Z",
  },
];
