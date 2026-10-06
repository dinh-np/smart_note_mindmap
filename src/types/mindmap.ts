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

export interface MindMapRecord {
  id: string;
  title: string;
  updatedAt: number;
  syncStatus: string;
  userId: string;
  rootData: MindNode;
}
