"use client";

import React, { useMemo, useState } from 'react';
import { useMindmap } from '../../store/MindmapContext';
import { MindNode } from '../../types/mindmap';
import { Plus } from 'lucide-react';

interface TaskRaci {
  id: string;
  topic: string;
  raci: {
    responsible?: string[];
    accountable?: string;
    consulted?: string[];
    informed?: string[];
  };
  originalNode: MindNode;
}

export function RaciView() {
  const { state, dispatch } = useMindmap();
  const [newAssignee, setNewAssignee] = useState('');

  const { tasks, allAssignees } = useMemo(() => {
    if (!state.present) return { tasks: [], allAssignees: [] };

    const taskList: TaskRaci[] = [];
    const assigneesSet = new Set<string>();

    const traverse = (node: MindNode) => {
      // Include nodes that act as tasks or already have RACI defined
      if (node.task || node.raci || (node.children && node.children.length === 0)) {
        taskList.push({
          id: node.id,
          topic: node.topic,
          raci: node.raci || {},
          originalNode: node
        });

        if (node.raci) {
          node.raci.responsible?.forEach(a => assigneesSet.add(a));
          if (node.raci.accountable) assigneesSet.add(node.raci.accountable);
          node.raci.consulted?.forEach(a => assigneesSet.add(a));
          node.raci.informed?.forEach(a => assigneesSet.add(a));
        }
      }
      if (node.children) node.children.forEach(traverse);
    };

    traverse(state.present);
    return { tasks: taskList, allAssignees: Array.from(assigneesSet).sort() };
  }, [state.present]);

  const [extraAssignees, setExtraAssignees] = useState<string[]>([]);
  const combinedAssignees = Array.from(new Set([...allAssignees, ...extraAssignees])).sort();

  const handleAddAssignee = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAssignee.trim() && !combinedAssignees.includes(newAssignee.trim())) {
      setExtraAssignees([...extraAssignees, newAssignee.trim()]);
      setNewAssignee('');
    }
  };

  const toggleRole = (task: TaskRaci, assignee: string, role: 'R' | 'A' | 'C' | 'I') => {
    const currentRaci = { ...task.raci };
    
    // Helper to toggle in array
    const toggleInArray = (arr: string[] = [], val: string) => 
      arr.includes(val) ? arr.filter(a => a !== val) : [...arr, val];

    if (role === 'R') currentRaci.responsible = toggleInArray(currentRaci.responsible, assignee);
    if (role === 'A') currentRaci.accountable = currentRaci.accountable === assignee ? undefined : assignee;
    if (role === 'C') currentRaci.consulted = toggleInArray(currentRaci.consulted, assignee);
    if (role === 'I') currentRaci.informed = toggleInArray(currentRaci.informed, assignee);

    dispatch({
      type: 'UPDATE_NODE',
      payload: {
        id: task.id,
        updates: { raci: currentRaci }
      }
    });
  };

  const getRoleBadges = (task: TaskRaci, assignee: string) => {
    const roles = [];
    if (task.raci.responsible?.includes(assignee)) roles.push('R');
    if (task.raci.accountable === assignee) roles.push('A');
    if (task.raci.consulted?.includes(assignee)) roles.push('C');
    if (task.raci.informed?.includes(assignee)) roles.push('I');
    return roles;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'R': return 'bg-red-100 text-red-800 border-red-200';
      case 'A': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'C': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'I': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-white';
    }
  };

  if (!state.present) return null;

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="p-4 border-b border-krones-border flex justify-between items-center bg-krones-surface">
        <h2 className="text-xl font-serif text-krones-primary font-bold">RACI Matrix Grid</h2>
        <form onSubmit={handleAddAssignee} className="flex gap-2">
          <input
            type="text"
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            placeholder="Add Team Member..."
            className="px-3 py-1.5 border border-krones-border rounded-md text-sm outline-none focus:border-krones-primary"
          />
          <button type="submit" className="bg-krones-primary text-white p-1.5 rounded-md hover:bg-krones-hover">
            <Plus size={20} />
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-max border border-krones-border rounded-lg overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-gray-50 text-krones-dark border-b border-krones-border">
              <tr>
                <th className="px-6 py-3 font-semibold border-r border-krones-border min-w-[250px]">Task / Node</th>
                {combinedAssignees.map(assignee => (
                  <th key={assignee} className="px-4 py-3 font-semibold text-center border-r border-krones-border min-w-[120px]">
                    {assignee}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr><td colSpan={combinedAssignees.length + 1} className="px-6 py-4 text-center text-gray-500">No tasks found. Add nodes in the mindmap.</td></tr>
              ) : tasks.map(task => (
                <tr key={task.id} className="border-b border-krones-border hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-krones-dark border-r border-krones-border">
                    {task.topic}
                  </td>
                  {combinedAssignees.map(assignee => {
                    const activeRoles = getRoleBadges(task, assignee);
                    return (
                      <td key={assignee} className="px-2 py-2 border-r border-krones-border align-top">
                        <div className="flex flex-wrap gap-1 justify-center mb-2">
                          {activeRoles.map(r => (
                            <span key={r} className={`w-6 h-6 flex items-center justify-center text-xs font-bold border rounded-md ${getRoleColor(r)}`}>
                              {r}
                            </span>
                          ))}
                        </div>
                        <div className="flex justify-center gap-1 opacity-20 hover:opacity-100 transition-opacity">
                          {['R', 'A', 'C', 'I'].map(r => (
                            <button
                              key={r}
                              onClick={() => toggleRole(task, assignee, r as any)}
                              className={`w-5 h-5 text-[10px] font-bold rounded-sm border hover:bg-gray-200 ${activeRoles.includes(r) ? 'bg-gray-300' : 'bg-white'}`}
                              title={`Toggle ${r}`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
