"use client";

import React, { useMemo, useState } from 'react';
import { useMindmap } from '../../store/MindmapContext';
import { MindNode } from '../../types/mindmap';

type StatusType = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

const COLUMNS: { id: StatusType; title: string; color: string }[] = [
  { id: 'backlog', title: 'Backlog', color: 'bg-gray-100 border-gray-300' },
  { id: 'todo', title: 'To Do', color: 'bg-blue-50 border-blue-200' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-orange-50 border-orange-200' },
  { id: 'review', title: 'Review', color: 'bg-purple-50 border-purple-200' },
  { id: 'done', title: 'Done', color: 'bg-green-50 border-green-200' }
];

export function KanbanView() {
  const { state, dispatch } = useMindmap();
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const tasks = useMemo(() => {
    if (!state.present) return [];
    
    const taskList: MindNode[] = [];
    const traverse = (node: MindNode) => {
      // Treat nodes with 'status' or 'task' as Kanban items
      if (node.status || node.task) {
        taskList.push(node);
      }
      if (node.children) node.children.forEach(traverse);
    };
    
    traverse(state.present);
    return taskList;
  }, [state.present]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedNodeId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e: React.DragEvent, newStatus: StatusType) => {
    e.preventDefault();
    const nodeId = e.dataTransfer.getData('text/plain');
    if (!nodeId) return;

    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        id: nodeId,
        updates: { status: newStatus }
      }
    });
    setDraggedNodeId(null);
  };

  const getPriorityColor = (priority?: string) => {
    if (priority === 'high') return 'bg-red-500';
    if (priority === 'medium') return 'bg-yellow-500';
    return 'bg-blue-400';
  };

  if (!state.present) return null;

  return (
    <div className="w-full h-full bg-krones-surface flex flex-col">
      <div className="p-4 border-b border-krones-border flex justify-between items-center bg-white shrink-0 shadow-sm">
        <h2 className="text-xl font-serif text-krones-primary font-bold">Kanban Board</h2>
        <span className="text-sm text-gray-500 font-medium">{tasks.length} Active Tasks</span>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 flex gap-6">
        {COLUMNS.map(col => {
          // Default to backlog if no status is explicitly set but node is a task
          const colTasks = tasks.filter(t => (t.status || 'backlog') === col.id);

          return (
            <div 
              key={col.id}
              className={`flex-none w-80 flex flex-col rounded-xl border ${col.color} bg-white shadow-sm overflow-hidden h-full`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className="p-4 border-b border-gray-200/50 bg-gray-50/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700">{col.title}</h3>
                <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                  {colTasks.length}
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-[200px]">
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={() => setDraggedNodeId(null)}
                    className={`bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow hover:border-gray-300 ${draggedNodeId === task.id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-800 text-sm">{task.topic}</h4>
                      {task.task?.priority && (
                        <span 
                          className={`w-3 h-3 rounded-full shrink-0 shadow-sm ${getPriorityColor(task.task.priority)}`} 
                          title={`Priority: ${task.task.priority}`} 
                        />
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                    )}
                    
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <div className="text-xs font-medium text-gray-500">
                        {task.task?.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-krones-primary text-white flex items-center justify-center text-[10px]">
                              {task.task.assignee.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[80px]">{task.task.assignee}</span>
                          </div>
                        ) : 'Unassigned'}
                      </div>
                      
                      {task.task?.endDate && (
                        <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${new Date(task.task.endDate) < new Date() && col.id !== 'done' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                          {task.task.endDate.substring(5)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {colTasks.length === 0 && (
                  <div className="h-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center opacity-50 text-xs text-gray-400 font-medium">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
