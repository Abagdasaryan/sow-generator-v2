import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  placeholder?: string;
}

export function TiptapEditor({
  content,
  onChange,
  editable = true,
  placeholder,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[120px] px-4 py-3 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="rounded-md border border-gray-300 overflow-hidden">
      {editable && (
        <div className="flex items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            label="B"
            title="Bold"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            label="I"
            title="Italic"
          />
          <div className="h-4 w-px bg-gray-300 mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            label="List"
            title="Bullet List"
          />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            label="1."
            title="Numbered List"
          />
          <div className="h-4 w-px bg-gray-300 mx-1" />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive("heading", { level: 3 })}
            label="H3"
            title="Heading"
          />
        </div>
      )}
      <EditorContent editor={editor} />
      {placeholder && !content && (
        <p className="px-4 -mt-8 text-sm text-gray-400 pointer-events-none">
          {placeholder}
        </p>
      )}
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  title,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1 text-xs font-medium ${
        active
          ? "bg-blue-100 text-blue-700"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
