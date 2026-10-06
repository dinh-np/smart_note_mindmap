"use client";

import React, { useMemo } from 'react';
import { useMindmap } from '../../store/MindmapContext';
import { MindNode } from '../../types/mindmap';

interface RiskItem {
  id: string;
  topic: string;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  score: number;
  mitigationPlan: string;
}

export function RiskHeatmapView() {
  const { state } = useMindmap();

  const risks = useMemo(() => {
    if (!state.present) return [];
    
    const riskList: RiskItem[] = [];
    const traverse = (node: MindNode) => {
      if (node.risk && node.risk.probability && node.risk.impact) {
        riskList.push({
          id: node.id,
          topic: node.topic,
          probability: node.risk.probability,
          impact: node.risk.impact,
          score: node.risk.probability * node.risk.impact,
          mitigationPlan: node.risk.mitigationPlan || 'No mitigation plan defined.',
        });
      }
      if (node.children) node.children.forEach(traverse);
    };
    
    traverse(state.present);
    // Sort descending by score for the table
    return riskList.sort((a, b) => b.score - a.score);
  }, [state.present]);

  // Matrix axes mapping: [Probability, Impact]
  // Y-axis (rows): Probability 5 down to 1
  const probabilities = [5, 4, 3, 2, 1];
  // X-axis (cols): Impact 1 up to 5
  const impacts = [1, 2, 3, 4, 5];

  const getZoneColor = (score: number) => {
    if (score >= 15) return 'bg-red-500 hover:bg-red-600 text-white'; // High
    if (score >= 6) return 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900'; // Medium
    return 'bg-green-500 hover:bg-green-600 text-white'; // Low
  };

  const getLabelColor = (score: number) => {
    if (score >= 15) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  if (!state.present) return null;

  return (
    <div className="w-full h-full bg-white flex flex-col overflow-auto">
      <div className="p-4 border-b border-krones-border flex justify-between items-center bg-krones-surface shrink-0">
        <h2 className="text-xl font-serif text-krones-primary font-bold">Risk Heatmap (5x5)</h2>
        <div className="flex gap-4 text-sm font-medium">
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-green-500 rounded"></span> Low (1-5)</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-yellow-400 rounded"></span> Medium (6-12)</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 block bg-red-500 rounded"></span> High (15-25)</div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 p-8 flex-1 overflow-auto bg-gray-50/50">
        
        {/* 5x5 Matrix Section */}
        <div className="flex-none flex flex-col items-center">
          <h3 className="font-bold text-gray-700 mb-4">Probability vs. Impact</h3>
          <div className="flex">
            {/* Y Axis Label */}
            <div className="flex flex-col items-center justify-center mr-4" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              <span className="font-semibold text-gray-600 tracking-widest">PROBABILITY</span>
            </div>
            
            <div>
              <div className="grid grid-rows-5 gap-1 shadow-sm rounded-lg overflow-hidden border border-gray-200 bg-white">
                {probabilities.map(p => (
                  <div key={`p-${p}`} className="flex gap-1 bg-white">
                    {/* Y Axis Tick */}
                    <div className="w-8 flex items-center justify-center font-bold text-gray-500 border-r border-gray-100">
                      {p}
                    </div>
                    {/* Grid Cells */}
                    {impacts.map(i => {
                      const score = p * i;
                      const cellRisks = risks.filter(r => r.probability === p && r.impact === i);
                      return (
                        <div 
                          key={`c-${p}-${i}`} 
                          className={`w-20 h-20 md:w-24 md:h-24 flex items-center justify-center relative transition-colors cursor-default group ${getZoneColor(score)}`}
                          title={`Score: ${score} | ${cellRisks.length} Risks`}
                        >
                          <div className="absolute top-1 right-1 opacity-50 text-[10px] font-bold">
                            {score}
                          </div>
                          {cellRisks.length > 0 && (
                            <div className="w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center shadow-lg border-2 border-white/20 transform group-hover:scale-110 transition-transform">
                              {cellRisks.length}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              
              {/* X Axis Label */}
              <div className="flex mt-2">
                <div className="w-8"></div> {/* Spacer for Y axis tick column */}
                <div className="flex-1">
                  <div className="flex justify-between px-8 md:px-10 text-gray-500 font-bold">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
                  </div>
                  <div className="text-center mt-2 font-semibold text-gray-600 tracking-widest">
                    IMPACT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Register Table Section */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-krones-border overflow-hidden flex flex-col">
          <div className="bg-krones-surface p-4 border-b border-krones-border">
            <h3 className="font-bold text-krones-dark">Risk Register</h3>
          </div>
          <div className="flex-1 overflow-auto">
            {risks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No risks defined. Select a node in the mindmap and define Probability & Impact values.
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-krones-border text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Risk Topic</th>
                    <th className="px-4 py-3 font-semibold text-center w-20">Prob</th>
                    <th className="px-4 py-3 font-semibold text-center w-20">Impact</th>
                    <th className="px-4 py-3 font-semibold text-center w-24">Score</th>
                    <th className="px-4 py-3 font-semibold">Mitigation Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-krones-border">
                  {risks.map(risk => (
                    <tr key={risk.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 font-medium text-krones-dark">{risk.topic}</td>
                      <td className="px-4 py-4 text-center font-bold text-gray-600">{risk.probability}</td>
                      <td className="px-4 py-4 text-center font-bold text-gray-600">{risk.impact}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getLabelColor(risk.score)}`}>
                          {risk.score}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-600">{risk.mitigationPlan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
