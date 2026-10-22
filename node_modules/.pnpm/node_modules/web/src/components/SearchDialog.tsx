import { useState, useEffect, useRef } from 'react'
import { Search, FileText, GitBranch, ArrowRight, X } from 'lucide-react'
import { useAppStore } from '../store/appStore'

interface SearchResult {
  id: string
  title: string
  type: 'page' | 'notebook'
  notebookName?: string
  preview?: string
}

export function SearchDialog() {
  const { notebooks, setSearchOpen, setCurrentPage, setCurrentNotebook } = useAppStore()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const allResults: SearchResult[] = [
    ...notebooks.flatMap((nb) =>
      nb.pages.map((p): SearchResult => ({
        id: p.id,
        title: p.title,
        type: 'page',
        notebookName: nb.name,
        preview: 'Click to open this page…',
      }))
    ),
    ...notebooks.map((nb): SearchResult => ({
      id: nb.id,
      title: nb.name,
      type: 'notebook',
    })),
  ]

  const results = query
    ? allResults.filter((r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.notebookName?.toLowerCase().includes(query.toLowerCase())
      )
    : allResults.slice(0, 8)

  function handleSelect(result: SearchResult) {
    if (result.type === 'page') {
      setCurrentPage(result.id)
      // Find notebook
      const nb = notebooks.find((n) => n.pages.some((p) => p.id === result.id))
      if (nb) setCurrentNotebook(nb.id)
    }
    setSearchOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => (i + 1) % results.length) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => (i - 1 + results.length) % results.length) }
    if (e.key === 'Enter') { handleSelect(results[activeIndex]); }
    if (e.key === 'Escape') { setSearchOpen(false) }
  }

  return (
    <div
      className="search-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false) }}
      role="dialog"
      aria-label="Global search"
    >
      <div className="search-dialog">
        <div className="search-input-wrapper">
          <Search size={16} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            className="search-input"
            placeholder="Search pages, notebooks…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
            onKeyDown={handleKeyDown}
            aria-label="Search"
          />
          {query && (
            <button
              className="btn btn-icon btn-ghost"
              onClick={() => setQuery('')}
              style={{ width: 24, height: 24 }}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', flexShrink: 0, marginLeft: 4 }}>Esc</span>
        </div>

        <div className="search-results" role="listbox">
          {results.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
              No results for "{query}"
            </div>
          ) : (
            results.map((result, idx) => (
              <div
                key={result.id}
                className={`search-result-item ${activeIndex === idx ? 'active' : ''}`}
                role="option"
                aria-selected={activeIndex === idx}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => handleSelect(result)}
              >
                {result.type === 'page'
                  ? <FileText size={15} style={{ color: 'var(--color-text-tertiary)', flexShrink: 0 }} />
                  : <GitBranch size={15} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
                }
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {result.title}
                  </div>
                  {result.notebookName && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                      in {result.notebookName}
                    </div>
                  )}
                </div>
                <ArrowRight size={13} style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }} />
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--color-border-subtle)',
          display: 'flex', gap: 16,
          fontSize: 11, color: 'var(--color-text-tertiary)'
        }}>
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  )
}
