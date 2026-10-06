# CONTEXT HUB: SMART NOTE & MINDMAP (PWA)

## 1. Storage & Sync Architecture Diagram
┌────────────────────────────────────────────────────────────────────────┐
│ [User Touch / Keyboard / Mouse / S-Pen / WebMCP Agent Actions]         │
└───────────────────────────────────┬────────────────────────────────────┘
│
▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: CLIENT LOCAL-FIRST LAYER (Dexie.js / IndexedDB)                │
│ • Database: SmartNoteMindmapDB                                         │
│ • Latency: 0ms (instant local mutation)                                │
│ • Offline status: 100% fully functional without internet               │
│ • Local Encryption: Web Crypto AES-GCM (PIN protected)                 │
│ • Storage Persistence: navigator.storage.persist()                     │
└───────────────────────────────────┬────────────────────────────────────┘
│ (Background Async Flush on)
│ - Device 'online' event
│ - Mobile 'visibilitychange' (hidden)
▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 2: CLOUD SYNC LAYER (Firebase Firestore & Google Auth)            │
│ • Multi-Device sync: Laptop <-> iPad <-> iPhone <-> Android            │
│ • Conflict Resolution: Merge by Unix ms 'updatedAt' timestamp          │
│ • Cloud Collection: /users/{uid}/mindmaps/{mapId}                      │
└────────────────────────────────────────────────────────────────────────┘
## 2. Multi-View Architecture (Single Source of Truth on IndexedDB)
All views read and mutate the exact same `MindNode` tree:
1. **Mindmap View:** Infinite canvas, 2-sided auto-layout, React DOM nodes + SVG Bézier lines.
2. **Gantt Chart View:** CPM critical path highlighting, task dependencies, baseline vs. actual variance.
3. **RACI Matrix View:** 2D Responsibility Grid (WBS items vs. Assignees) with R, A, C, I badges.
4. **Resource Workload View:** Daily allocated hours heatmap per member with >8h over-allocation flags.
5. **Risk Heatmap View:** 5x5 Probability vs. Impact matrix (Green/Yellow/Red risk zones).
6. **Kanban Board View:** Drag-and-drop columns (`backlog`, `todo`, `in_progress`, `review`, `done`).
7. **Daily Agenda View ("My Day"):** Filter tasks due today/this week with quick-check completion.
8. **Obsidian Graph View:** 2D force-directed graph resolving `[[Wikilinks]]` in node descriptions.
9. **Prezi-Style Presentation:** Smooth camera pan/zoom along Level 1 branches with AI speaker notes.

## 3. Implementation Sprint Roadmap
- **Sprint 1: Core Engine, Local-First Canvas & Security [✅ DONE]**
  - Initialize Next.js App Router, Tailwind Krones theme (`#0066AB`), Lucide icons.
  - Setup PWA Manifest and Service Worker (`next-pwa`).
  - Implement `src/lib/db.ts` (Dexie.js with AES-GCM Web Crypto helpers).
  - Build Controlled Canvas (Pure React DOM cards + SVG Bézier lines) with Desktop shortcuts (`Tab`, `Enter`, `Delete`) and Mobile Context Toolbar.
  - 30-step in-memory Undo/Redo stack and full JSON backup/restore.
- **Sprint 2: MindGenius Parser & Multi-View Suite [✅ DONE]**
  - 2-Way MindGenius (`.mgmx`) ZIP/XML parser with UTF-8 encoding.
  - Implement Gantt Chart, RACI Grid, Resource Heatmap, Risk 5x5 Matrix, and Kanban.
- **Sprint 3: Gemini Pro AI Copilot, WebMCP Tools & Office Exporters [✅ DONE]**
  - Next.js Server Action `/api/ai/mindmap` with Rate Limiting (5 req/min) and Dexie prompt caching.
  - In-browser WebMCP tool registration (`src/lib/webmcp.ts`) for canvas command and control.
  - Complete Office export suite: `.pptx`, `.docx`, `.xlsx`, `.xml` (MSPDI), `.pdf`, `.png`.
- **Sprint 4: Firebase Multi-Device Sync & Cross-Platform Hardening [✅ DONE]**
  - Firebase Authentication + Cloud Firestore (RTDB) background sync engine.
  - Mobile touch containment: `touch-none`, Native `PointerEvent` Pinch-to-zoom matrix.
  - Mobile Virtual Keyboard Auto-Pan via `visualViewport`.
  - iOS Web Share API `navigator.share()` fallback for file downloads.
  - Instant background flush to Firebase via `visibilitychange`.
  