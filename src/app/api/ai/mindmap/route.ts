import { GoogleGenAI, Type, Schema } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const mindNodeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    topic: { type: Type.STRING },
    description: { type: Type.STRING },
    color: { type: Type.STRING },
    status: { type: Type.STRING },
    task: {
      type: Type.OBJECT,
      properties: {
        duration: { type: Type.NUMBER },
        priority: { type: Type.STRING },
      },
    },
    risk: {
      type: Type.OBJECT,
      properties: {
        probability: { type: Type.INTEGER },
        impact: { type: Type.INTEGER },
        mitigationPlan: { type: Type.STRING },
      },
    },
    children: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          topic: { type: Type.STRING },
          description: { type: Type.STRING },
          task: { type: Type.OBJECT },
          children: { type: Type.ARRAY, items: { type: Type.OBJECT } } // Pseudo recursive
        }
      },
    },
  },
  required: ['id', 'topic'],
};

const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    
    // Rate Limiting (5 req/min)
    const record = rateLimitMap.get(ip);
    if (record) {
      if (now - record.windowStart < 60000) {
        if (record.count >= 5) {
          return NextResponse.json({ error: 'Rate limit exceeded (5 req/min)' }, { status: 429 });
        }
        record.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, windowStart: now });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, windowStart: now });
    }

    const { prompt, mode } = await req.json();
    const systemPrompt = `You are a project management AI assistant. Mode: ${mode}. Output a MindNode JSON structure.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        { role: 'user', parts: [{ text: systemPrompt + '\n' + prompt }] }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: mindNodeSchema,
        temperature: 0.2
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
