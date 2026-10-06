"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { MindNode } from '../types/mindmap';
import { db } from '../lib/db';

interface MindmapState {
  past: MindNode[];
  present: MindNode | null;
  future: MindNode[];
  selectedNodeId: string | null;
  isSaving: boolean;
}

type Action = 
  | { type: 'LOAD_MINDMAP'; payload: MindNode }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'UPDATE_NODE'; payload: { id: string; updates: Partial<MindNode> } }
  | { type: 'ADD_NODE'; payload: { parentId: string; node: MindNode } }
  | { type: 'DELETE_NODE'; payload: { id: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_SAVING'; payload: boolean };

const MAX_HISTORY = 30;

const clone = (n: any) => JSON.parse(JSON.stringify(n));

function updateTree(root: MindNode, targetId: string, updater: (n: MindNode) => void): boolean {
  if (root.id === targetId) {
    updater(root);
    return true;
  }
  if (root.children) {
    for (let i = 0; i < root.children.length; i++) {
      if (updateTree(root.children[i], targetId, updater)) return true;
    }
  }
  return false;
}

function deleteFromTree(root: MindNode, targetId: string): boolean {
  if (root.children) {
    const idx = root.children.findIndex(c => c.id === targetId);
    if (idx !== -1) {
      root.children.splice(idx, 1);
      return true;
    }
    for (let i = 0; i < root.children.length; i++) {
      if (deleteFromTree(root.children[i], targetId)) return true;
    }
  }
  return false;
}

function reducer(state: MindmapState, action: Action): MindmapState {
  switch (action.type) {
    case 'LOAD_MINDMAP':
      return { ...state, past: [], present: action.payload, future: [], selectedNodeId: action.payload.id };
    
    case 'SELECT_NODE':
      return { ...state, selectedNodeId: action.payload };

    case 'UPDATE_NODE': {
      if (!state.present) return state;
      const newPresent = clone(state.present);
      updateTree(newPresent, action.payload.id, (n) => {
        Object.assign(n, action.payload.updates);
      });
      const newPast = [...state.past, state.present].slice(-MAX_HISTORY);
      return { ...state, past: newPast, present: newPresent, future: [] };
    }

    case 'ADD_NODE': {
      if (!state.present) return state;
      const newPresent = clone(state.present);
      updateTree(newPresent, action.payload.parentId, (n) => {
        if (!n.children) n.children = [];
        n.children.push(action.payload.node);
      });
      const newPast = [...state.past, state.present].slice(-MAX_HISTORY);
      return { ...state, past: newPast, present: newPresent, future: [], selectedNodeId: action.payload.node.id };
    }

    case 'DELETE_NODE': {
      if (!state.present) return state;
      if (state.present.id === action.payload.id) return state; // cannot delete root
      const newPresent = clone(state.present);
      deleteFromTree(newPresent, action.payload.id);
      const newPast = [...state.past, state.present].slice(-MAX_HISTORY);
      return { ...state, past: newPast, present: newPresent, future: [], selectedNodeId: state.present.id };
    }

    case 'UNDO': {
      if (state.past.length === 0 || !state.present) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      return { ...state, past: newPast, present: previous, future: [state.present, ...state.future] };
    }

    case 'REDO': {
      if (state.future.length === 0 || !state.present) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return { ...state, past: [...state.past, state.present], present: next, future: newFuture };
    }

    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };

    default:
      return state;
  }
}

const MindmapContext = createContext<{
  state: MindmapState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function MindmapProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    past: [],
    present: null,
    future: [],
    selectedNodeId: null,
    isSaving: false
  });

  // Autosave to Dexie whenever present changes
  useEffect(() => {
    if (!state.present) return;
    
    const saveToDb = async () => {
      try {
        dispatch({ type: 'SET_SAVING', payload: true });
        // We assume id='default' for single mindmap mode for now, but this could be dynamic
        await db.mindmaps.put({
          id: 'default',
          title: state.present?.topic || 'Untitled',
          updatedAt: Date.now(),
          syncStatus: 'pending',
          userId: 'local',
          rootData: state.present!
        });
      } catch (err) {
        console.error("Failed to save to local db", err);
      } finally {
        dispatch({ type: 'SET_SAVING', payload: false });
      }
    };
    
    const timeoutId = setTimeout(saveToDb, 500); // Debounce save
    return () => clearTimeout(timeoutId);
  }, [state.present]);

  // Handle global shortcuts (Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          if (e.shiftKey) {
            dispatch({ type: 'REDO' });
          } else {
            dispatch({ type: 'UNDO' });
          }
          e.preventDefault();
        } else if (e.key === 'y') {
          dispatch({ type: 'REDO' });
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <MindmapContext.Provider value={{ state, dispatch }}>
      {children}
    </MindmapContext.Provider>
  );
}

export function useMindmap() {
  const context = useContext(MindmapContext);
  if (!context) throw new Error("useMindmap must be used within MindmapProvider");
  return context;
}
