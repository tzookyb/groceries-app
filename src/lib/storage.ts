import type { GroceryData } from '../types';
import { SHOP_PALETTE, colorAt } from './shopColors';

export const DATA_KEY = 'grocery-data';
export const LEGACY_KEY = 'grocery-items';

export function slug(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Normalize any loaded/imported blob into a clean v4: items[] ({id,name,shopIds}) + shops[]
// ({id,name,color}). Tolerates v2/v3 (no shopIds/color) and stray fields.
export function sanitize(d: any): GroceryData {
  const rawItems = Array.isArray(d && d.items) ? d.items : [];
  const rawShops = Array.isArray(d && d.shops) ? d.shops : [];

  const shops = rawShops
    .filter((s: any) => s && s.name != null)
    .map((s: any, i: number) => ({
      id: s.id || slug(),
      name: String(s.name),
      color: typeof s.color === 'string' && SHOP_PALETTE.includes(s.color) ? s.color : colorAt(i),
    }));
  const shopIds = new Set(shops.map((s: any) => s.id));

  const items = rawItems
    .filter((it: any) => it && it.name != null)
    .map((it: any) => ({
      id: it.id || slug(),
      name: String(it.name),
      shopIds: (Array.isArray(it.shopIds) ? it.shopIds.map(String) : []).filter((id: string) => shopIds.has(id)),
    }));

  return {
    version: 4,
    updatedAt: Number(d && d.updatedAt) || 0, // ms epoch; drives last-write-wins Drive sync
    items,
    shops,
  };
}

export function load(): GroceryData {
  const raw = localStorage.getItem(DATA_KEY);
  if (raw) {
    try {
      const d = JSON.parse(raw);
      // v4 (current), v3 and v2 (had stores) all carry an items[] with names.
      if (d && (d.version === 4 || d.version === 3 || d.version === 2) && Array.isArray(d.items)) return sanitize(d);
    } catch (e) {}
  }
  // Migration: legacy string[] under grocery-items → v4 (legacy key kept as safety net)
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      const arr = JSON.parse(legacy);
      if (Array.isArray(arr)) {
        const d = sanitize({ version: 4, items: arr.map((name: string) => ({ id: slug(), name: String(name) })) });
        localStorage.setItem(DATA_KEY, JSON.stringify(d));
        return d;
      }
    } catch (e) {}
  }
  return { version: 4, updatedAt: 0, items: [], shops: [] };
}

// Write to localStorage WITHOUT stamping updatedAt (used for Drive pulls).
export function writeLocal(data: GroceryData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}
