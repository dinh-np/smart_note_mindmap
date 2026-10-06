# CONTINUITY SKILL: SYSTEM INTEGRITY RULES FOR SMART_NOTE_MINDMAP

## 1. Zero-Error Compilation & Type-Safety Rules
- **No `mind-elixir` Imports:** Never re-introduce `mind-elixir` into any component or stylesheet.
- **Web Crypto Strict Casting:** When invoking `crypto.subtle` methods (PBKDF2, AES-GCM), explicitly cast byte buffers as `BufferSource` or `Uint8Array<ArrayBuffer>` to prevent `SharedArrayBuffer` mismatch errors on modern TypeScript compilers.
- **Build Verification:** Every commit must pass `npm run build` with exit code 0 and zero TypeScript errors.

## 2. Local-First Priority & Offline Rules
- **IndexedDB First:** Every UI mutation (adding nodes, renaming, dragging, deleting) must write directly to `db.mindmaps` (Dexie.js) first. The app must remain 100% operational offline without requiring login.
- **Cloud Sync:** When authenticated with Google and online, trigger background sync to Firestore with timestamp-based conflict merging (`updatedAt`).

## 3. Canonical MindNode Schema
All modules (Canvas, Gantt, AI, Exporters, Sync engine) must strictly adhere to this interface:
```typescript
export interface MindNode {
  id: string;
  topic: string;
  description?: string; // Rich Markdown / [[Wikilinks]]
  tags?: string[];
  status?: 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
  color?: string;
  image?: string; // Compressed Base64 DataURL (< 300KB)

  // Project Management & WBS
  task?: {
    startDate?: string;   // YYYY-MM-DD
    endDate?: string;     // YYYY-MM-DD
    duration?: number;    // Days
    progress?: number;    // 0 - 100%
    assignee?: string;
    priority?: 'low' | 'medium' | 'high';
    dependencies?: string[]; // Predecessor node IDs for Critical Path
    isDailyFocus?: boolean;
  };

  // Advanced Enterprise Metadata
  baseline?: { startDate?: string; endDate?: string; plannedCost?: number };
  workload?: { estimatedHours?: number; actualHours?: number };
  risk?: { probability?: 1|2|3|4|5; impact?: 1|2|3|4|5; mitigationPlan?: string };
  raci?: { responsible?: string[]; accountable?: string; consulted?: string[]; informed?: string[] };
  presentation?: { slideOrder?: number; speakerNotes?: string };

  children?: MindNode[];
}