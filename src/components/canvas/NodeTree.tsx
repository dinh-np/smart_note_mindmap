"use client";

import React from 'react';
import { MindNode } from '../../types/mindmap';
import { NodeCard } from './NodeCard';

interface NodeTreeProps {
  node: MindNode;
  direction: 'left' | 'right';
  isRoot?: boolean;
}

export function NodeTree({ node, direction, isRoot = false }: NodeTreeProps) {
  if (!node.children || node.children.length === 0) {
    return (
      <div className="flex items-center">
        <NodeCard node={node} isRoot={isRoot} />
      </div>
    );
  }

  return (
    <div className={`flex flex-row items-center gap-16 relative`}>
      {direction === 'left' && (
        <div className="flex flex-col gap-6 items-end">
          {node.children.map(child => (
            <NodeTree key={child.id} node={child} direction="left" />
          ))}
        </div>
      )}

      <NodeCard node={node} isRoot={isRoot} />

      {direction === 'right' && (
        <div className="flex flex-col gap-6 items-start">
          {node.children.map(child => (
            <NodeTree key={child.id} node={child} direction="right" />
          ))}
        </div>
      )}
    </div>
  );
}
