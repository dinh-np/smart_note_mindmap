"use client";

import React, { useRef, useEffect } from 'react';
import { MindNode } from '../../types/mindmap';
import { useMindmap } from '../../store/MindmapContext';

interface NodeCardProps {
  node: MindNode;
  isRoot?: boolean;
}

export function NodeCard({ node, isRoot = false }: NodeCardProps) {
  const { state, dispatch } = useMindmap();
  const isSelected = state.selectedNodeId === node.id;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSelected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSelected]);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'SELECT_NODE', payload: node.id });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_NODE',
      payload: { id: node.id, updates: { topic: e.target.value } }
    });
  };

  // Keyboard navigation and creation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      // Add child
      dispatch({
        type: 'ADD_NODE',
        payload: {
          parentId: node.id,
          node: {
            id: crypto.randomUUID(),
            topic: 'New Node',
          }
        }
      });
    } else if (e.key === 'Enter') {
      // Find parent to add sibling (unless root)
      // Since NodeCard doesn't know parentId directly, we dispatch a special ADD_SIBLING or we find parent in a helper.
      // We will handle sibling logic in Canvas or pass parentId as prop.
      // Wait, we can implement ADD_SIBLING in reducer or handle it here by passing parentId.
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (!isRoot && node.topic === '') {
        e.preventDefault();
        dispatch({ type: 'DELETE_NODE', payload: { id: node.id } });
      }
    }
  };

  return (
    <div 
      id={`node-${node.id}`}
      className={`relative min-w-[100px] max-w-[250px] p-2 rounded-lg border-2 transition-all duration-200 cursor-pointer shadow-sm
        ${isRoot ? 'bg-krones-primary text-white border-krones-primary shadow-md p-3 text-lg font-bold font-serif' : 'bg-white text-krones-dark border-krones-border hover:border-krones-hover'}
        ${isSelected ? 'ring-2 ring-krones-primary ring-offset-2 border-krones-primary' : ''}
      `}
      onClick={handleSelect}
    >
      <input
        ref={inputRef}
        type="text"
        value={node.topic}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`w-full bg-transparent outline-none text-center ${isRoot ? 'placeholder:text-white/70' : 'placeholder:text-krones-muted'} font-sans`}
        placeholder="Topic..."
      />
      {node.description && (
        <div className="mt-1 text-xs text-left text-gray-500 line-clamp-2">
          {node.description}
        </div>
      )}
    </div>
  );
}
