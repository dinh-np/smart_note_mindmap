"use client";

import { useState } from 'react';
import { db } from '../lib/db';
import { MindNode } from '../types/mindmap';

export function useAiCopilot() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMindmap = async (prompt: string, mode: string = 'WBS'): Promise<MindNode | null> => {
    setIsGenerating(true);
    
    // Hash prompt for cache
    const msgBuffer = new TextEncoder().encode(prompt + mode);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const promptHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    try {
      // 1. Check Dexie Cache (< 24h old)
      const cached = await db.aiCache.get(promptHash);
      if (cached && (Date.now() - cached.createdAt < 24 * 60 * 60 * 1000)) {
        setIsGenerating(false);
        return cached.data as MindNode;
      }

      // 2. Fetch from Next.js API
      const res = await fetch('/api/ai/mindmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode })
      });

      if (res.status === 429) {
        throw new Error('Rate limit exceeded (5 requests per minute). Please try again later.');
      }

      if (!res.ok) {
        throw new Error(`API Error: ${res.statusText}`);
      }

      const generatedData = await res.json();

      // 3. Save to Cache
      await db.aiCache.put({
        promptHash,
        createdAt: Date.now(),
        data: generatedData
      });

      setIsGenerating(false);
      return generatedData as MindNode;

    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      throw err;
    }
  };

  return { generateMindmap, isGenerating };
}
