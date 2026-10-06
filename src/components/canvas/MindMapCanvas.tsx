"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useMindmap } from '../../store/MindmapContext';
import { NodeTree } from './NodeTree';
import { SVGConnectors } from './SVGConnectors';
import { Plus, Undo, Redo, ZoomIn, ZoomOut, Maximize, Upload, Download, Bot, ChevronDown, FileText, FileSpreadsheet, Presentation, Image as ImageIcon, FileOutput, ArrowRight, Edit2, Trash2 } from 'lucide-react';
import { db } from '../../lib/db';
import { importMindGenius, exportMindGenius } from '../../lib/parsers/mindgenius';
import { exportToPPTX, exportToDOCX, exportToXLSX, exportToPDF, exportToImage } from '../../lib/exporters';
import { useAiCopilot } from '../../hooks/useAiCopilot';
import { registerCanvasTools } from '../../lib/webmcp';

export function MindMapCanvas() {
  const { state, dispatch } = useMindmap();
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Multi-touch tracking
  const activePointers = useRef<Map<number, { x: number, y: number }>>(new Map());
  const initialPinchDist = useRef<number | null>(null);
  const initialScale = useRef<number>(1);

  const { generateMindmap, isGenerating } = useAiCopilot();
  
  // Handle Virtual Keyboard Auto-Pan
  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        // If the visual viewport height is < 70% of window inner height, keyboard is likely up
        if (window.visualViewport.height < window.innerHeight * 0.7) {
          setPan(p => ({ ...p, y: p.y - 150 })); // Auto-pan up into the safe zone
        }
      }
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // Register WebMCP Tools
  useEffect(() => {
    registerCanvasTools(dispatch, state.present);
  }, [dispatch, state.present]);

  // Initialize empty mindmap if none exists
  useEffect(() => {
    const initDb = async () => {
      try {
        const maps = await db.mindmaps.toArray();
        if (maps.length > 0) {
          dispatch({ type: 'LOAD_MINDMAP', payload: maps[0].rootData });
        } else {
          // Create initial root
          dispatch({
            type: 'LOAD_MINDMAP',
            payload: {
              id: crypto.randomUUID(),
              topic: 'Central Idea',
              children: []
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    initDb();
  }, [dispatch]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(s => Math.min(Math.max(0.2, s + delta), 3));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    containerRef.current?.setPointerCapture(e.pointerId);
    
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1) {
      isDragging.current = true;
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    } else if (activePointers.current.size === 2) {
      isDragging.current = false;
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchDist.current = dist;
      initialScale.current = scale;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1 && isDragging.current) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    } else if (activePointers.current.size === 2 && initialPinchDist.current) {
      const pts = Array.from(activePointers.current.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const newScale = Math.min(Math.max(0.2, initialScale.current * (dist / initialPinchDist.current)), 3);
      setScale(newScale);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    if (activePointers.current.size < 2) {
      initialPinchDist.current = null;
    }
    if (activePointers.current.size === 0) {
      isDragging.current = false;
    }
    containerRef.current?.releasePointerCapture(e.pointerId);
  };

  const handleAddChildToSelected = () => {
    if (state.selectedNodeId) {
      dispatch({
        type: 'ADD_NODE',
        payload: {
          parentId: state.selectedNodeId,
          node: { id: crypto.randomUUID(), topic: 'New Idea' }
        }
      });
    }
  };

  const handleDeleteNode = () => {
    if (!state.selectedNodeId || !state.present) return;
    
    // Find node to check children length
    let nodeToDelete: any = null;
    const findNode = (n: any) => {
      if (n.id === state.selectedNodeId) nodeToDelete = n;
      if (n.children) n.children.forEach(findNode);
    };
    findNode(state.present);

    if (nodeToDelete && nodeToDelete.children && nodeToDelete.children.length > 0) {
      if (!window.confirm(`Nhánh này có ${nodeToDelete.children.length} node con. Bạn có chắc chắn muốn xóa toàn bộ không?`)) {
        return;
      }
    }
    dispatch({ type: 'DELETE_NODE', payload: { id: state.selectedNodeId } });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const rootNode = await importMindGenius(file);
        dispatch({ type: 'LOAD_MINDMAP', payload: rootNode });
      } catch (err) {
        console.error(err);
        alert("Failed to import .mgmx file");
      }
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = async () => {
    if (!state.present) return;
    await exportMindGenius(state.present, state.present.topic || "Mindmap");
  };

  const handleAI = async () => {
    const prompt = window.prompt("Ask Gemini Copilot to generate a mindmap:\n(e.g., 'Plan a 2-week marketing sprint')");
    if (prompt) {
      try {
        const result = await generateMindmap(prompt);
        if (result) {
          dispatch({ type: 'LOAD_MINDMAP', payload: result });
        }
      } catch (err: any) {
        alert(err.message || 'AI Generation Failed');
      }
    }
  };

  if (!state.present) {
    return <div className="h-full flex items-center justify-center">Loading local storage...</div>;
  }

  // 2-sided auto-layout splitting
  const children = state.present.children || [];
  const mid = Math.ceil(children.length / 2);
  const leftChildren = children.slice(0, mid);
  const rightChildren = children.slice(mid);

  const rootLeft = { ...state.present, children: leftChildren };
  const rootRight = { ...state.present, children: rightChildren };

  return (
    <div className="relative w-full h-full overflow-hidden bg-krones-canvas touch-none">
      
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-50 flex gap-2 bg-white/80 backdrop-blur shadow-sm p-2 rounded-xl border border-krones-border">
        <button onClick={() => dispatch({ type: 'UNDO' })} disabled={state.past.length === 0} className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"><Undo size={20}/></button>
        <button onClick={() => dispatch({ type: 'REDO' })} disabled={state.future.length === 0} className="p-2 hover:bg-gray-100 rounded disabled:opacity-50"><Redo size={20}/></button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-2 hover:bg-gray-100 rounded"><ZoomIn size={20}/></button>
        <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))} className="p-2 hover:bg-gray-100 rounded"><ZoomOut size={20}/></button>
        <button onClick={() => { setScale(1); setPan({x: 0, y: 0}); }} className="p-2 hover:bg-gray-100 rounded"><Maximize size={20}/></button>
        <div className="w-px bg-gray-300 mx-1"></div>
        <input type="file" accept=".mgmx" ref={fileInputRef} onChange={handleImport} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-gray-100 rounded text-krones-primary" title="Import MindGenius (.mgmx)"><Upload size={20}/></button>
        
        <div className="relative">
          <button 
            onClick={() => setShowExportMenu(!showExportMenu)} 
            className="p-2 hover:bg-gray-100 rounded text-krones-primary flex items-center gap-1"
            title="Export Options"
          >
            <Download size={20}/>
            <ChevronDown size={14} />
          </button>
          
          {showExportMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-krones-border rounded-lg shadow-lg flex flex-col py-1 z-[100]">
              <button onClick={() => { exportMindGenius(state.present!, state.present!.topic || "Mindmap"); setShowExportMenu(false); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-left"><FileOutput size={16} /> MindGenius (.mgmx)</button>
              <button onClick={() => { exportToPPTX(state.present!); setShowExportMenu(false); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-left"><Presentation size={16} /> PowerPoint (.pptx)</button>
              <button onClick={() => { exportToDOCX(state.present!); setShowExportMenu(false); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-left"><FileText size={16} /> Word (.docx)</button>
              <button onClick={() => { exportToXLSX(state.present!); setShowExportMenu(false); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-left"><FileSpreadsheet size={16} /> Excel (.xlsx)</button>
              <div className="h-px bg-gray-200 my-1"></div>
              <button onClick={() => { exportToPDF('canvas-container', state.present!.topic || 'mindmap'); setShowExportMenu(false); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-left"><FileText size={16} /> PDF Document</button>
              <button onClick={() => { exportToImage('canvas-container', state.present!.topic || 'mindmap'); setShowExportMenu(false); }} className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 text-sm text-left"><ImageIcon size={16} /> PNG Image</button>
            </div>
          )}
        </div>

        <div className="w-px bg-gray-300 mx-1"></div>
        <button 
          onClick={handleAI} 
          disabled={isGenerating}
          className={`p-2 hover:bg-gray-100 rounded text-purple-600 ${isGenerating ? 'animate-pulse bg-purple-50' : ''}`}
        >
          <Bot size={20}/>
        </button>
      </div>

      {/* Save Status Indicator */}
      {state.isSaving && (
        <div className="absolute top-4 right-4 z-50 text-xs text-krones-muted bg-white/80 px-3 py-1 rounded-full shadow-sm">
          Saving...
        </div>
      )}

      {/* Infinite Canvas */}
      <div 
        id="canvas-container"
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing outline-none"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={() => dispatch({ type: 'SELECT_NODE', payload: null })}
        tabIndex={0}
      >
        <div 
          className="w-full h-full absolute top-0 left-0 flex items-center justify-center transform-gpu"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
            transformOrigin: 'center center'
          }}
        >
          {/* We create a large coordinate space for drawing lines */}
          <div className="relative" style={{ width: 3000, height: 2000 }}>
             <SVGConnectors rootNode={state.present} />
             
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto">
                   <div className="flex flex-row items-center gap-16 relative">
                      {/* Left Side */}
                      <div className="flex flex-col gap-6 items-end">
                        {leftChildren.map(child => (
                          <NodeTree key={child.id} node={child} direction="left" />
                        ))}
                      </div>

                      {/* Center Root */}
                      <NodeTree node={{ ...state.present, children: [] }} direction="right" isRoot={true} />

                      {/* Right Side */}
                      <div className="flex flex-col gap-6 items-start">
                        {rightChildren.map(child => (
                          <NodeTree key={child.id} node={child} direction="right" />
                        ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Mobile Context Toolbar */}
      {state.selectedNodeId && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden flex gap-2 bg-white p-2 rounded-2xl shadow-xl border border-krones-border pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button 
             onClick={handleAddChildToSelected} 
             className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-krones-primary hover:bg-blue-50 rounded-xl"
          ><Plus size={20}/><span className="text-[10px]">Con</span></button>

          <button 
             onClick={() => document.getElementById(`node-${state.selectedNodeId}`)?.querySelector('input')?.focus()} 
             className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-krones-primary hover:bg-blue-50 rounded-xl"
          ><Edit2 size={20}/><span className="text-[10px]">Sửa</span></button>

          {state.selectedNodeId !== state.present.id && (
            <button 
               onClick={handleDeleteNode} 
               className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center text-red-500 hover:bg-red-50 rounded-xl"
            ><Trash2 size={20}/><span className="text-[10px]">Xóa</span></button>
          )}
        </div>
      )}
    </div>
  );
}
