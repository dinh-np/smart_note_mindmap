# PROJECT CONTEXT: SMART NOTE & MINDMAP (PWA)

## 1. System Vision & Objective
- **Application Name:** Smart Note & Mindmap (Sơ Đồ Tư Duy & Ghi Chú Thông Minh).
- **Project Identifier:** `smart_note_mindmap`.
- **Core Mission:** An Enterprise-Grade, Local-First Visual Thinking, Note-Taking, and Project Management PWA (a web-native alternative to MindGenius, MS Project, Obsidian, and Notion).
- **Core Philosophy:** 0ms input latency, 100% offline-ready, zero-knowledge local encryption (AES-GCM), real-time background Cloud Firestore sync, Google Gemini Pro AI copilot, and in-browser WebMCP tool execution.

## 2. CRITICAL ARCHITECTURAL MANDATE: NO MIND-ELIXIR
- **ABSOLUTELY NO `mind-elixir` library:** Do not use `mind-elixir`. Its custom elements (`<me-main>`, `<me-tpc>`) conflict with Tailwind CSS Preflight, causing node layout collapse into full-width horizontal ribbons.
- **Canvas Implementation:** Use **Controlled Canvas Architecture** (Pure React DOM nodes with Tailwind CSS + underlying SVG canvas for cubic Bézier branch connectors).

## 3. Design System: Corporate Light Theme (Krones Inspired)
- **Primary Color:** `#0066AB` (Root nodes, primary headers, active CTA buttons).
- **Secondary Blue:** `#004B7D` (Hover/focus states).
- **Background Canvas:** `#ffffff` (Clean infinite interactive workspace).
- **Surfaces & Panels:** `#f8f9fa` (Toolbars, inspectors, modals).
- **Borders:** `#e2e8f0` / `#cbd5e1` (1.5px subtle node borders).
- **Typography:**
  - UI & Body Text: `'Noto Sans', sans-serif` (Strictly tuned for Vietnamese diacritics).
  - Editorial Accents: `'Georgia', serif` (Root topic titles, slide cover presentations).

## 4. Technology Stack Specification
- **Framework:** Next.js (App Router, React 19, TypeScript, Tailwind CSS, Lucide React Icons).
- **PWA Runtime:** `@ducanh2912/next-pwa` (Service Worker, Web App Manifest, offline caching).
- **Client Storage (Tier 1):** IndexedDB via `dexie` (`SmartNoteMindmapDB`) – 0ms latency, Web Crypto AES-GCM encryption with user PIN.
- **Cloud Database (Tier 2):** Firebase (Cloud Firestore + Google Authentication) with timestamp-based conflict merging and immediate flush on app blur (`visibilitychange`).
- **AI Engine:** Google Gemini API (`gemini-2.0-flash` / `gemini-1.5-pro` via Server Actions `/api/ai/mindmap`) with 5 req/min rate limit and Dexie prompt cache.
- **Agentic Protocol:** WebMCP (`document.modelContext.registerTool`) with fallback to Gemini Function Calling.
- **Multi-View Suite:** Mindmap View, Gantt Chart View (`frappe-gantt`), Kanban Board, RACI Matrix, Risk Heatmap (5x5), Obsidian Graph View (`[[Wikilinks]]`).
- **Office Interop:** MindGenius (`.mgmx` 2-way parser), PowerPoint (`.pptx`), Word (`.docx`), Excel (`.xlsx` WBS), MS Project (`.xml` MSPDI), PDF/PNG.

## 5. Build & Architecture Status
- **Current State:** **PRODUCTION READY (Sprint 1-4 Complete)**.
- **Folder Structure Fixed:** The accidental nested `smart_note_mindmap/smart_note_mindmap` directory has been completely flattened to the root workspace `e:\SourceCode\smart_note_mindmap`.
- **Final Checks:** Multi-touch `PointerEvent` matrices, Firebase WebSockets, and Dexie WebCrypto layers have all passed Next.js Webpack 5 static analysis. Ready for Vercel deployment!
