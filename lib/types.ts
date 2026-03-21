export type ViewFilter = "all" | "recent" | `tag:${string}`;

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}
