"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link2, ImageIcon, Clapperboard as YoutubeIcon, Undo, Redo, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";

function B({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title} className={cn("rounded-md p-1.5 hover:bg-muted", active && "bg-primary/10 text-primary")}>{children}</button>
  );
}

export function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } }),
      Image,
      Youtube.configure({ width: 640, height: 360 }),
      Placeholder.configure({ placeholder: "Escribe el contenido de la lección…" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: { attributes: { class: "prose prose-neutral dark:prose-invert max-w-none min-h-64 p-4 focus:outline-none" } },
  });
  if (!editor) return <div className="h-72 animate-pulse rounded-xl bg-muted" />;

  const addImage = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const f = input.files?.[0];
      if (!f) return;
      const id = toast.loading("Subiendo imagen…");
      try {
        const blob = await upload(`images/${f.name}`, f, { access: "public", handleUploadUrl: "/api/upload" });
        editor.chain().focus().setImage({ src: blob.url }).run();
        toast.success("Imagen agregada", { id });
      } catch (e) {
        toast.error((e as Error).message, { id });
      }
    };
    input.click();
  };

  return (
    <div className="rounded-xl border bg-background">
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1.5">
        <B title="Negrita" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></B>
        <B title="Cursiva" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></B>
        <span className="mx-1 h-5 w-px bg-border" />
        <B title="Título" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></B>
        <B title="Subtítulo" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></B>
        <B title="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></B>
        <B title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></B>
        <B title="Cita" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" /></B>
        <B title="Separador" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus className="size-4" /></B>
        <span className="mx-1 h-5 w-px bg-border" />
        <B title="Enlace" active={editor.isActive("link")} onClick={() => { const url = prompt("URL del enlace:", editor.getAttributes("link").href ?? "https://"); if (url === null) return; if (!url) editor.chain().focus().unsetLink().run(); else editor.chain().focus().setLink({ href: url }).run(); }}><Link2 className="size-4" /></B>
        <B title="Imagen" onClick={addImage}><ImageIcon className="size-4" /></B>
        <B title="Video de YouTube" onClick={() => { const url = prompt("URL de YouTube:"); if (url) editor.commands.setYoutubeVideo({ src: url }); }}><YoutubeIcon className="size-4" /></B>
        <span className="ml-auto flex">
          <B title="Deshacer" onClick={() => editor.chain().focus().undo().run()}><Undo className="size-4" /></B>
          <B title="Rehacer" onClick={() => editor.chain().focus().redo().run()}><Redo className="size-4" /></B>
        </span>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
