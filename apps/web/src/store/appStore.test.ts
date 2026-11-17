import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore, DEMO_NOTEBOOKS } from './appStore'

describe('appStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      notebooks: DEMO_NOTEBOOKS,
      currentNotebookId: 'nb-1',
      currentPageId: 'pg-1',
    })
  })

  it('updates page title and reflects in the store', () => {
    const store = useAppStore.getState()
    store.updatePage('nb-1', 'pg-1', { title: 'Updated Title' })

    const updated = useAppStore.getState().notebooks.find((nb) => nb.id === 'nb-1')
    const page = updated?.pages.find((p) => p.id === 'pg-1')

    expect(page?.title).toBe('Updated Title')
  })

  it('adds a new page to a notebook', () => {
    const store = useAppStore.getState()
    const newPage = {
      id: 'pg-test-new',
      notebookId: 'nb-1',
      title: 'New Test Page',
      icon: '🧪',
      updatedAt: new Date().toISOString(),
      content: '<p>Test</p>',
    }

    store.addPage('nb-1', newPage)

    const updated = useAppStore.getState().notebooks.find((nb) => nb.id === 'nb-1')
    expect(updated?.pages.some((p) => p.id === 'pg-test-new')).toBe(true)
    expect(useAppStore.getState().currentPageId).toBe('pg-test-new')
  })

  it('adds and deletes a notebook', () => {
    const store = useAppStore.getState()
    const newNb = {
      id: 'nb-temp',
      workspaceId: 'ws-1',
      name: 'Temp Notebook',
      emoji: '📁',
      pages: [],
    }

    store.addNotebook(newNb)
    expect(useAppStore.getState().notebooks.some((nb) => nb.id === 'nb-temp')).toBe(true)

    store.deleteNotebook('nb-temp')
    expect(useAppStore.getState().notebooks.some((nb) => nb.id === 'nb-temp')).toBe(false)
  })
})
