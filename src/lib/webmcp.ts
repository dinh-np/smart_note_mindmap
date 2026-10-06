import { MindNode } from '../types/mindmap';

export interface WebMCPTool {
  name: string;
  description: string;
  parameters: object;
  execute: (args: any) => Promise<any>;
}

export function registerCanvasTools(dispatch: any, rootNode: MindNode | null) {
  if (typeof document !== 'undefined' && !(document as any).modelContext) {
    (document as any).modelContext = {
      tools: [],
      registerTool(tool: WebMCPTool) {
        const idx = this.tools.findIndex((t: any) => t.name === tool.name);
        if (idx !== -1) this.tools[idx] = tool;
        else this.tools.push(tool);
      }
    };
  }

  const modelContext = typeof document !== 'undefined' ? (document as any).modelContext : null;
  if (!modelContext) return;

  modelContext.registerTool({
    name: 'add_node',
    description: 'Add a new child node to a specific parent',
    parameters: { parentId: 'string', topic: 'string' },
    execute: async ({ parentId, topic }: any) => {
      dispatch({ type: 'ADD_NODE', payload: { parentId, node: { id: crypto.randomUUID(), topic } } });
      return { success: true };
    }
  });

  modelContext.registerTool({
    name: 'update_node',
    description: 'Update attributes of a node',
    parameters: { nodeId: 'string', updates: 'object' },
    execute: async ({ nodeId, updates }: any) => {
      dispatch({ type: 'UPDATE_NODE', payload: { id: nodeId, updates } });
      return { success: true };
    }
  });

  modelContext.registerTool({
    name: 'delete_node',
    description: 'Delete a node',
    parameters: { nodeId: 'string' },
    execute: async ({ nodeId }: any) => {
      dispatch({ type: 'DELETE_NODE', payload: { id: nodeId } });
      return { success: true };
    }
  });

  modelContext.registerTool({
    name: 'get_project_summary',
    description: 'Get total project node count and root topic',
    parameters: {},
    execute: async () => {
      if (!rootNode) return { count: 0 };
      let count = 0;
      const traverse = (n: MindNode) => { count++; if(n.children) n.children.forEach(traverse); };
      traverse(rootNode);
      return { count, rootTopic: rootNode.topic };
    }
  });
}
