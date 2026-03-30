export function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatFullDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date(date));
}

export function formatEntryDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function toDateOnly(date: string | Date) {
  const parsed = typeof date === "string" ? new Date(date) : date;
  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function summarize(content: string, maxLength = 140) {
  const structured = parseDiarySections(content);
  const structuredText = [
    structured.events,
    structured.moodNote,
    structured.reflection,
    structured.tomorrow,
    structured.photoNote,
    structured.habitsNote,
  ]
    .filter(Boolean)
    .join(" ");

  const sourceText = structuredText || content;
  const plainText = content
    .replace(/^@@JOURNAL_V1@@/g, "")
    .replace(/[{}[\]"]/g, " ")
    .replace(/^#+\s/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
  const normalized = structuredText
    ? structuredText.replace(/\n+/g, " ").trim()
    : plainText || sourceText.replace(/\n+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

export function extractTitle(input: string) {
  const firstLine = input
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return "未命名日记";
  }

  return firstLine.replace(/^#+\s*/, "").slice(0, 40);
}

export function getMoodLabel(level?: number) {
  switch (level) {
    case 1:
      return "很低落";
    case 2:
      return "有点累";
    case 3:
      return "平稳";
    case 4:
      return "不错";
    case 5:
      return "很开心";
    default:
      return "未记录";
  }
}

export function getMoodEmoji(level?: number) {
  switch (level) {
    case 1:
      return "😞";
    case 2:
      return "😕";
    case 3:
      return "😌";
    case 4:
      return "🙂";
    case 5:
      return "😄";
    default:
      return "🫥";
  }
}

export interface DiarySections {
  events: string;
  moodNote: string;
  reflection: string;
  tomorrow: string;
  photoNote: string;
  habitsNote: string;
}

const EMPTY_SECTIONS: DiarySections = {
  events: "",
  moodNote: "",
  reflection: "",
  tomorrow: "",
  photoNote: "",
  habitsNote: "",
};

const JOURNAL_PREFIX = "@@JOURNAL_V1@@";

export function parseDiarySections(content: string): DiarySections {
  if (!content.startsWith(JOURNAL_PREFIX)) {
    return {
      ...EMPTY_SECTIONS,
      events: content.trim(),
    };
  }

  try {
    const parsed = JSON.parse(content.replace(JOURNAL_PREFIX, ""));
    return {
      ...EMPTY_SECTIONS,
      ...parsed,
    };
  } catch {
    return {
      ...EMPTY_SECTIONS,
      events: content.replace(JOURNAL_PREFIX, "").trim(),
    };
  }
}

export function serializeDiarySections(sections: DiarySections) {
  return `${JOURNAL_PREFIX}${JSON.stringify(sections)}`;
}

export function hasStructuredDiaryContent(content: string) {
  return content.startsWith(JOURNAL_PREFIX);
}

export function extractTags(input: string) {
  const matches = input.match(/#([\p{L}\p{N}_-]+)/gu) ?? [];
  return Array.from(new Set(matches.map((match) => match.replace(/^#/, ""))));
}

/**
 * Suggest tags based on content analysis
 */
export function suggestTags(content: string, existingTags: string[] = [], allKnownTags: string[] = []): string[] {
  const suggestions: string[] = [];

  // Extract words from content (excluding common stop words)
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'the', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'its', 'our', 'their', 'which', 'who', 'what', 'where', 'when', 'why', 'how',
    'as', 'if', 'so', 'than', 'too', 'very', 'just', 'now', 'then', 'there', 'here', 'also', 'too',
    '很', '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也',
    '很', '或', '与', '及', '及', '等', '为', '以', '于', '中', '出', '而', '你', '他', '她', '它',
    '我们', '你们', '他们', '她们', '它们', '这', '那', '哪', '什么', '怎么', '为什么', '哪里', '何时'
  ]);

  const words = content
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word)); // Filter short words and stop words

  // Count word frequencies
  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Get top frequent words that aren't already tags
  const topWords = Object.entries(wordFreq)
    .filter(([word]) => !existingTags.includes(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Top 5 suggestions
    .map(([word]) => word);

  suggestions.push(...topWords);

  // Also suggest from known tags that appear frequently in the content
  const knownTagSuggestions = allKnownTags.filter(tag =>
    content.toLowerCase().includes(tag.toLowerCase()) &&
    !existingTags.includes(tag)
  );

  suggestions.push(...knownTagSuggestions.slice(0, 3)); // Add up to 3 known tags

  // Return unique suggestions
  return [...new Set(suggestions)];
}

/**
 * Create hierarchical tags from flat tags
 * Example: ['project:web', 'priority:high'] -> { project: ['web'], priority: ['high'] }
 */
export function createHierarchicalTags(tags: string[]): Record<string, string[]> {
  const hierarchy: Record<string, string[]> = {};

  tags.forEach(tag => {
    if (tag.includes(':')) {
      const [category, subtag] = tag.split(':');
      if (!hierarchy[category]) {
        hierarchy[category] = [];
      }
      if (!hierarchy[category].includes(subtag)) {
        hierarchy[category].push(subtag);
      }
    }
  });

  return hierarchy;
}

/**
 * Flatten hierarchical tags back to flat array
 */
export function flattenHierarchicalTags(hierarchy: Record<string, string[]>): string[] {
  const tags: string[] = [];

  Object.entries(hierarchy).forEach(([category, subtags]) => {
    subtags.forEach(subtag => {
      tags.push(`${category}:${subtag}`);
    });
  });

  return tags;
}
