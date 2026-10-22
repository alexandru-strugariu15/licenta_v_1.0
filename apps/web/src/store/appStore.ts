import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error'
export type Theme = 'light' | 'dark'

export interface Workspace {
  id: string
  name: string
  kind: 'personal' | 'university' | 'project'
}

export interface Notebook {
  id: string
  workspaceId: string
  name: string
  emoji: string
  pages: Page[]
}

export interface Page {
  id: string
  notebookId: string
  title: string
  icon: string
  updatedAt: string
}

export interface User {
  id: string
  name: string
  email: string
  initials: string
}

interface AppState {
  // Auth
  isAuthenticated: boolean
  hasCompletedOnboarding: boolean
  user: User | null

  // Theme
  theme: Theme

  // Navigation
  currentWorkspace: Workspace | null
  currentNotebookId: string | null
  currentPageId: string | null
  sidebarCollapsed: boolean
  copilotOpen: boolean

  // Data
  workspaces: Workspace[]
  notebooks: Notebook[]

  // Sync
  syncStatus: SyncStatus
  offlineChanges: number

  // UI
  searchOpen: boolean

  // Actions
  login: (user: User) => void
  logout: () => void
  completeOnboarding: (workspace: Workspace) => void
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  toggleCopilot: () => void
  setCurrentPage: (pageId: string | null) => void
  setCurrentNotebook: (notebookId: string | null) => void
  setSyncStatus: (status: SyncStatus) => void
  setSearchOpen: (open: boolean) => void
  addNotebook: (notebook: Notebook) => void
  addPage: (notebookId: string, page: Page) => void
}

export const DEMO_USER: User = {
  id: 'user-1',
  name: 'Alexandru Strugariu',
  email: 'alex@example.com',
  initials: 'AS',
}

const DEMO_WORKSPACE: Workspace = {
  id: 'ws-1',
  name: 'Licență UNSTPB',
  kind: 'university',
}

const DEMO_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb-1',
    workspaceId: 'ws-1',
    name: 'Sisteme Automate',
    emoji: '🤖',
    pages: [
      { id: 'pg-1', notebookId: 'nb-1', title: 'Feedback Stability', icon: '📊', updatedAt: new Date().toISOString() },
      { id: 'pg-2', notebookId: 'nb-1', title: 'Bode Plots', icon: '📈', updatedAt: new Date().toISOString() },
      { id: 'pg-3', notebookId: 'nb-1', title: 'Root Locus', icon: '✏️', updatedAt: new Date().toISOString() },
    ],
  },
  {
    id: 'nb-2',
    workspaceId: 'ws-1',
    name: 'Programare Avansată',
    emoji: '💻',
    pages: [
      { id: 'pg-4', notebookId: 'nb-2', title: 'Design Patterns', icon: '🏗️', updatedAt: new Date().toISOString() },
      { id: 'pg-5', notebookId: 'nb-2', title: 'CRDT & Sync', icon: '🔄', updatedAt: new Date().toISOString() },
    ],
  },
]

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      user: null,
      theme: 'light',
      currentWorkspace: null,
      currentNotebookId: 'nb-1',
      currentPageId: 'pg-1',
      sidebarCollapsed: false,
      copilotOpen: false,
      workspaces: [],
      notebooks: DEMO_NOTEBOOKS,
      syncStatus: 'synced',
      offlineChanges: 0,
      searchOpen: false,

      login: (user) =>
        set({
          isAuthenticated: true,
          user,
          currentWorkspace: DEMO_WORKSPACE,
          workspaces: [DEMO_WORKSPACE],
          notebooks: DEMO_NOTEBOOKS,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          user: null,
          currentWorkspace: null,
        }),

      completeOnboarding: (workspace) =>
        set({
          hasCompletedOnboarding: true,
          currentWorkspace: workspace,
          workspaces: [workspace],
        }),

      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme)
        set({ theme })
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleCopilot: () => set((s) => ({ copilotOpen: !s.copilotOpen })),

      setCurrentPage: (pageId) => set({ currentPageId: pageId }),
      setCurrentNotebook: (notebookId) => set({ currentNotebookId: notebookId }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setSearchOpen: (searchOpen) => set({ searchOpen }),
      addNotebook: (notebook) => set((s) => ({ notebooks: [...s.notebooks, notebook] })),
      addPage: (notebookId, page) =>
        set((s) => ({
          notebooks: s.notebooks.map((nb) =>
            nb.id === notebookId ? { ...nb, pages: [...nb.pages, page] } : nb
          ),
        })),
    }),
    {
      name: 'second-brain-app',
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        hasCompletedOnboarding: s.hasCompletedOnboarding,
        user: s.user,
        theme: s.theme,
        currentWorkspace: s.currentWorkspace,
        currentPageId: s.currentPageId,
        currentNotebookId: s.currentNotebookId,
        workspaces: s.workspaces,
        notebooks: s.notebooks,
      }),
    }
  )
)
