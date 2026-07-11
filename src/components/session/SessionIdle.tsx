interface SessionIdleProps {
  onStart(): void;
}

export function SessionIdle({ onStart }: SessionIdleProps) {
  return (
    <div className="flex flex-col gap-[18px] py-2">
      <div className="flex flex-col items-center gap-5 py-4">
        <div
          className="w-[120px] h-[120px] rounded-full bg-accent-dim border-2 border-accent flex items-center justify-center text-5xl cursor-pointer active:scale-105 transition-transform duration-150"
          onClick={onStart}
        >
          🎙️
        </div>
        <div className="text-sm text-muted text-center leading-[1.7]">
          לחץ להתחלה.
          <br />
          לכל מוצר ענה <strong>כן</strong> / <strong>לא</strong> / <strong>מספר</strong> (כמות).
        </div>
      </div>
    </div>
  );
}
