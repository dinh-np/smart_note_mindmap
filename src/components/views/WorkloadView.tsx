"use client";

import React, { useMemo } from 'react';
import { useMindmap } from '../../store/MindmapContext';
import { MindNode } from '../../types/mindmap';

interface WorkloadEntry {
  date: string; // YYYY-MM-DD
  hours: number;
}

export function WorkloadView() {
  const { state } = useMindmap();

  const { assigneesData, dateRange } = useMemo(() => {
    if (!state.present) return { assigneesData: {}, dateRange: [] };

    // Map: Assignee -> Map<Date, hours>
    const workloadMap: Record<string, Record<string, number>> = {};
    let minDate = '9999-12-31';
    let maxDate = '0000-01-01';

    const traverse = (node: MindNode) => {
      const { task, workload } = node;
      
      if (task?.assignee && task.startDate && task.endDate) {
        const assignee = task.assignee;
        if (!workloadMap[assignee]) workloadMap[assignee] = {};

        const start = new Date(task.startDate);
        const end = new Date(task.endDate);
        
        // Calculate days difference (inclusive)
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
        
        // Determine total hours
        let totalHours = 0;
        if (workload?.estimatedHours) {
          totalHours = workload.estimatedHours;
        } else if (task.duration) {
          totalHours = task.duration * 8; // default 8h per duration day
        }

        const hoursPerDay = totalHours / days;

        // Iterate through dates
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          
          // Update min/max dates for bounding the table
          if (dateStr < minDate) minDate = dateStr;
          if (dateStr > maxDate) maxDate = dateStr;

          workloadMap[assignee][dateStr] = (workloadMap[assignee][dateStr] || 0) + hoursPerDay;
        }
      }
      if (node.children) node.children.forEach(traverse);
    };

    traverse(state.present);

    if (minDate === '9999-12-31') {
      return { assigneesData: {}, dateRange: [] };
    }

    // Generate date range headers
    const range = [];
    for (let d = new Date(minDate); d <= new Date(maxDate); d.setDate(d.getDate() + 1)) {
      range.push(d.toISOString().split('T')[0]);
    }

    return { assigneesData: workloadMap, dateRange: range };
  }, [state.present]);

  const getHeatmapColor = (hours: number) => {
    if (hours === 0) return 'bg-gray-50 text-gray-400';
    if (hours <= 4) return 'bg-blue-100 text-blue-800 font-medium';
    if (hours <= 8) return 'bg-krones-primary text-white font-bold shadow-inner';
    return 'bg-red-500 text-white font-bold shadow-md animate-pulse'; // > 8h over-allocation
  };

  if (!state.present) return null;

  return (
    <div className="w-full h-full bg-white flex flex-col">
      <div className="p-4 border-b border-krones-border flex justify-between items-center bg-krones-surface">
        <h2 className="text-xl font-serif text-krones-primary font-bold">Resource Workload Heatmap</h2>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-gray-50 border"></span> 0h</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-blue-100"></span> 1-4h</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-krones-primary"></span> 5-8h</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-red-500"></span> &gt;8h (Overload)</div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {dateRange.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">No tasks with Assignee, Start Date, and End Date found.</div>
        ) : (
          <div className="min-w-max border border-krones-border rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-sm text-center border-collapse">
              <thead className="bg-gray-50 text-krones-dark border-b border-krones-border">
                <tr>
                  <th className="px-4 py-3 font-semibold border-r border-krones-border text-left min-w-[200px] sticky left-0 bg-gray-50 z-10 shadow-[1px_0_0_#e2e8f0]">
                    Resource / Assignee
                  </th>
                  {dateRange.map(date => {
                    const d = new Date(date);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <th key={date} className={`px-2 py-2 font-medium border-r border-krones-border min-w-[60px] ${isWeekend ? 'bg-gray-100 text-gray-400' : ''}`}>
                        <div>{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-xs">{d.getDate()}/{d.getMonth() + 1}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Object.keys(assigneesData).sort().map(assignee => (
                  <tr key={assignee} className="border-b border-krones-border hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-krones-dark border-r border-krones-border text-left sticky left-0 bg-white z-10 shadow-[1px_0_0_#e2e8f0]">
                      {assignee}
                    </td>
                    {dateRange.map(date => {
                      const hours = assigneesData[assignee][date] || 0;
                      const formattedHours = hours > 0 ? Number(hours.toFixed(1)) : 0;
                      return (
                        <td key={date} className="border-r border-krones-border p-1">
                          <div className={`w-full h-10 flex items-center justify-center rounded-md transition-colors ${getHeatmapColor(formattedHours)}`} title={`${assignee}: ${formattedHours}h on ${date}`}>
                            {formattedHours > 0 ? formattedHours : '-'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
