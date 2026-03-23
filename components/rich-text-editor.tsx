import { useState, useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Quote, Code, Image, Link } from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = content || "<p><br></p>";
    }
  }, [content]);

  // Handle input changes
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Execute formatting commands
  const formatText = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Handle image insertion
  const insertImage = () => {
    const url = prompt("请输入图片链接:");
    if (url) {
      // Validate URL format before inserting
      try {
        new URL(url); // Will throw if invalid
        if (url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
          formatText('insertImage', url);
        } else {
          alert('请输入有效的图片链接');
        }
      } catch (e) {
        alert('请输入有效的URL格式');
      }
    }
  };

  // Handle link insertion
  const insertLink = () => {
    const url = prompt("请输入链接地址:");
    if (url) {
      // Validate URL format before inserting
      try {
        new URL(url); // Will throw if invalid
        formatText('createLink', url);
      } catch (e) {
        alert('请输入有效的URL格式');
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b border-border/70 bg-background/50 rounded-t-lg">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="p-2 rounded-md hover:bg-accent"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="p-2 rounded-md hover:bg-accent"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('underline')}
          className="p-2 rounded-md hover:bg-accent"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </button>
        <div className="w-px bg-border/30 mx-1"></div>
        <button
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          className="p-2 rounded-md hover:bg-accent"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('insertOrderedList')}
          className="p-2 rounded-md hover:bg-accent"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <div className="w-px bg-border/30 mx-1"></div>
        <button
          type="button"
          onClick={() => formatText('formatBlock', '<blockquote>')}
          className="p-2 rounded-md hover:bg-accent"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('formatBlock', '<pre>')}
          className="p-2 rounded-md hover:bg-accent"
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </button>
        <div className="w-px bg-border/30 mx-1"></div>
        <button
          type="button"
          onClick={insertImage}
          className="p-2 rounded-md hover:bg-accent"
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={insertLink}
          className="p-2 rounded-md hover:bg-accent"
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`flex-1 min-h-[200px] p-3 overflow-auto outline-none bg-transparent text-foreground ${
          !content && isFocused ? 'text-foreground/40' : ''
        }`}
        suppressContentEditableWarning={true}
      />
    </div>
  );
}