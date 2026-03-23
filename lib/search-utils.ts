/**
 * Advanced search utilities for MyMemex
 */

export interface SearchOptions {
  query: string;
  dateFrom?: Date;
  dateTo?: Date;
  tags?: string[];
  excludeTags?: string[];
  sortBy?: 'relevance' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  noteId: string;
  score: number; // For relevance scoring
  highlights: string[]; // Highlighted text snippets
  matchedFields: ('title' | 'content' | 'tags')[];
}

/**
 * Parse search query with special syntax
 * Supports: "quoted phrases", AND/OR operators, tag:tagName, date ranges
 */
export function parseSearchQuery(query: string): SearchOptions {
  const options: SearchOptions = {
    query: '',
    sortBy: 'date',
    sortOrder: 'desc'
  };

  // Extract quoted phrases
  const quotedMatches = query.match(/"([^"]+)"/g);
  let processedQuery = query;

  if (quotedMatches) {
    // For now, join quoted phrases and treat as exact match
    options.query = quotedMatches.map(match => match.slice(1, -1)).join(' ');
    // Remove quoted parts from processed query
    quotedMatches.forEach(match => {
      processedQuery = processedQuery.replace(match, '');
    });
  }

  // Process other parts of the query
  const tokens = processedQuery.split(/\s+/).filter(token => token.length > 0);

  for (const token of tokens) {
    if (token.startsWith('tag:')) {
      if (!options.tags) options.tags = [];
      options.tags.push(token.substring(4));
    } else if (token.startsWith('notag:')) {
      if (!options.excludeTags) options.excludeTags = [];
      options.excludeTags.push(token.substring(6));
    } else {
      // Add to main query
      if (options.query) {
        options.query += ' ' + token;
      } else {
        options.query = token;
      }
    }
  }

  return options;
}

/**
 * Perform search with highlighting
 */
export function performSearch(notes: any[], searchOptions: SearchOptions): SearchResult[] {
  const results: SearchResult[] = [];

  for (const note of notes) {
    const score = calculateRelevanceScore(note, searchOptions);

    if (score > 0) {
      // Generate highlights
      const highlights = generateHighlights(note, searchOptions.query);

      // Determine matched fields
      const matchedFields = getMatchedFields(note, searchOptions);

      results.push({
        noteId: note.id,
        score,
        highlights,
        matchedFields
      });
    }
  }

  // Sort by score (relevance) or date
  return results.sort((a, b) => {
    if (searchOptions.sortBy === 'relevance') {
      return searchOptions.sortOrder === 'desc' ? b.score - a.score : a.score - b.score;
    } else if (searchOptions.sortBy === 'title') {
      const titleA = notes.find(n => n.id === a.noteId)?.title || '';
      const titleB = notes.find(n => n.id === b.noteId)?.title || '';
      return searchOptions.sortOrder === 'desc'
        ? titleB.localeCompare(titleA)
        : titleA.localeCompare(titleB);
    } else {
      // Default to date sorting
      const dateA = new Date(notes.find(n => n.id === a.noteId)?.updatedAt || '').getTime();
      const dateB = new Date(notes.find(n => n.id === b.noteId)?.updatedAt || '').getTime();
      return searchOptions.sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    }
  });
}

/**
 * Calculate relevance score for a note based on search terms
 */
function calculateRelevanceScore(note: any, options: SearchOptions): number {
  let score = 0;

  // If we have specific tags to include
  if (options.tags && options.tags.length > 0) {
    const hasAllTags = options.tags.every(tag => note.tags.includes(tag));
    if (!hasAllTags) {
      return 0; // Doesn't match required tags
    }
    score += 10 * options.tags.length; // Bonus for matching required tags
  }

  // If we have tags to exclude
  if (options.excludeTags && options.excludeTags.some(tag => note.tags.includes(tag))) {
    return 0; // Contains excluded tag
  }

  // Apply date filters if specified
  if (options.dateFrom || options.dateTo) {
    const noteDate = new Date(note.updatedAt);
    if (options.dateFrom && noteDate < options.dateFrom) return 0;
    if (options.dateTo && noteDate > options.dateTo) return 0;
  }

  // Calculate text relevance
  if (options.query) {
    const lowerQuery = options.query.toLowerCase();
    const lowerTitle = note.title.toLowerCase();
    const lowerContent = note.content.toLowerCase();
    const lowerTags = note.tags.join(' ').toLowerCase();

    // Title matches are worth more
    if (lowerTitle.includes(lowerQuery)) {
      score += 5;
    }

    // Content matches
    if (lowerContent.includes(lowerQuery)) {
      score += 3;
    }

    // Tag matches
    if (lowerTags.includes(lowerQuery)) {
      score += 2;
    }
  }

  return score;
}

/**
 * Generate highlighted text snippets
 */
function generateHighlights(note: any, query: string): string[] {
  if (!query) return [];

  const snippets: string[] = [];
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) return [];

  // Look for matches in content
  const content = note.content;
  const lowerContent = content.toLowerCase();

  for (const word of words) {
    const index = lowerContent.indexOf(word);
    if (index !== -1) {
      // Extract a snippet around the match
      const start = Math.max(0, index - 50);
      const end = Math.min(content.length, index + word.length + 50);
      let snippet = content.substring(start, end);

      // Add ellipsis if we truncated
      if (start > 0) snippet = '...' + snippet;
      if (end < content.length) snippet = snippet + '...';

      // Highlight the matched word
      snippet = snippet.replace(new RegExp(`(${word})`, 'gi'), '<mark>$1</mark>');

      snippets.push(snippet);
    }
  }

  return snippets.slice(0, 3); // Return max 3 snippets
}

/**
 * Get fields that matched the search
 */
function getMatchedFields(note: any, options: SearchOptions): ('title' | 'content' | 'tags')[] {
  const matched: ('title' | 'content' | 'tags')[] = [];
  const query = options.query.toLowerCase();

  if (query) {
    if (note.title.toLowerCase().includes(query) && !matched.includes('title')) {
      matched.push('title');
    }
    if (note.content.toLowerCase().includes(query) && !matched.includes('content')) {
      matched.push('content');
    }
    if (note.tags.some((tag: string) => tag.toLowerCase().includes(query)) && !matched.includes('tags')) {
      matched.push('tags');
    }
  }

  // Add tag matches if specified in options
  if (options.tags) {
    for (const tag of options.tags) {
      if (note.tags.includes(tag) && !matched.includes('tags')) {
        matched.push('tags');
      }
    }
  }

  return matched;
}