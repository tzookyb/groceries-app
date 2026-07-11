interface SessionControlsProps {
  onAnswer(kind: 'yes' | 'no', qty?: number): void;
}

export function SessionControls({ onAnswer }: SessionControlsProps) {
  return (
    <div className="flex gap-3 w-full">
      <button
        className="flex-1 rounded-xl text-xl font-bold py-4.5 min-h-[60px] cursor-pointer bg-accent-dim text-accent border-[1.5px] border-accent"
        onClick={() => onAnswer('yes', 1)}
      >
        כן ✓
      </button>
      <button
        className="flex-1 rounded-xl text-xl font-bold py-4.5 min-h-[60px] cursor-pointer bg-red-dim text-red border-[1.5px] border-red"
        onClick={() => onAnswer('no')}
      >
        לא ✗
      </button>
    </div>
  );
}
