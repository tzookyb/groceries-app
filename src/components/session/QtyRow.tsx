interface QtyRowProps {
  onAnswer(kind: 'yes' | 'no', qty?: number): void;
}

export function QtyRow({ onAnswer }: QtyRowProps) {
  return (
    <div className="flex gap-2 w-full">
      {[2, 3, 4, 5].map(n => (
        <button
          key={n}
          className="flex-1 min-h-12 rounded-[10px] border-[1.5px] border-border bg-surface text-text text-[17px] font-bold cursor-pointer active:border-accent active:text-accent"
          onClick={() => onAnswer('yes', n)}
        >
          ×{n}
        </button>
      ))}
    </div>
  );
}
