import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import { SlashMenu } from './SlashMenu'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Code, Highlighter, Link as LinkIcon
} from 'lucide-react'
import { useRef, useCallback } from 'react'

interface RichEditorProps {
  content?: string
  onChange?: (html: string) => void
  placeholder?: string
}

export function RichEditor({ content, onChange, placeholder = 'Write something, or press \'/\' for commands…' }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: { languageClassPrefix: 'language-' },
      }),
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Link.configure({ openOnClick: true, autolink: true }),
    ],
    content: content || defaultContent,
    editorProps: {
      attributes: { class: 'tiptap-editor', spellcheck: 'true' },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  // Slash command handler
  const handleKeyDown = useCallback((_e: React.KeyboardEvent) => {
    // SlashMenu handles this internally
  }, [])

  if (!editor) return null

  return (
    <div ref={editorRef} style={{ position: 'relative' }}>
      {/* Bubble formatting menu */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 100 }}
        className="bubble-menu"
      >
        <button
          className={`bubble-menu-btn ${editor.isActive('bold') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (⌘B)"
        >
          <Bold size={14} />
        </button>
        <button
          className={`bubble-menu-btn ${editor.isActive('italic') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (⌘I)"
        >
          <Italic size={14} />
        </button>
        <button
          className={`bubble-menu-btn ${editor.isActive('underline') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (⌘U)"
        >
          <UnderlineIcon size={14} />
        </button>
        <button
          className={`bubble-menu-btn ${editor.isActive('strike') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </button>
        <div className="bubble-menu-divider" />
        <button
          className={`bubble-menu-btn ${editor.isActive('code') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleCode().run()}
          title="Inline code"
        >
          <Code size={14} />
        </button>
        <button
          className={`bubble-menu-btn ${editor.isActive('highlight') ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          title="Highlight"
        >
          <Highlighter size={14} />
        </button>
        <div className="bubble-menu-divider" />
        <button
          className="bubble-menu-btn"
          onClick={() => {
            const url = window.prompt('URL:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          title="Add link"
        >
          <LinkIcon size={14} />
        </button>
      </BubbleMenu>

      <SlashMenu editor={editor} />

      <EditorContent editor={editor} onKeyDown={handleKeyDown} />
    </div>
  )
}

const defaultContent = `<h2>Closed-loop stability</h2>
<p>For a continuous-time LTI system, all closed-loop poles must lie in the left half-plane. A positive real part means the response grows with time.<span class="collaborator-cursor-tag">Maya Chen</span></p>

<blockquote>
  <p>“Negative feedback alone does not guarantee stability. The loop gain and phase determine the outcome.”</p>
  <cite>Lecture 06 · Dr. Patel</cite>
</blockquote>

<h3>A quick pole check</h3>
<table>
  <thead>
    <tr>
      <th>Closed-loop poles</th>
      <th>Classification</th>
      <th>System behavior</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>s &lt; 0</code> (Real &amp; negative)</td>
      <td>Exponential decay</td>
      <td>Overdamped or critically damped, strictly stable</td>
    </tr>
    <tr>
      <td><code>Re(s) &lt; 0</code> (Complex conjugate)</td>
      <td>Damped oscillation</td>
      <td>Underdamped, stable with settling overshoot</td>
    </tr>
    <tr>
      <td><code>Re(s) = 0</code> (On imaginary axis)</td>
      <td>Sustained oscillation</td>
      <td>Marginally stable, constant amplitude</td>
    </tr>
    <tr>
      <td><code>Re(s) &gt; 0</code> (Right half-plane)</td>
      <td>Exponential explosion</td>
      <td>Unstable, divergence without bounds</td>
    </tr>
  </tbody>
</table>

<p>The system's characteristic equation:</p>
<pre><code>1 + G(s)H(s) = 0</code></pre>

<h3>Key Action Items</h3>
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked /> Review Routh-Hurwitz conditions and sign-change rules</label></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox" /> Simulate root locus trajectory in MATLAB &amp; verify pole crossings</label></li>
  <li data-type="taskItem" data-checked="false"><label><input type="checkbox" /> Write up analytical stability analysis section</label></li>
</ul>`
