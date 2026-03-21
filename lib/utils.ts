export function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function summarize(content: string, maxLength = 140) {
  const plainText = content
    .replace(/^#+\s/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n+/g, " ")
    .trim();

  if (plainText.length <= maxLength) {
    return plainText;
  }

  return `${plainText.slice(0, maxLength).trim()}...`;
}

export function extractTitle(input: string) {
  const firstLine = input
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return "Untitled Note";
  }

  return firstLine.replace(/^#+\s*/, "").slice(0, 40);
}

export function extractTags(input: string) {
  const matches = input.match(/#([\p{L}\p{N}_-]+)/gu) ?? [];
  return Array.from(new Set(matches.map((match) => match.replace(/^#/, ""))));
}
