import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { load, sanitize, slug, writeLocal } from '../lib/storage';
import { colorAt, nextColor } from '../lib/shopColors';
import type { GroceryData, Item, Shop } from '../types';

interface GroceryContextValue {
  data: GroceryData;
  addItem(name: string): void;
  deleteItem(id: string): void;
  moveItem(i: number, dir: number): void;
  editItem(id: string, name: string): void;
  toggleItemShop(itemId: string, shopId: string): void;
  addShop(name: string): void;
  deleteShop(id: string): void;
  cycleShopColor(shopId: string): void;
  importData(raw: unknown): void;
  replaceData(d: GroceryData): void;
}

const GroceryContext = createContext<GroceryContextValue | null>(null);

export function GroceryProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<GroceryData>(() => load());

  const stampAndWrite = useCallback((next: GroceryData) => {
    const stamped = { ...next, updatedAt: Date.now() };
    writeLocal(stamped);
    setData(stamped);
  }, []);

  const addItem = useCallback((name: string) => {
    setData(prev => {
      const next = { ...prev, items: [...prev.items, { id: slug(), name, shopIds: [] } as Item], updatedAt: Date.now() };
      writeLocal(next);
      return next;
    });
  }, []);

  const deleteItem = useCallback((id: string) => {
    setData(prev => {
      const next = { ...prev, items: prev.items.filter(it => it.id !== id), updatedAt: Date.now() };
      writeLocal(next);
      return next;
    });
  }, []);

  const moveItem = useCallback((i: number, dir: number) => {
    setData(prev => {
      const j = i + dir;
      if (j < 0 || j >= prev.items.length) return prev;
      const items = prev.items.slice();
      const tmp = items[i]; items[i] = items[j]; items[j] = tmp;
      const next = { ...prev, items, updatedAt: Date.now() };
      writeLocal(next);
      return next;
    });
  }, []);

  const editItem = useCallback((id: string, name: string) => {
    setData(prev => {
      const next = { ...prev, items: prev.items.map(it => (it.id === id ? { ...it, name } : it)), updatedAt: Date.now() };
      writeLocal(next);
      return next;
    });
  }, []);

  const toggleItemShop = useCallback((itemId: string, shopId: string) => {
    setData(prev => {
      const next = {
        ...prev,
        items: prev.items.map(it => {
          if (it.id !== itemId) return it;
          const has = it.shopIds.includes(shopId);
          return { ...it, shopIds: has ? it.shopIds.filter(id => id !== shopId) : [...it.shopIds, shopId] };
        }),
        updatedAt: Date.now(),
      };
      writeLocal(next);
      return next;
    });
  }, []);

  const addShop = useCallback((name: string) => {
    setData(prev => {
      const next = { ...prev, shops: [...prev.shops, { id: slug(), name, color: colorAt(prev.shops.length) } as Shop], updatedAt: Date.now() };
      writeLocal(next);
      return next;
    });
  }, []);

  const deleteShop = useCallback((id: string) => {
    setData(prev => {
      const next = {
        ...prev,
        shops: prev.shops.filter(s => s.id !== id),
        items: prev.items.map(it => (it.shopIds.includes(id) ? { ...it, shopIds: it.shopIds.filter(sid => sid !== id) } : it)),
        updatedAt: Date.now(),
      };
      writeLocal(next);
      return next;
    });
  }, []);

  const cycleShopColor = useCallback((shopId: string) => {
    setData(prev => {
      const next = {
        ...prev,
        shops: prev.shops.map(s => (s.id === shopId ? { ...s, color: nextColor(s.color) } : s)),
        updatedAt: Date.now(),
      };
      writeLocal(next);
      return next;
    });
  }, []);

  const importData = useCallback((raw: unknown) => {
    stampAndWrite(sanitize(raw));
  }, [stampAndWrite]);

  // Used by Drive pulls: localStorage write already happened (without re-stamping
  // updatedAt) — this only updates React state to match.
  const replaceData = useCallback((d: GroceryData) => {
    setData(d);
  }, []);

  const value = useMemo<GroceryContextValue>(() => ({
    data, addItem, deleteItem, moveItem, editItem, toggleItemShop, addShop, deleteShop, cycleShopColor, importData, replaceData,
  }), [data, addItem, deleteItem, moveItem, editItem, toggleItemShop, addShop, deleteShop, cycleShopColor, importData, replaceData]);

  return <GroceryContext.Provider value={value}>{children}</GroceryContext.Provider>;
}

export function useGroceryData(): GroceryContextValue {
  const ctx = useContext(GroceryContext);
  if (!ctx) throw new Error('useGroceryData must be used within GroceryProvider');
  return ctx;
}
