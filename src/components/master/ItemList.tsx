import { useState } from 'react';
import { useGroceryData } from '../../hooks/useGroceryData';
import { ItemRow } from './ItemRow';
import { EmptyState } from './EmptyState';

export function ItemList() {
  const { data, deleteItem, moveItem, editItem, toggleItemShop } = useGroceryData();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (data.items.length === 0) return <EmptyState />;

  return (
    <div className="flex flex-col gap-2">
      {data.items.map((item, i) => (
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
      ))}
    </div>
  );
}
