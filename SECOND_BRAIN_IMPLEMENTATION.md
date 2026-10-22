# Second Brain: Implementation Plan and Figma Handoff

A note-taking app with block-based text, OneNote-style drawing, instant sync, offline peer-to-peer, AI over your own notes, and a knowledge graph. Bachelor's thesis project (ACS, UNSTPB).

How to use this file: put it in the repo (e.g. `docs/IMPLEMENTATION.md`) and copy section 9 into `CLAUDE.md` at the repo root so Claude Code reads it every session.

---

## 1. Goal and scope

**Product:** desktop-first (web/PWA, optional Tauri), with tablet and mobile layouts.

**Thesis argument (the three things that must work well):**
1. **Real-time sync** of text (character level) and drawings (stroke level) using CRDTs (Yjs).
2. **Offline-first + P2P**: edit with no internet, merge without conflicts, sync directly between nearby devices.
3. **AI on your own notes** (RAG with source citations), including handwriting-to-text.

**Everything else is secondary** (knowledge graph, tasks, settings, onboarding). Build it simple, or list it as "future work". It is better to have 3 excellent features than 8 half-working ones.

### Honest technical caveats (put these in the thesis, not hidden)
- **WebRTC needs a signaling step** even on a LAN. Truly offline P2P means: one device runs a tiny local signaling server, or devices exchange connection data by QR code / copy-paste. Plan the P2P demo around that.
- **Bluetooth LE / Wi-Fi Direct are not available in browsers.** Treat them as "future work" or a native proof of concept. The reliable demo is WebRTC over the local network.
- **Tauri mobile** is still maturing. Use a PWA for tablet/mobile and Tauri only for desktop, if time allows.
- **Handwriting recognition and sketch description need internet** (vision model). Say so in the UI (the design already does).

---

## 2. Recommended stack

| Area | Choice | Notes |
|---|---|---|
| Language | TypeScript everywhere | |
| Monorepo | pnpm workspaces | `apps/web`, `apps/server`, `packages/*` |
| Web app | React + Vite | PWA via `vite-plugin-pwa` |
| Styling | Tailwind CSS + CSS variables from design tokens | Untitled UI-like look |
| Editor | TipTap (ProseMirror) | Collaboration + collaboration caret extensions |
| CRDT | Yjs | one `Y.Doc` per page |
| Sync server | Hocuspocus (Yjs websocket server) | auth + persistence hooks |
| Local persistence | `y-indexeddb` | offline-first |
| P2P | `y-webrtc` (or custom WebRTC provider) | needs signaling, see caveats |
| Drawing | HTML canvas + `perfect-freehand` | stroke data in Yjs; see section 6 |
| Backend/DB | Supabase (Postgres + Auth + `pgvector`) | simplest path to auth + vectors |
| API server | Node (Fastify, or NestJS if you already know it) | AI endpoints, tasks |
| AI | Anthropic or OpenAI API (embeddings + chat + vision) | keys only on the server |
| Graph | `d3-force` or `react-force-graph` | with accessible list view |
| Tests | Vitest, Playwright (multi-tab sync tests) | |

Alternatives if you prefer to save time: **tldraw** for the whole drawing canvas (it has its own sync story, but less control for the thesis), or Supabase Realtime instead of Hocuspocus (loses CRDT benefits, not recommended).

---

## 3. Repository layout

```
second-brain/
  CLAUDE.md                  # copy of section 9
  docs/IMPLEMENTATION.md     # this file
  apps/
    web/                     # React app
      src/
        app/                 # routes, layout shell
        features/
          editor/            # TipTap, slash menu, bubble menu, blocks
          drawing/           # canvas block, palette, strokes
          copilot/           # AI panel, RAG chat
          graph/             # knowledge graph
          search/            # command palette
          sync/              # providers, status indicators
          p2p/               # proximity sync
          auth/ settings/ onboarding/
        lib/                 # yjs setup, api client, utils
    server/                  # hocuspocus + API
  packages/
    tokens/                  # design tokens (from Figma variables)
    ui/                      # shared components (button, input, popover...)
    shared/                  # types shared by web + server
```

---

## 4. Design source (Figma)

- **File:** `https://www.figma.com/design/tmKb2phvSvpbWMXgcnPjPW/Untitled`
- The Figma file is a **specification**, not final code. Implement with real components and tokens; do not copy generated layer structure literally.
- **Node IDs in this file change** when frames are regenerated. Never hard-code a node ID in docs. Always use *Copy link to selection* on the frame you need, at the moment you need it.
- Variables: collections `Second Brain • Foundations` and `Second Brain • Semantic` (Light/Dark). Map them to `packages/tokens` (CSS variables) first.

### Screen map (frame name in Figma → feature)

| Figma frame | Feature | Phase |
|---|---|---|
| Workspace with editor | app shell + editor | 2-3 |
| Editor with slash menu open | slash commands | 3 |
| Editor blocks • Insertion and selection | block types, bubble menu | 3 |
| Workspace with AI Co-pilot open | Co-pilot panel | 7 |
| Drawing mode · pen palette open | canvas block + palette + pen popover | 5 |
| Drawing toolkit • Component specimens | palette docking, tool and swatch states | 5 |
| Drawing popovers • Component specimens | per-tool popovers | 5 |
| Canvas • State board | canvas states (empty, selection, offline...) | 5 |
| Expanded drawing • Light / Dark | full-screen drawing | 5 |
| Drawing recognition • AI Co-pilot / AI drawing • State board | handwriting to text, describe sketch | 7 |
| Knowledge graph • University / State board | graph | 8 |
| Proximity Sync • Sequence board, Nearby collaboration | P2P | 9 |
| Global search • Notes and indexed ink / State board | command palette | 6 |
| Authentication • Login / Register / Recovery / State board | auth | 6 |
| Onboarding • (3 frames) | first-run flow | 6 |
| Settings • Account, Sync, AI and Export | settings | 10 |
| Shared states • Sync, AI and grounded panels | sync/AI status components | 4, 7 |
| Tablet landscape / portrait, Mobile • (2 frames) | responsive layouts | 11 |
| Second Brain • Keyboard and access | shortcuts + accessibility rules | 11 |

### Known design gaps (fix in Figma or decide in code)
- Palette tool icons are inconsistent between frames (placeholder circles, letter glyphs, or real icons). **In code use Lucide icons:** `mouse-pointer-2`, `pen-line`, `highlighter`, `eraser`, `lasso`, `shapes`, `type`, `undo-2`, `redo-2`, `grip-vertical`, `more-horizontal`.
- Some newer frames have no sidebar icons or avatar. The first 3 screens (Workspace, Slash menu, Co-pilot) are the visual reference for the shell.
- No local Figma components exist yet. Treat the toolkit sheet as the spec for states.
- Slash menu has no "Canvas" item in Figma: add it in code (inserts a canvas block).

---

## 5. Data model (starting point)

### Postgres (Supabase)
```sql
workspaces(id, name, kind /* personal|university|project */, owner_id)
notebooks(id, workspace_id, name, position)
pages(id, notebook_id, parent_page_id, title, icon, cover, updated_at)
page_snapshots(page_id, ydoc_state bytea, updated_at)   -- Yjs binary state
page_chunks(id, page_id, block_id, text, embedding vector(1536), updated_at)
page_links(source_page_id, target_page_id, kind /* manual|ai */, score)
tasks(id, page_id, text, due_at, done, source_block_id)
members(workspace_id, user_id, role)
```
- Pages store their content as a **Yjs binary snapshot**, not as JSON blocks. Text extraction for search/RAG happens server-side after each debounced save.

### Yjs document (one per page)
```
ydoc
 ├─ "content"   Y.XmlFragment   -> TipTap/ProseMirror document
 ├─ "canvas:<blockId>"  Y.Map   -> one per canvas block (see section 6)
 └─ awareness   (not persisted) -> cursors, names, colors, live strokes
```

---

## 6. Drawing and ink sync (the OneNote part)

**Canvas block** = a custom TipTap node. It stores only `blockId` and size in the document. The actual strokes live in a separate Yjs structure keyed by that id, so heavy ink data never bloats the text document.

```ts
// committed strokes (persisted + synced via Yjs)
type Stroke = {
  id: string; tool: 'pen' | 'highlighter';
  color: string; width: number; opacity: number;
  points: [x: number, y: number, pressure: number][];
  authorId: string; createdAt: number;
};
// canvas:<blockId> -> Y.Map<strokeId, Stroke>   (immutable once committed)
```

**Rules:**
- **Live strokes** (while the finger/pen is down) travel through **awareness** (ephemeral, throttled ~30-60 ms). On `pointerup` the finished stroke is written **once** to Yjs. This gives a "collaborator is drawing right now" effect without flooding the document.
- **Eraser (stroke mode)** deletes a stroke by id. A pixel eraser is optional (v2): it would split strokes.
- **Undo/redo:** `Y.UndoManager` with a per-user origin, so Alice's undo never removes Bob's strokes.
- **Rendering:** `perfect-freehand` generates the outline from points + pressure; draw to canvas. Keep a "committed" layer and a "live" layer.
- **Input:** Pointer Events, `touch-action: none` on the canvas, use `pointerType` (`pen` / `touch` / `mouse`) for palm rejection, and read `pressure`.
- **Selection / lasso:** hit-test strokes by bounding box, then by point distance. Move/resize edits the strokes' points (a new transaction).
- **Palette:** floating bar, docked bottom by default. Persist dock position and last-used tool per user in local storage. Keyboard shortcuts from the design: **P** pen, **H** highlighter, **E** eraser, **L** lasso.
- **Handwriting to text / describe sketch:** render the selected strokes to a PNG on the client, send it to the server endpoint, which calls a vision model and returns text. Show the result as an editable overlay with accept/reject (see the "Drawing recognition" frames). Always keep the original ink.

---

## 7. Phased implementation plan

Each phase ends with a demo you can show and a measurable check. Do not start a phase before the previous one passes its "Done when".

### Phase 0: Setup (0.5 day)
- [ ] pnpm monorepo, TypeScript, ESLint/Prettier, Vitest, Playwright, CI (GitHub Actions).
- [ ] `apps/web` (Vite + React + Tailwind), `apps/server` (Node), `packages/shared`.
- [ ] Supabase project (Auth + Postgres + pgvector), `.env.example`.

**Done when:** `pnpm dev` starts web + server; CI is green on an empty test.

### Phase 1: Design tokens + base UI (1-2 days)
- [ ] Pull variables from Figma into `packages/tokens` as CSS variables (Light + Dark).
- [ ] Inter font; text styles (sm/md/lg, weights).
- [ ] Base components: Button, Input, Select, Badge, Avatar, Tooltip, Popover, Dialog, Toggle, Slider, SegmentedControl, KbdHint.

**Done when:** a Storybook/Ladle page shows each component in all states (default, hover, focus, disabled), in Light and Dark, and it matches Figma.

### Phase 2: App shell (1-2 days)
- [ ] 3-column layout: sidebar (workspace switcher, quick search, All notes, Graph, My tasks, notebooks tree, Offline/P2P card, sync status, user), content, right Co-pilot panel (collapsible).
- [ ] Routing (`/workspace/:id/page/:pageId`, `/graph`, `/tasks`, `/settings`).
- [ ] Notebook/page tree with nesting (mock data first).

**Done when:** the shell matches the "Workspace with editor" frame at 1440 px.

### Phase 3: Editor (3-4 days)
- [ ] TipTap with blocks: paragraph, H1-H3, to-do, quote, code block, table, image, nested page link.
- [ ] Slash menu (`/`) with search, groups, keyboard navigation (arrows, Enter, Esc), hint chips.
- [ ] Bubble menu on selection; drag handle per block.
- [ ] Page header: title, icon, cover, "Lecture" chip, date, per-page sync status.

**Done when:** all blocks can be created via slash menu and keyboard only; slash menu matches the design.

### Phase 4: Real-time sync + offline (3-4 days)  **(thesis core)**
- [ ] Hocuspocus server with auth hook (Supabase JWT) and persistence (`page_snapshots`).
- [ ] TipTap Collaboration + collaboration caret (names + colors).
- [ ] `y-indexeddb` for offline persistence.
- [ ] Sync status component with states: **synced, syncing, offline (N changes queued), reconnected and merged**.
- [ ] Offline banner and "auto-merged" notice.

**Done when (automated Playwright test):**
1. Two browser contexts edit the same page concurrently, and both converge to identical content.
2. One context goes offline, makes edits, reconnects, and merges with no lost edits.
3. Measure and log round-trip latency (target: < 100-200 ms on localhost; report percentiles in the thesis).

### Phase 5: Drawing (4-6 days)  **(thesis core)**
- [ ] Canvas block node + embedded canvas component (empty, drawing, selection, read-only, offline states).
- [ ] Pen, highlighter, eraser (stroke), lasso/select, shapes, text label.
- [ ] Palette component: tools, color swatches (+ recent + custom), size chip, undo/redo, more menu, docking (bottom/top/left/right), collapse to single button.
- [ ] Per-tool popovers (pen settings first: type, color grid, thickness, opacity, preview).
- [ ] Live strokes via awareness; committed strokes via Yjs; per-user undo.
- [ ] Expanded (full-screen) drawing mode.
- [ ] Pointer/pen/touch handling and palm rejection.

**Done when:** two devices draw on the same canvas and strokes appear on the other side in < ~300 ms; offline strokes sync after reconnect; undo only affects your own strokes.

### Phase 6: Auth, workspaces, onboarding, search (2-3 days)
- [ ] Supabase Auth: login, register, recovery, error states.
- [ ] Onboarding: choose workspace purpose (Personal / University / Project), create first notebook.
- [ ] Global search (Ctrl K): keyword search first (Postgres full-text); semantic results added in Phase 7.

**Done when:** a new user can register, finish onboarding, and land on an empty notebook state.

### Phase 7: AI Co-pilot (4-5 days)  **(thesis core)**
- [ ] Server job: on debounced page save, extract text by block, chunk, embed, upsert `page_chunks`.
- [ ] `POST /ai/ask`: embed the question, retrieve top-k chunks (filtered by scope: notebook / all), and answer **only from the retrieved notes**, returning `[n]` citations with page id + quote.
- [ ] Co-pilot panel: tabs (Ask my notes / To-Do / Summary), scope selector, streaming response, source cards that link to the page and block, copy, thumbs, "no relevant notes found" state, error state.
- [ ] Smart tasks: extract tasks + due dates from page text (structured output) into `tasks`; "My tasks" view.
- [ ] Handwriting to text and describe sketch (section 6).
- [ ] Semantic search results in Ctrl K.

**Done when:** a question about your notes returns an answer with clickable citations; a question with no matching notes says so instead of inventing an answer. Evaluate with a small test set (e.g. 20 questions) and report accuracy in the thesis.

### Phase 8: Knowledge graph (2-3 days)
- [ ] Edges from explicit page links plus embedding similarity above a threshold (`page_links`, kind `ai`).
- [ ] Force-directed view with filters (tag, date), node preview panel, "Open page", zoom/fit.
- [ ] Accessible list alternative ("Show accessible list") and an empty state.

**Done when:** the graph for a seeded notebook matches the design and every edge shows why it exists.

### Phase 9: P2P proximity sync (3-4 days)  **(thesis core)**
- [ ] Settings toggle "Offline / P2P"; Proximity Sync modal: scanning, found devices, connecting, connected, sync progress, success, failed, retry.
- [ ] `y-webrtc` provider over a local signaling server (one device hosts it) or QR/copy-paste connection data.
- [ ] Merge test: two devices with no internet exchange changes and converge.

**Done when:** two laptops on the same Wi-Fi (internet disabled) sync a page and a drawing, and the demo is repeatable.

### Phase 10: Settings and export (1-2 days)
- [ ] Account, sync preferences, AI preferences, export to Markdown/PDF.

### Phase 11: Responsive, accessibility, polish (3-4 days)
- [ ] Tablet (stylus workspace, palette docked left/bottom) and mobile (bottom-sheet palette).
- [ ] Focus rings, keyboard navigation, 44 px touch targets, contrast AA, reduced motion.
- [ ] Empty/loading/error states everywhere; Dark mode.
- [ ] Optional: Tauri desktop wrapper.

### Phase 12: Thesis evaluation (ongoing)
- [ ] Sync latency and convergence benchmarks.
- [ ] Offline merge scenarios and results.
- [ ] RAG quality test set and results.
- [ ] Short usability test (3-5 people) with a task list.

**Suggested timeline:** phases 0-5 are the core demo. If time is short, **cut phases 8, 10 and Tauri**, and keep 4, 5, 7, 9.

---

## 8. Handing the design to Claude (Figma to Claude Code)

### Option A (recommended): Figma MCP server
This lets Claude read your actual frames (structure, styles, variables, screenshots).

1. **Check access.** The Figma MCP server needs your Figma account. Free/Starter plans have a small monthly call limit; a Dev or Full seat on a paid or education plan has far higher limits. Check the current limits at help.figma.com (they change), and if your faculty gave you an education plan, use that account.
2. **Add the server to Claude Code** (works the same from the terminal and from the VS Code / JetBrains extension, since they share the configuration):
   ```bash
   claude mcp add --transport http figma https://mcp.figma.com/mcp
   ```
   Then, inside Claude Code, run `/mcp`, select **figma**, and authenticate in the browser.
   *(If your Figma version offers the desktop Dev Mode MCP server instead, enable it in the Figma desktop app preferences and use the URL it shows. Follow the current Figma docs if these steps differ.)*
3. **Give Claude one frame at a time.** In Figma: right-click the frame → **Copy link to selection**. Then in Claude Code:
   > Implement the "Workspace with editor" frame from this Figma link: `<paste link>`. Use the React + Tailwind setup in this repo and the tokens in `packages/tokens`. Reuse components from `packages/ui`. Match spacing, type and colors exactly. Do not copy absolute positioning.
4. **Typical tools Claude will call:** `get_design_context` (structure + code hints), `get_screenshot` (visual reference), `get_variable_defs` (tokens), `get_metadata` (frame tree). If Claude doesn't call them, ask it to.
5. **Loop for each screen:** implement → open it in the browser → compare with `get_screenshot` → fix differences. Ask Claude to take a screenshot of your running app (Playwright) and compare.

**Tips**
- One screen or one component per prompt. Large frames (the whole "Drawing toolkit" sheet) should be split by section: "the Desktop bottom palette only".
- Start with tokens (Phase 1), then base components, then screens. Doing screens first leads to hard-coded colors.
- Because node IDs change, always paste a **fresh link**.
- Tell Claude which Figma details are *not* final (icons, hard-coded fills, missing sidebar icons, section 4) so it doesn't copy mistakes.

### Option B (no MCP / quota exhausted)
1. Export key frames as **PNG @2x** (select frame → Export) into `docs/design/` and reference them: "Match `docs/design/workspace.png`".
2. Export tokens: Figma **Variables → export** (or a plugin such as "Variables to JSON"), then ask Claude to turn the JSON into `packages/tokens`.
3. Write short per-screen notes in `docs/design/` (layout, states, interactions). The screen map in section 4 is a starting point.

### Option C: Code Connect (later, optional)
Once `packages/ui` components exist, map them to Figma components with Code Connect so generated code reuses your real components. Not needed for the thesis deadline.

---

## 9. CLAUDE.md (copy this to the repo root)

```markdown
# Second Brain: guidance for Claude Code

## Project
Offline-first note-taking app with block-based text, ink drawing, instant CRDT sync (Yjs),
P2P sync (WebRTC), and AI over the user's own notes (RAG with citations).
Bachelor's thesis project. Full plan: docs/IMPLEMENTATION.md.

## Stack
pnpm monorepo, TypeScript, React + Vite + Tailwind, TipTap + Yjs, Hocuspocus,
y-indexeddb, y-webrtc, Supabase (Postgres, Auth, pgvector), Node server for AI endpoints.
Tests: Vitest + Playwright.

## Rules
- Work phase by phase from docs/IMPLEMENTATION.md. Do not start a later phase early.
- Plan first: for any task bigger than ~50 lines, outline the approach and files, then implement.
- UI must match the Figma design. Use the Figma MCP tools (get_design_context, get_screenshot,
  get_variable_defs) on the link the user pastes. Never invent UI that isn't in the design;
  ask if something is missing.
- Use design tokens from packages/tokens only. No hard-coded colors, spacing or font sizes.
- Reuse components from packages/ui before creating new ones.
- Icons: lucide-react.
- Strict TypeScript, no `any`. Shared types live in packages/shared.
- Never put API keys in client code. AI calls go through apps/server.
- Sync/ink code needs tests: concurrent edits, offline merge, per-user undo.
- Accessibility: visible focus, keyboard operable, 44px touch targets, AA contrast.
- Small commits with clear messages. Run `pnpm lint && pnpm test` before finishing a task.
- Known design gaps are listed in docs/IMPLEMENTATION.md section 4. Don't copy them.

## Commands
pnpm dev | pnpm build | pnpm lint | pnpm test | pnpm e2e
```

---

## 10. Prompts to start each phase (paste into Claude Code)

**Phase 0**
> Read docs/IMPLEMENTATION.md. Set up Phase 0: a pnpm monorepo with apps/web (Vite + React + TS + Tailwind), apps/server (Node + TS), packages/shared, ESLint, Prettier, Vitest, Playwright and a GitHub Actions CI. Show me the plan first, then implement.

**Phase 1**
> Use the Figma MCP `get_variable_defs` on this Figma link: `<link to any frame>`. Create `packages/tokens` with Light and Dark CSS variables and wire them into Tailwind. Then build the base components listed in Phase 1 in `packages/ui` with a Ladle/Storybook page showing all states.

**Phase 3**
> Implement the TipTap editor and slash menu from the "Editor with slash menu open" frame: `<link>`. Blocks and keyboard behavior are listed in Phase 3 of docs/IMPLEMENTATION.md. Add a Canvas item that inserts a placeholder block for Phase 5.

**Phase 4**
> Implement Phase 4: Hocuspocus server with Supabase JWT auth and snapshot persistence, TipTap collaboration with carets, y-indexeddb offline support, and the sync status component. Then write the Playwright tests described under "Done when" (concurrent edit convergence, offline merge, latency logging).

**Phase 5**
> Implement the drawing canvas block following section 6 of docs/IMPLEMENTATION.md and the Figma frames "Drawing mode · pen palette open" `<link>` and "Drawing toolkit • Component specimens" `<link to the Desktop bottom section>`. Start with pen + eraser + live strokes via awareness, commit on pointerup, per-user undo. Add the palette and pen popover after the core works.

**Phase 7**
> Implement the RAG pipeline: chunk and embed pages on save into `page_chunks` (pgvector), `POST /ai/ask` that answers only from retrieved chunks with `[n]` citations, and the Co-pilot panel from `<link>`. It must say when no relevant notes are found. Add a small evaluation script with 20 question/answer pairs.

**Phase 9**
> Implement Proximity Sync with y-webrtc and a minimal local signaling server (and a QR/copy-paste fallback). Build the modal states from the "Proximity Sync • Sequence board" frame `<link>`. Add a test that two peers converge with no internet.

---

## 11. Definition of done (per feature)
- Matches the Figma frame (compare screenshots) in Light and Dark.
- All states implemented: default, hover, focus, active, disabled, loading, empty, error, offline where relevant.
- Keyboard accessible; no console errors.
- Unit/e2e tests for sync-critical code.
- Short note added to the thesis log (what, why, measured result).
