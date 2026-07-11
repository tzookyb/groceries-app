import { useRef } from 'react';
import { IconButton } from '../ui/IconButton';
import { ShopPill } from '../ui/ShopPill';
import type { Item, Shop } from '../../types';

interface ItemRowProps {
  item: Item;
  shops: Shop[];
  isFirst: boolean;
  isLast: boolean;
  editing: boolean;
  onStartEdit(): void;
  onCancelEdit(): void;
  onCommitEdit(name: string): void;
  onMove(dir: 1 | -1): void;
  onDelete(): void;
  onToggleShop(shopId: string): void;
}

export function ItemRow({ item, shops, isFirst, isLast, editing, onStartEdit, onCancelEdit, onCommitEdit, onMove, onDelete, onToggleShop }: ItemRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function commit() {
    const val = inputRef.current?.value.trim();
    if (val) onCommitEdit(val);
    else onCancelEdit();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 bg-surface rounded-xl px-3.5 py-3 border-[1.5px] border-border">
        <input
          ref={inputRef}
          autoFocus
          defaultValue={item.name}
          className="flex-1 min-w-0 text-base font-semibold bg-bg border-[1.5px] border-accent rounded-lg px-3 py-2.5 text-text outline-none"
          onKeyDown={e => {
            if (e.key === 'Enter') commit();
            else if (e.key === 'Escape') onCancelEdit();
          }}
        />
        <IconButton kind="move" onClick={commit}>✓</IconButton>
        <IconButton kind="del" onClick={onCancelEdit}>✕</IconButton>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 bg-surface rounded-xl px-3.5 py-3 border-[1.5px] border-border">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-base font-semibold [overflow-wrap:anywhere] cursor-pointer" onClick={onStartEdit}>
          {item.name}
        </span>
        <IconButton kind="move" onClick={onStartEdit}>✎</IconButton>
        <IconButton kind="move" onClick={() => onMove(-1)} disabled={isFirst}>▲</IconButton>
        <IconButton kind="move" onClick={() => onMove(1)} disabled={isLast}>▼</IconButton>
        <IconButton kind="del" onClick={onDelete}>✕</IconButton>
      </div>
      {shops.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {shops.map(shop => (
            <ShopPill
              key={shop.id}
              name={shop.name}
              color={shop.color}
              active={item.shopIds.includes(shop.id)}
              onToggle={() => onToggleShop(shop.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
