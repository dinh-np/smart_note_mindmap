"use client";

import { MindmapProvider } from '../store/MindmapContext';
import { MindMapCanvas } from '../components/canvas/MindMapCanvas';
import { GanttView } from '../components/views/GanttView';
import { RaciView } from '../components/views/RaciView';
import { WorkloadView } from '../components/views/WorkloadView';
import { RiskHeatmapView } from '../components/views/RiskHeatmapView';
import { KanbanView } from '../components/views/KanbanView';
import { useState } from 'react';
import { LayoutDashboard, Network, Users, CalendarClock, Flame, Columns, Cloud, CloudOff } from 'lucide-react';
import { useFirebaseSync } from '../hooks/useFirebaseSync';

function Dashboard() {
  const [activeView, setActiveView] = useState<'mindmap' | 'gantt' | 'raci' | 'workload' | 'risk' | 'kanban'>('mindmap');
  const { isOnline } = useFirebaseSync('smart_note_workspace_1');

  return (
    <main className="w-full h-screen flex flex-col overflow-hidden">
      {/* Global View Switcher Header */}
      <header className="h-14 bg-white border-b border-krones-border flex items-center px-4 shrink-0 shadow-sm z-50">
        <div className="flex items-center gap-4 w-full">
          <div className="font-serif text-lg text-krones-primary font-bold flex flex-1 items-center gap-3">
            Smart Note & Mindmap
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-gray-50 text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              {isOnline ? <Cloud size={12} className="text-green-500" /> : <CloudOff size={12} className="text-red-400" />}
              {isOnline ? 'Synced' : 'Offline (Local-First)'}
            </div>
          </div>
          <div className="flex bg-krones-surface p-1 rounded-lg border border-krones-border">
            <button 
              onClick={() => setActiveView('mindmap')} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${activeView === 'mindmap' ? 'bg-white shadow text-krones-primary font-medium' : 'text-krones-muted hover:text-krones-dark'}`}
            >
              <Network size={16} /> Mindmap
            </button>
            <button 
              onClick={() => setActiveView('gantt')} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${activeView === 'gantt' ? 'bg-white shadow text-krones-primary font-medium' : 'text-krones-muted hover:text-krones-dark'}`}
            >
              <LayoutDashboard size={16} /> Gantt Chart
            </button>
            <button 
              onClick={() => setActiveView('raci')} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${activeView === 'raci' ? 'bg-white shadow text-krones-primary font-medium' : 'text-krones-muted hover:text-krones-dark'}`}
            >
              <Users size={16} /> RACI Matrix
            </button>
            <button 
              onClick={() => setActiveView('workload')} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${activeView === 'workload' ? 'bg-white shadow text-krones-primary font-medium' : 'text-krones-muted hover:text-krones-dark'}`}
            >
              <CalendarClock size={16} /> Workload
            </button>
            <button 
              onClick={() => setActiveView('risk')} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${activeView === 'risk' ? 'bg-white shadow text-krones-primary font-medium' : 'text-krones-muted hover:text-krones-dark'}`}
            >
              <Flame size={16} /> Risk Heatmap
            </button>
            <button 
              onClick={() => setActiveView('kanban')} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${activeView === 'kanban' ? 'bg-white shadow text-krones-primary font-medium' : 'text-krones-muted hover:text-krones-dark'}`}
            >
              <Columns size={16} /> Kanban
            </button>
          </div>
          <div className="flex-1 flex justify-end">
            <div className="w-8 h-8 rounded-full bg-krones-primary text-white flex items-center justify-center text-sm">Me</div>
          </div>
        </div>
      </header>

      {/* Main View Area */}
      <div className="flex-1 relative overflow-hidden">
        {activeView === 'mindmap' && <MindMapCanvas />}
        {activeView === 'gantt' && <GanttView />}
        {activeView === 'raci' && <RaciView />}
        {activeView === 'workload' && <WorkloadView />}
        {activeView === 'risk' && <RiskHeatmapView />}
        {activeView === 'kanban' && <KanbanView />}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <MindmapProvider>
      <Dashboard />
    </MindmapProvider>
  );
}

