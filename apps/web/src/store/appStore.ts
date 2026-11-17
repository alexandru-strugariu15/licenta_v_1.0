import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error'
export type Theme = 'light' | 'dark'

export interface Workspace {
  id: string
  name: string
  kind: 'personal' | 'university' | 'project'
}

export interface CanvasStroke {
  id: string
  tool: 'pen' | 'highlighter'
  color: string
  width: number
  opacity: number
  points: [number, number, number][]
}

export interface Page {
  id: string
  notebookId: string
  title: string
  icon: string
  updatedAt: string
  cover?: string
  content?: string
  canvasStrokes?: CanvasStroke[]
  showCanvas?: boolean
}

export interface Notebook {
  id: string
  workspaceId: string
  name: string
  emoji: string
  pages: Page[]
}

export interface User {
  id: string
  name: string
  email: string
  initials: string
}

export interface AppSettings {
  syncServerUrl: string
  enableP2P: boolean
  p2pSignalingUrl: string
  aiProvider: 'openai' | 'anthropic' | 'local'
  aiApiKey: string
  aiModel: string
  autoSummarize: boolean
  chunkSize: number
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

  // UI Modals
  searchOpen: boolean
  settingsOpen: boolean
  proximityOpen: boolean

  // Settings
  settings: AppSettings

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
  setSettingsOpen: (open: boolean) => void
  setProximityOpen: (open: boolean) => void
  updateSettings: (updates: Partial<AppSettings>) => void

  // Data Actions
  addNotebook: (notebook: Notebook) => void
  deleteNotebook: (notebookId: string) => void
  updateNotebook: (notebookId: string, updates: Partial<Notebook>) => void
  addPage: (notebookId: string, page: Page) => void
  updatePage: (notebookId: string, pageId: string, updates: Partial<Page>) => void
  deletePage: (notebookId: string, pageId: string) => void
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

const DEFAULT_SETTINGS: AppSettings = {
  syncServerUrl: 'ws://localhost:3001',
  enableP2P: true,
  p2pSignalingUrl: 'ws://localhost:3001/signaling',
  aiProvider: 'openai',
  aiApiKey: '',
  aiModel: 'gpt-4o-mini',
  autoSummarize: true,
  chunkSize: 350,
}

const INITIAL_CONTENT_PG1 = `<h2>Closed-loop stability</h2>
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

const INITIAL_CONTENT_PG2 = `<h2>Bode Plot Analysis & Stability Margins</h2>
<p>The frequency response method provides direct insight into system stability without explicitly solving for roots of high-order polynomials.</p>

<h3>Key Definitions</h3>
<p>Stability margins measure the robustness of the closed-loop system:</p>
<ul>
  <li><strong>Gain Margin (GM):</strong> The factor by which the open-loop gain can be increased before the system becomes unstable. Measured at the phase crossover frequency $\\omega_{pc}$ where $\\angle G(j\\omega) = -180^\\circ$.</li>
  <li><strong>Phase Margin (PM):</strong> The amount of additional phase lag required at the gain crossover frequency $\\omega_{gc}$ (where $|G(j\\omega)| = 1 = 0\\text{ dB}$) to bring the system to the verge of instability.</li>
</ul>

<blockquote>
  <p>Rule of thumb for industrial control loops: A phase margin of <strong>45° to 60°</strong> and gain margin <strong>&gt; 6 dB</strong> yields optimal damping and step response settling time.</p>
</blockquote>

<pre><code>GM = -20 * log10(|G(j*omega_pc)|) [dB]
PM = 180 + angle(G(j*omega_gc)) [deg]</code></pre>`

const INITIAL_CONTENT_PG3 = `<h2>Root Locus Construction Rules</h2>
<p>The root locus is the trajectory of the closed-loop poles on the complex s-plane as a scalar system parameter (usually the loop gain $K$) varies from $0$ to $+\\infty$.</p>

<h3>Fundamental Evans Rules:</h3>
<ol>
  <li><strong>Number of branches:</strong> Equal to the number of poles of the open-loop transfer function $n$.</li>
  <li><strong>Symmetry:</strong> The root locus is always symmetric with respect to the real axis $\\sigma$.</li>
  <li><strong>Real-axis segments:</strong> A point on the real axis belongs to the root locus if the total number of real open-loop poles and zeros to its right is <em>odd</em>.</li>
  <li><strong>Asymptotes:</strong> For large values of $K$, $n - m$ branches approach straight-line asymptotes intersecting at center of gravity $\\sigma_a$.</li>
</ol>

<pre><code>sigma_a = (sum(poles) - sum(zeros)) / (n - m)
angle_k = (2*k + 1) * 180 / (n - m)</code></pre>`

const INITIAL_CONTENT_PG4 = `<h2>Architectural & Behavioral Design Patterns</h2>
<p>Modern collaborative software relies on proven architectural patterns to guarantee clean separation of concerns, testability, and event-driven reactivity.</p>

<h3>Key Patterns in Second Brain:</h3>
<ul>
  <li><strong>Observer / Reactive Store:</strong> Zustand state slices subscribe to document mutations, publishing updates to the UI tree with minimal re-renders.</li>
  <li><strong>Command Pattern:</strong> TipTap editor transactions encapsulate text modifications into undoable and redoable operational units.</li>
  <li><strong>Strategy Pattern:</strong> AI integration allows hot-swapping between cloud LLMs (OpenAI, Anthropic) and local edge inference (Ollama).</li>
  <li><strong>Event-Driven Gateway:</strong> WebSocket events mediate between client local CRDT vectors and the server persistence relay.</li>
</ul>`

const INITIAL_CONTENT_PG5 = `<h2>CRDT & Conflict-Free Distributed Synchronization</h2>
<p>Conflict-free Replicated Data Types (CRDTs) allow concurrent updates on distributed peers without a central lock manager or transaction coordinator.</p>

<h3>Yjs Internal Model</h3>
<p>Yjs structures the collaborative document as a doubly-linked tree of character-level and stroke-level item chunks:</p>
<ul>
  <li><strong>State Vector:</strong> A map of <code>(client_id -&gt; clock)</code> that summarizes all operations known to the current replica.</li>
  <li><strong>Update Vector:</strong> The delta payload containing only items created after the remote peer's clock.</li>
  <li><strong>Convergence Guarantee:</strong> Strong Eventual Consistency (SEC) holds because integration rules are commutative and idempotent.</li>
</ul>

<blockquote>
  <p>“Even under zero internet connectivity, peers communicating over local WebRTC mesh exchange state vectors and reach identical state deterministically.”</p>
</blockquote>`

export const DEMO_NOTEBOOKS: Notebook[] = [
  {
    id: 'nb-1',
    workspaceId: 'ws-1',
    name: 'Sisteme Automate',
    emoji: '🤖',
    pages: [
      {
        id: 'pg-1',
        notebookId: 'nb-1',
        title: 'Feedback Stability',
        icon: '📊',
        updatedAt: new Date().toISOString(),
        content: INITIAL_CONTENT_PG1,
        showCanvas: true,
      },
      {
        id: 'pg-2',
        notebookId: 'nb-1',
        title: 'Bode Plots',
        icon: '📈',
        updatedAt: new Date().toISOString(),
        content: INITIAL_CONTENT_PG2,
        showCanvas: false,
      },
      {
        id: 'pg-3',
        notebookId: 'nb-1',
        title: 'Root Locus',
        icon: '✏️',
        updatedAt: new Date().toISOString(),
        content: INITIAL_CONTENT_PG3,
        showCanvas: true,
      },
    ],
  },
  {
    id: 'nb-2',
    workspaceId: 'ws-1',
    name: 'Programare Avansată',
    emoji: '💻',
    pages: [
      {
        id: 'pg-4',
        notebookId: 'nb-2',
        title: 'Design Patterns',
        icon: '🏗️',
        updatedAt: new Date().toISOString(),
        content: INITIAL_CONTENT_PG4,
        showCanvas: false,
      },
      {
        id: 'pg-5',
        notebookId: 'nb-2',
        title: 'CRDT & Sync',
        icon: '🔄',
        updatedAt: new Date().toISOString(),
        content: INITIAL_CONTENT_PG5,
        showCanvas: false,
      },
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
      settingsOpen: false,
      proximityOpen: false,
      settings: DEFAULT_SETTINGS,

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
      setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
      setProximityOpen: (proximityOpen) => set({ proximityOpen }),
      updateSettings: (updates) => set((s) => ({ settings: { ...s.settings, ...updates } })),

      addNotebook: (notebook) =>
        set((s) => ({
          notebooks: [...s.notebooks, notebook],
          currentNotebookId: notebook.id,
        })),

      deleteNotebook: (notebookId) =>
        set((s) => {
          const filtered = s.notebooks.filter((nb) => nb.id !== notebookId)
          const nextNb = filtered[0] || null
          return {
            notebooks: filtered,
            currentNotebookId: nextNb ? nextNb.id : null,
            currentPageId: nextNb?.pages[0]?.id || null,
          }
        }),

      updateNotebook: (notebookId, updates) =>
        set((s) => ({
          notebooks: s.notebooks.map((nb) =>
            nb.id === notebookId ? { ...nb, ...updates } : nb
          ),
        })),

      addPage: (notebookId, page) =>
        set((s) => ({
          notebooks: s.notebooks.map((nb) =>
            nb.id === notebookId ? { ...nb, pages: [...nb.pages, page] } : nb
          ),
          currentPageId: page.id,
          currentNotebookId: notebookId,
        })),

      updatePage: (notebookId, pageId, updates) =>
        set((s) => ({
          notebooks: s.notebooks.map((nb) =>
            nb.id === notebookId
              ? {
                  ...nb,
                  pages: nb.pages.map((p) =>
                    p.id === pageId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
                  ),
                }
              : nb
          ),
        })),

      deletePage: (notebookId, pageId) =>
        set((s) => {
          const updatedNotebooks = s.notebooks.map((nb) =>
            nb.id === notebookId
              ? { ...nb, pages: nb.pages.filter((p) => p.id !== pageId) }
              : nb
          )
          const targetNb = updatedNotebooks.find((nb) => nb.id === notebookId)
          const nextPg = targetNb?.pages[0] || null
          return {
            notebooks: updatedNotebooks,
            currentPageId: s.currentPageId === pageId ? nextPg?.id || null : s.currentPageId,
          }
        }),
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
        settings: s.settings,
      }),
    }
  )
)
