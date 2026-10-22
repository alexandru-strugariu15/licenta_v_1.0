import { type Editor } from '@tiptap/react'
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Heading1, Heading2, Heading3, List, ListOrdered,
  CheckSquare, Quote, Code, Minus,
  Type, Pencil
} from 'lucide-react'

interface SlashMenuProps {
  editor: Editor
}

interface MenuItem {
  label: string
  hint: string
  icon: React.ReactNode
  group: string
  command: () => void
}

export function SlashMenu({ editor }: SlashMenuProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  const groups: { label: string; items: MenuItem[] }[] = [
    {
      label: 'Text',
      items: [
        {
          label: 'Text', hint: 'Start with plain text',
          icon: <Type size={14} />, group: 'Text',
          command: () => editor.chain().focus().setParagraph().run(),
        },
        {
          label: 'Heading 1', hint: 'Large section heading',
          icon: <Heading1 size={14} />, group: 'Text',
          command: () => editor.chain().focus().setHeading({ level: 1 }).run(),
        },
        {
          label: 'Heading 2', hint: 'Medium section heading',
          icon: <Heading2 size={14} />, group: 'Text',
          command: () => editor.chain().focus().setHeading({ level: 2 }).run(),
        },
        {
          label: 'Heading 3', hint: 'Small section heading',
          icon: <Heading3 size={14} />, group: 'Text',
          command: () => editor.chain().focus().setHeading({ level: 3 }).run(),
        },
        {
          label: 'Quote', hint: 'Capture a quote',
          icon: <Quote size={14} />, group: 'Text',
          command: () => editor.chain().focus().setBlockquote().run(),
        },
      ],
    },
    {
      label: 'Lists',
      items: [
        {
          label: 'Bullet list', hint: 'Create a simple list',
          icon: <List size={14} />, group: 'Lists',
          command: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          label: 'Numbered list', hint: 'Ordered list',
          icon: <ListOrdered size={14} />, group: 'Lists',
          command: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
          label: 'To-do list', hint: 'Track tasks with checkboxes',
          icon: <CheckSquare size={14} />, group: 'Lists',
          command: () => editor.chain().focus().toggleTaskList().run(),
        },
      ],
    },
    {
      label: 'Media',
      items: [
        {
          label: 'Code block', hint: 'Capture a code snippet',
          icon: <Code size={14} />, group: 'Media',
          command: () => editor.chain().focus().setCodeBlock().run(),
        },
        {
          label: 'Divider', hint: 'Visually divide the page',
          icon: <Minus size={14} />, group: 'Media',
          command: () => editor.chain().focus().setHorizontalRule().run(),
        },
        {
          label: 'Canvas', hint: 'Add a drawing canvas block',
          icon: <Pencil size={14} />, group: 'Media',
          command: () => {
            // Will insert canvas block (Phase 5)
            editor.chain().focus().insertContent('<p>[Canvas block – coming in Phase 5]</p>').run()
          },
        },
      ],
    },
  ]


  const filteredGroups = groups.map((g) => ({
    ...g,
    items: g.items.filter(
      (item) =>
        !query ||
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.hint.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((g) => g.items.length > 0)

  const filteredItems = filteredGroups.flatMap((g) => g.items)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) {
        if (e.key === '/') {
          // Get cursor position
          const selection = window.getSelection()
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            const rect = range.getBoundingClientRect()
            setPosition({ top: rect.bottom + 8, left: rect.left })
          }
          setOpen(true)
          setQuery('')
          setActiveIndex(0)
        }
        return
      }

      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % filteredItems.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + filteredItems.length) % filteredItems.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        filteredItems[activeIndex]?.command()
        setOpen(false)
        // Delete the slash
        editor.chain().focus().deleteRange({
          from: editor.state.selection.from - query.length - 1,
          to: editor.state.selection.from,
        }).run()
        return
      }
      if (e.key === 'Backspace') {
        if (query === '') { setOpen(false); return }
        setQuery((q) => q.slice(0, -1))
        setActiveIndex(0)
        return
      }
      if (e.key.length === 1) {
        setQuery((q) => q + e.key)
        setActiveIndex(0)
      }
    },
    [open, query, filteredItems, activeIndex, editor]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [handleKeyDown])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!open || filteredItems.length === 0) return null

  let itemIndex = 0

  return (
    <div
      ref={menuRef}
      className="slash-menu"
      style={{ position: 'fixed', top: position.top, left: position.left }}
      role="listbox"
    >
      {filteredGroups.map((group) => (
        <div key={group.label}>
          <div className="slash-menu-group-label">{group.label}</div>
          {group.items.map((item) => {
            const idx = itemIndex++
            return (
              <div
                key={item.label}
                className={`slash-menu-item ${activeIndex === idx ? 'active' : ''}`}
                role="option"
                aria-selected={activeIndex === idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  item.command()
                  setOpen(false)
                  editor.chain().focus().deleteRange({
                    from: editor.state.selection.from - query.length - 1,
                    to: editor.state.selection.from,
                  }).run()
                }}
              >
                <div className="slash-menu-item-icon">{item.icon}</div>
                <div className="slash-menu-item-text">
                  <div className="label">{item.label}</div>
                  <div className="hint">{item.hint}</div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
      {query && (
        <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--color-text-tertiary)', borderTop: '1px solid var(--color-border-subtle)' }}>
          Searching: "<strong>{query}</strong>"
        </div>
      )}
    </div>
  )
}
