export type ViewFilter = "all" | "settings" | "visualization" | `tag:${string}`;

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}
