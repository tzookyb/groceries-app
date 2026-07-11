import { useState } from 'react';
import { useGroceryData } from '../../hooks/useGroceryData';
import { ItemRow } from './ItemRow';
import { EmptyState } from './EmptyState';
import type { Item } from '../../types';

export function ItemList({ items }: { items: Item[] }) {
  const { data, deleteItem, moveItem, editItem, toggleItemShop } = useGroceryData();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (data.items.length === 0) return <EmptyState />;
  if (items.length === 0) {
    return <div className="text-center text-muted px-5 py-12 text-sm leading-[1.8]">אין מוצרים התואמים לסינון.</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map(item => {
        const i = data.items.findIndex(it => it.id === item.id);
        return (
          <ItemRow
            key={item.id}
            item={item}
            shops={data.shops}
            isFirst={i === 0}
            isLast={i === data.items.length - 1}
            editing={editingId === item.id}
            onStartEdit={() => setEditingId(item.id)}
            onCancelEdit={() => setEditingId(null)}
            onCommitEdit={name => { editItem(item.id, name); setEditingId(null); }}
            onMove={dir => moveItem(i, dir)}
            onDelete={() => deleteItem(item.id)}
            onToggleShop={shopId => toggleItemShop(item.id, shopId)}
          />
        );
      })}
    </div>
  );
}
