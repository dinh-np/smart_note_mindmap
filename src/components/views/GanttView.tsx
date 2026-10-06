"use client";

import React, { useEffect, useRef, useState } from 'react';
import Gantt from 'frappe-gantt';
import './gantt.css';
import { useMindmap } from '../../store/MindmapContext';
import { MindNode } from '../../types/mindmap';

interface FrappeTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: string;
  custom_class?: string;
  _sourceNode: MindNode;
}

export function GanttView() {
  const { state, dispatch } = useMindmap();
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Day');

  useEffect(() => {
    if (!state.present || !ganttRef.current) return;

    // Flatten tree and extract nodes with task info
    const tasks: FrappeTask[] = [];

    const traverse = (node: MindNode) => {
      if (node.task && node.task.startDate && node.task.endDate) {
        tasks.push({
          id: node.id,
          name: node.topic,
          start: node.task.startDate,
          end: node.task.endDate,
          progress: node.task.progress || 0,
          dependencies: node.task.dependencies ? node.task.dependencies.join(', ') : '',
          custom_class: node.color ? `gantt-bar-${node.id}` : '',
          _sourceNode: node
        });
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    };

    traverse(state.present);

    if (tasks.length === 0) {
      ganttRef.current.innerHTML = '<div class="text-gray-500 italic p-4">No tasks with Start Date and End Date found in the mindmap.</div>';
      return;
    }

    ganttRef.current.innerHTML = '';

    // Initialize frappe-gantt
    ganttInstance.current = new Gantt(ganttRef.current, tasks, {
      on_click: (task: FrappeTask) => {
        dispatch({ type: 'SELECT_NODE', payload: task.id });
      },
      on_date_change: (task: FrappeTask, start: Date, end: Date) => {
        // format date YYYY-MM-DD
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];
        const currentTask = task._sourceNode.task;
        
        dispatch({
          type: 'UPDATE_NODE',
          payload: {
            id: task.id,
            updates: {
              task: {
                ...currentTask,
                startDate: startStr,
                endDate: endStr
              }
            }
          }
        });
      },
      on_progress_change: (task: FrappeTask, progress: number) => {
        const currentTask = task._sourceNode.task;
        dispatch({
          type: 'UPDATE_NODE',
          payload: {
            id: task.id,
            updates: {
              task: {
                ...currentTask,
                progress
              }
            }
          }
        });
      },
      view_mode: viewMode,
    });

    return () => {
       if (ganttRef.current) ganttRef.current.innerHTML = '';
    }
  }, [state.present, dispatch, viewMode]);

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="p-4 border-b border-krones-border flex justify-between items-center bg-krones-surface">
        <h2 className="text-xl font-serif text-krones-primary font-bold">Project Schedule (Gantt)</h2>
        <div className="flex gap-2">
          {['Day', 'Week', 'Month'].map(mode => (
            <button 
              key={mode} 
              onClick={() => setViewMode(mode as any)}
              className={`px-3 py-1 rounded text-sm ${viewMode === mode ? 'bg-krones-primary text-white' : 'bg-white border text-krones-dark hover:bg-gray-50'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 relative">
        <div ref={ganttRef} className="w-full" />
      </div>
    </div>
  );
}
