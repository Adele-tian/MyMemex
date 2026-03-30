import { Note } from "@/lib/types";

export interface ExportData {
  version: string;
  exportedAt: string;
  notes: Note[];
}

/**
 * Export all notes to JSON format
 */
export function exportNotesToJson(notes: Note[]): string {
  const exportData: ExportData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    notes: notes
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import notes from JSON format
 */
export function importNotesFromJson(jsonString: string): Note[] {
  try {
    const parsed = JSON.parse(jsonString);

    if (parsed.version && parsed.notes && Array.isArray(parsed.notes)) {
      // Validate that imported data has the required fields for Note objects
      const importedNotes: Note[] = parsed.notes.filter((note: any) => {
        return note.id && note.content && note.tags &&
               note.createdAt && note.updatedAt;
      });

      return importedNotes;
    } else {
      throw new Error("Invalid export format");
    }
  } catch (error) {
    console.error("Failed to parse imported data:", error);
    throw new Error("Invalid JSON format for import");
  }
}

/**
 * Export notes to Markdown format (one file per note)
 */
export function exportNotesToMarkdown(notes: Note[]): { [filename: string]: string } {
  const files: { [filename: string]: string } = {};

  notes.forEach(note => {
    const noteTitle = note.title || "未命名日记";

    // Sanitize title for filename
    const sanitizedTitle = noteTitle
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid filename characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 50); // Limit length

    const filename = `${sanitizedTitle}_${note.id.substring(0, 8)}.md`;

    // Create markdown content
    const markdownContent = `# ${noteTitle}\n\n${note.content}\n\n---\n*Created: ${note.createdAt}*\n*Updated: ${note.updatedAt}*\n*Tags: ${note.tags.join(', ')}*`;

    files[filename] = markdownContent;
  });

  return files;
}

/**
 * Download a file to the user's computer
 */
export function downloadFile(content: string, filename: string, mimeType: string = "application/json") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Read uploaded file
 */
export function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Could not read file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}
