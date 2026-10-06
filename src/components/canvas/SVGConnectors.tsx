"use client";

import React, { useEffect, useState } from 'react';
import { MindNode } from '../../types/mindmap';

interface SVGConnectorsProps {
  rootNode: MindNode;
}

interface Point {
  x: number;
  y: number;
}

interface Connection {
  id: string;
  start: Point;
  end: Point;
}

export function SVGConnectors({ rootNode }: SVGConnectorsProps) {
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    // Collect all bounding boxes and calculate center points
    const updateConnections = () => {
      const container = document.getElementById('canvas-container');
      if (!container) return;
      const containerRect = container.getBoundingClientRect();

      const getPoint = (elementId: string, side: 'left' | 'right' | 'center'): Point | null => {
        const el = document.getElementById(`node-${elementId}`);
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        
        // Convert to absolute canvas coordinates
        // Canvas uses transform: scale(), so getBoundingClientRect() is already scaled, but we want the position relative to the container.
        // Wait, if the SVG is inside the same transformed container, we need local coordinates.
        // A better approach is to make the SVG absolute and stretch 100% of the canvas content.
        
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;

        // Assuming SVG overlays the container exactly
        return {
          x: rect.x - containerRect.left + (side === 'left' ? 0 : side === 'right' ? rect.width : rect.width / 2) + scrollLeft,
          y: rect.y - containerRect.top + rect.height / 2 + scrollTop
        };
      };

      const newConns: Connection[] = [];

      const traverse = (node: MindNode, parentPoint: Point | null, isLeft: boolean) => {
        // We connect from Parent's edge to Child's edge
        const centerPoint = getPoint(node.id, 'center');
        if (!centerPoint) return;

        let nodePoint: Point;
        let pPoint = parentPoint;

        if (parentPoint) {
          // If child is to the left of parent, connect parent's left to child's right
          if (centerPoint.x < parentPoint.x) {
            nodePoint = getPoint(node.id, 'right') || centerPoint;
            if (!pPoint) pPoint = getPoint(node.id, 'left') || parentPoint; // rough fallback
          } else {
            nodePoint = getPoint(node.id, 'left') || centerPoint;
          }
          
          newConns.push({
            id: `${parentPoint.x}-${nodePoint.x}-${node.id}`,
            start: parentPoint,
            end: nodePoint
          });
        }

        if (node.children) {
          node.children.forEach((c) => {
            const childCenter = getPoint(c.id, 'center');
            const newIsLeft = childCenter ? childCenter.x < centerPoint.x : isLeft;
            const currentEdge = getPoint(node.id, newIsLeft ? 'left' : 'right') || centerPoint;
            traverse(c, currentEdge, newIsLeft);
          });
        }
      };

      // Split Root to pass accurate edges
      if (rootNode.children) {
        const rootCenter = getPoint(rootNode.id, 'center');
        const rootLeft = getPoint(rootNode.id, 'left');
        const rootRight = getPoint(rootNode.id, 'right');

        rootNode.children.forEach((c) => {
          const childCenter = getPoint(c.id, 'center');
          if (childCenter && rootCenter) {
            const isLeft = childCenter.x < rootCenter.x;
            traverse(c, isLeft ? rootLeft : rootRight, isLeft);
          }
        });
      }

      setConnections(newConns);
    };

    updateConnections();

    // Re-run on resize and DOM mutations
    window.addEventListener('resize', updateConnections);
    const observer = new MutationObserver(updateConnections);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });

    return () => {
      window.removeEventListener('resize', updateConnections);
      observer.disconnect();
    };
  }, [rootNode]);

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ minWidth: 3000, minHeight: 2000 }}>
      {connections.map(c => {
        // Cubic bezier
        const midX = (c.start.x + c.end.x) / 2;
        const path = `M ${c.start.x} ${c.start.y} C ${midX} ${c.start.y}, ${midX} ${c.end.y}, ${c.end.x} ${c.end.y}`;
        return (
          <path
            key={c.id}
            d={path}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="2"
            className="transition-all duration-300"
          />
        );
      })}
    </svg>
  );
}
