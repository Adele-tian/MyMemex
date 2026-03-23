import { useState } from "react";
import { Download, Upload, FileText, DatabaseBackup } from "lucide-react";
import { exportNotesToJson, importNotesFromJson, exportNotesToMarkdown, downloadFile, readFile } from "@/lib/export-import-utils";
import { Note } from "@/lib/types";

interface ExportImportPanelProps {
  notes: Note[];
  onImportSuccess: (importedNotes: Note[]) => void;
}

export function ExportImportPanel({ notes, onImportSuccess }: ExportImportPanelProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const handleJsonExport = () => {
    setIsExporting(true);
    try {
      const jsonContent = exportNotesToJson(notes);
      downloadFile(jsonContent, `mymemex-backup-${new Date().toISOString().split('T')[0]}.json`, "application/json");
    } finally {
      setIsExporting(false);
    }
  };

  const handleMarkdownExport = () => {
    setIsExporting(true);
    try {
      const markdownFiles = exportNotesToMarkdown(notes);

      // Create a single zip-like representation or export multiple files
      // For now, let's create a single consolidated markdown file
      let consolidatedContent = "# MyMemex Notes Export\n\n";
      consolidatedContent += `Exported on: ${new Date().toISOString()}\n\n`;

      notes.forEach((note, index) => {
        consolidatedContent += `## ${index + 1}. ${note.title}\n\n`;
        consolidatedContent += `${note.content}\n\n`;
        consolidatedContent += `*Created: ${note.createdAt} | Updated: ${note.updatedAt} | Tags: ${note.tags.join(', ')}*\n\n---\n\n`;
      });

      downloadFile(consolidatedContent, `mymemex-notes-${new Date().toISOString().split('T')[0]}.md`, "text/markdown");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const content = await readFile(file);

      // Try to parse as JSON first
      let importedNotes: Note[] = [];
      try {
        importedNotes = importNotesFromJson(content);
      } catch (jsonError) {
        // If JSON parsing fails, we could potentially support other formats in the future
        throw new Error("Unsupported file format. Please upload a valid JSON backup.");
      }

      if (importedNotes.length === 0) {
        throw new Error("No valid notes found in the imported file.");
      }

      // Confirm with user before importing
      const confirmed = window.confirm(
        `Import ${importedNotes.length} notes? This will add them to your existing notes.`
      );

      if (confirmed) {
        onImportSuccess(importedNotes);
      }
    } catch (error: any) {
      console.error("Import error:", error);
      setImportError(error.message || "Failed to import notes. Please check the file format.");
    } finally {
      setIsImporting(false);
      // Reset the file input
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-xl border border-border/70 bg-card/70 p-5">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <DatabaseBackup className="h-5 w-5" />
        数据备份与导入
      </h3>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Download className="h-4 w-4" />
            导出数据
          </h4>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleJsonExport}
              disabled={isExporting || notes.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-foreground/70 transition hover:text-foreground disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "导出中..." : "JSON格式备份"}
            </button>

            <button
              type="button"
              onClick={handleMarkdownExport}
              disabled={isExporting || notes.length === 0}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-foreground/70 transition hover:text-foreground disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              {isExporting ? "导出中..." : "Markdown格式"}
            </button>
          </div>
          {notes.length === 0 && (
            <p className="text-sm text-foreground/50 mt-2">暂无笔记可导出</p>
          )}
        </div>

        <div>
          <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
            <Upload className="h-4 w-4" />
            导入数据
          </h4>
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm text-foreground/70 transition hover:text-foreground cursor-pointer">
              <Upload className="h-4 w-4" />
              {isImporting ? "导入中..." : "选择备份文件"}
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                disabled={isImporting}
              />
            </label>
            <p className="text-xs text-foreground/50">
              支持导入JSON格式的MyMemex备份文件
            </p>
            {importError && (
              <p className="text-sm text-destructive mt-2">{importError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}