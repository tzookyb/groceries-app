import type { GroceryData } from '../types';

export const DATA_KEY = 'grocery-data';
export const LEGACY_KEY = 'grocery-items';

export function slug(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Normalize any loaded/imported blob into a clean v3: items[] + shops[], each {id,name}.
// Tolerates v2 (drops store tags) and stray fields.
export function sanitize(d: any): GroceryData {
  const items = Array.isArray(d && d.items) ? d.items : [];
  const shops = Array.isArray(d && d.shops) ? d.shops : [];
  return {
    version: 3,
    updatedAt: Number(d && d.updatedAt) || 0, // ms epoch; drives last-write-wins Drive sync
    items: items
      .filter((it: any) => it && it.name != null)
      .map((it: any) => ({ id: it.id || slug(), name: String(it.name) })),
    shops: shops
      .filter((s: any) => s && s.name != null)
      .map((s: any) => ({ id: s.id || slug(), name: String(s.name) })),
  };
}

export function load(): GroceryData {
  const raw = localStorage.getItem(DATA_KEY);
  if (raw) {
    try {
      const d = JSON.parse(raw);
      // v3 (current) and v2 (had stores) both carry an items[] with names.
      if (d && (d.version === 3 || d.version === 2) && Array.isArray(d.items)) return sanitize(d);
    } catch (e) {}
  }
  // Migration: legacy string[] under grocery-items → v3 (legacy key kept as safety net)
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      const arr = JSON.parse(legacy);
      if (Array.isArray(arr)) {
        const d = sanitize({ version: 3, items: arr.map((name: string) => ({ id: slug(), name: String(name) })) });
        localStorage.setItem(DATA_KEY, JSON.stringify(d));
        return d;
      }
    } catch (e) {}
  }
  return { version: 3, updatedAt: 0, items: [], shops: [] };
}

// Write to localStorage WITHOUT stamping updatedAt (used for Drive pulls).
export function writeLocal(data: GroceryData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}
