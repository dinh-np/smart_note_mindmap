# SKILL: GOOGLE GEMINI PRO AI & WEBMCP INTEGRATION

## 1. System Role & Architecture Overview
- **Service Route:** Next.js Server Action (`/api/ai/mindmap`) invoking the Google Gen AI SDK.
- **Models:** Primary: `gemini-2.0-flash` (low-latency generation); Fallback: `gemini-1.5-pro` (deep WBS task breakdown).
- **Output Enforcement:** Strict Structured Outputs using `response_mime_type: "application/json"`.
- **Target Schema:** Recursively outputs canonical `MindNode` JSON tree compatible with `SmartNoteMindmapDB`.

## 2. Token & Rate-Limiting Governance (Protection Layer)
To prevent `429 Too Many Requests` when sharing API quotas across projects:
1. **Client-Side Cache Verification:**
   - Compute SHA-256 hash of prompt string + active mode.
   - Query Dexie table `db.aiCache.get(promptHash)`.
   - If a valid cached tree exists (< 24 hours old), render immediately with zero API consumption.
2. **In-Flight Rate Throttling:**
   - Throttle client requests to a hard limit of **5 requests per minute** per device.
   - Enforce an exponential backoff retry mechanism (initial delay: 1000ms, factor: 2x, max retries: 3).

## 3. Server Action Prompt Engineering & JSON Schema

```typescript
import { GoogleGenAI, Type, Schema } from '@google/genai';

const mindNodeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    topic: { type: Type.STRING },
    description: { type: Type.STRING },
    color: { type: Type.STRING },
    task: {
      type: Type.OBJECT,
      properties: {
        duration: { type: Type.NUMBER },
        priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
        dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    risk: {
      type: Type.OBJECT,
      properties: {
        probability: { type: Type.INTEGER },
        impact: { type: Type.INTEGER },
        mitigationPlan: { type: Type.STRING },
      },
    },
    children: {
      type: Type.ARRAY,
      items: { type: Type.OBJECT }, // Recursive MindNode reference
    },
  },
  required: ['id', 'topic'],
};

4. Operational In-App AI Modes
Text-to-Mindmap / WBS Decomposition:

Input: Topic prompt, lecture syllabus, or project scope document.

Output: 3-4 tier hierarchical tree with auto-assigned task durations and dependencies.

Branch Expansion (Brainstorming Co-Pilot):

Input: Selected MindNode context and user intent.

Output: 3 to 5 logical child nodes appended dynamically to the current branch.

Risk & Mitigation Assessment:

Analyzes project deliverables; outputs 5x5 Risk scores (probability: 1-5, impact: 1-5) and actionable mitigation steps.

Presentation Speaker Notes Generator:

Iterates through Level 1 branches and drafts concise 2-minute executive speaker notes for Prezi presentation mode.

5. In-Browser WebMCP Tool Calling (src/lib/webmcp.ts)
Registers browser-level tools via document.modelContext.registerTool(...) (W3C WebMCP standard) with a direct fallback to Gemini Function Calling:
export interface WebMCPTool {
  name: string;
  description: string;
  parameters: object;
  execute: (args: any) => Promise<any>;
}

// Canonical Registered WebMCP Tools:
// 1. add_node({ parentId, topic, priority, duration, assignee })
// 2. update_node({ nodeId, updates: Partial<MindNode> })
// 3. delete_node({ nodeId })
// 4. focus_node({ nodeId }) -> Smooth canvas transform pan/zoom to center the target node
// 5. get_project_summary() -> Returns WBS metrics, critical path status, and overdue count
// 6. export_project({ format: 'mgmx' | 'pptx' | 'docx' | 'xlsx' | 'xml' | 'pdf' })

