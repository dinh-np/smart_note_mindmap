import Dexie, { type Table } from 'dexie';
import { MindMapRecord } from '../types/mindmap';

export interface AiCacheRecord {
  promptHash: string;
  createdAt: number;
  data: any;
}

export class SmartNoteMindmapDB extends Dexie {
  mindmaps!: Table<MindMapRecord, string>;
  aiCache!: Table<AiCacheRecord, string>;

  constructor() {
    super('SmartNoteMindmapDB');
    this.version(1).stores({
      mindmaps: 'id, title, updatedAt, syncStatus, userId',
      aiCache: 'promptHash, createdAt'
    });
  }
}

export const db = new SmartNoteMindmapDB();

export async function requestPersistentStorage() {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    return await navigator.storage.persist();
  }
  return false;
}

export async function encryptData(data: string, pin: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin) as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    enc.encode(data) as BufferSource
  );
  
  const result = new Uint8Array(salt.byteLength + iv.byteLength + encrypted.byteLength);
  result.set(new Uint8Array(salt), 0);
  result.set(new Uint8Array(iv), salt.byteLength);
  result.set(new Uint8Array(encrypted), salt.byteLength + iv.byteLength);
  
  // Base64 encode
  return btoa(String.fromCharCode(...new Uint8Array(result)));
}

export async function decryptData(encryptedBase64: string, pin: string): Promise<string> {
  const binaryStr = atob(encryptedBase64);
  const data = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    data[i] = binaryStr.charCodeAt(i);
  }
  
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const encrypted = data.slice(28);
  
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin) as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encrypted as BufferSource
  );
  
  const dec = new TextDecoder();
  return dec.decode(decrypted);
}
