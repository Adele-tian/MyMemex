import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface RichContentViewerProps {
  content: string;
}

export function RichContentViewer({ content }: RichContentViewerProps) {
  // If the content looks like HTML, sanitize and render it
  // Otherwise, render as markdown-compatible text
  const isHTML = /<\/?[a-z][\s\S]*>/i.test(content);

  if (isHTML) {
    // Sanitize HTML to prevent XSS
    const sanitizedHTML = DOMPurify.sanitize(content);
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      />
    );
  } else {
    // For plain text or markdown, render with basic formatting
    // Check if content contains markdown-like syntax
    if (content.includes('# ') || content.includes('*') || content.includes('- ') || content.includes('[') && content.includes('](')) {
      // Process as markdown
      const parsedMarkdown = marked.parse(content) as string;
      const sanitizedMarkdown = DOMPurify.sanitize(parsedMarkdown);
      return (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizedMarkdown }}
        />
      );
    } else {
      // Plain text
      return (
        <div className="whitespace-pre-wrap break-words">
          {content}
        </div>
      );
    }
  }
}