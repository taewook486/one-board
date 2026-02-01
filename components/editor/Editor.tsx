'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface EditorProps {
  content?: string;
  onChange?: (content: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
  editable?: boolean;
}

export default function Editor({
  content = '',
  onChange,
  onImageUpload,
  placeholder = '내용을 입력하세요...',
  editable = true,
}: EditorProps) {
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  const uploadImage = useCallback(async (file: File, position?: { from: number }) => {
    if (!onImageUpload) {
      toast.error('이미지 업로드 기능이 설정되지 않았습니다.');
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await onImageUpload(file);

      if (editor) {
        if (position) {
          editor.chain().focus().setImage({ src: imageUrl }).run();
        } else {
          editor.chain().focus().setImage({ src: imageUrl }).run();
        }
      }

      toast.success('이미지가 업로드되었습니다.');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  }, [editor, onImageUpload]);

  // Handle paste events for images
  useEffect(() => {
    if (!editor || !editable) return;

    const handlePaste = async (e: Event) => {
      const clipboardEvent = e as ClipboardEvent;
      const items = clipboardEvent.clipboardData?.items;
      if (!items) return;

      // Check if there's an image in the clipboard
      const imageFile = Array.from(items).find((item) =>
        item.type.startsWith('image/')
      );

      if (imageFile && imageFile.kind === 'file') {
        e.preventDefault();

        const file = imageFile.getAsFile();
        if (file) {
          await uploadImage(file);
        }
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [editor, editable, uploadImage]);

  // Handle drag and drop for images
  useEffect(() => {
    if (!editor || !editable) return;

    const editorElement = editor.options.element;
    if (!editorElement) return;

    const handleDrop = async (e: Event) => {
      e.preventDefault();

      const dragEvent = e as DragEvent;
      const files = dragEvent.dataTransfer?.files;
      if (!files) return;

      // Find image files
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith('image/')
      );

      if (imageFiles.length > 0) {
        // Insert at cursor position
        const { from } = editor.state.selection;

        for (const file of imageFiles) {
          await uploadImage(file, { from });
        }
      }
    };

    const handleDragOver = (e: Event) => {
      e.preventDefault();
    };

    editorElement.addEventListener('drop', handleDrop);
    editorElement.addEventListener('dragover', handleDragOver);

    return () => {
      editorElement.removeEventListener('drop', handleDrop);
      editorElement.removeEventListener('dragover', handleDragOver);
    };
  }, [editor, editable, uploadImage]);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await uploadImage(file);
      } else {
        toast.error('이미지 파일만 업로드할 수 있습니다.');
      }
    }

    // Reset input
    e.target.value = '';
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => handleFileInput(e as any);
    input.click();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="editor-container border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      {editable && (
        <div className="toolbar flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-gray-200 disabled:opacity-50 ${
              editor.isActive('bold') ? 'bg-gray-300' : ''
            }`}
            title="굵게 (Ctrl+B)"
          >
            <strong>B</strong>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-gray-200 disabled:opacity-50 ${
              editor.isActive('italic') ? 'bg-gray-300' : ''
            }`}
            title="기울임 (Ctrl+I)"
          >
            <em>I</em>
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-gray-200 disabled:opacity-50 ${
              editor.isActive('strike') ? 'bg-gray-300' : ''
            }`}
            title="취소선 (Ctrl+Shift+X)"
          >
            <s>S</s>
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
            }`}
            title="제목 1"
          >
            H1
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
            }`}
            title="제목 2"
          >
            H2
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
            }`}
            title="제목 3"
          >
            H3
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-gray-300' : ''
            }`}
            title="글머리 기호"
          >
            •
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
            title="번호 매기기"
          >
            1.
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('blockquote') ? 'bg-gray-300' : ''
            }`}
            title="인용구"
          >
            &quot;
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('codeBlock') ? 'bg-gray-300' : ''
            }`}
            title="코드 블록"
          >
            &lt;/&gt;
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            className={`p-2 rounded hover:bg-gray-200 disabled:opacity-50 ${
              editor.isActive('code') ? 'bg-gray-300' : ''
            }`}
            title="인라인 코드 (Ctrl+E)"
          >
            &lt;&gt;
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
            title="실행 취소 (Ctrl+Z)"
          >
            ↶
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
            title="다시 실행 (Ctrl+Y)"
          >
            ↷
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={addImage}
            disabled={uploading || !editable}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="이미지 업로드 (Ctrl+O)"
          >
            🖼️
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-gray-300' : ''
            }`}
            title="글머리 기호"
          >
            •
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
            title="번호 매기기"
          >
            1.
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('blockquote') ? 'bg-gray-300' : ''
            }`}
            title="인용구"
          >
            &quot;
          </button>

          <div className="w-px bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('codeBlock') ? 'bg-gray-300' : ''
            }`}
            title="코드 블록"
          >
            &lt;/&gt;
          </button>

          <button
            type="button"
            onClick={addImage}
            disabled={uploading || !editable}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="이미지 업로드 (Ctrl+O)"
          >
            🖼️
          </button>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 focus:outline-none"
      />

      <style jsx global>{`
        .ProseMirror {
          outline: none;
        }

        .ProseMirror p {
          min-height: 300px;
        }

        .ProseMirror p:empty::before {
          color: #adb5bd;
          content: '${placeholder}';
          float: left;
          height: 0;
          pointer-events: none;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
        }

        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid #68cdf8;
        }
      `}</style>
    </div>
  );
}
