interface RichContentViewerProps {
  content: string;
}

function stripHtml(input: string) {
  return input
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function stripMarkdown(input: string) {
  return input
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/`{1,3}([^`]+)`{1,3}/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^>\s?/gm, "");
}

function normalizeText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

export function RichContentViewer({ content }: RichContentViewerProps) {
  const plainText = normalizeText(stripMarkdown(stripHtml(content)));

  return <div className="whitespace-pre-wrap break-words">{plainText || content}</div>;
}
