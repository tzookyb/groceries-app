import { Button } from '../ui/Button';

interface VoiceAddBannerProps {
  pending: string[];
  onFinish(): void;
  onCancel(): void;
}

export function VoiceAddBanner({ pending, onFinish, onCancel }: VoiceAddBannerProps) {
  return (
    <div className="flex flex-col gap-2 bg-surface border-[1.5px] border-accent rounded-xl px-4 py-3.5">
      <div className="flex items-center gap-2 text-[13px] text-accent font-semibold">
        <div className="pulse-dot" />
        מצב הוספה קולית פעיל
      </div>
      <div className="text-xs text-muted leading-[1.6]">
        אמור שם מוצר ועצור רגע — הפריט נוסף אוטומטית ← לחץ <strong className="text-text">«סיום ושמירה»</strong> לסיום
      </div>
      <div className="flex flex-col gap-1">
        {pending.map((name, i) => (
          <div key={i} className="text-sm text-accent font-semibold">
            {i + 1}. {name}
          </div>
        ))}
      </div>
      <div className="text-[15px] text-muted min-h-[22px]">
        {pending.length === 0 ? 'מקשיב...' : ''}
      </div>
      <div className="flex gap-2">
        <Button variant="accent" onClick={onFinish} className="flex-1">סיום ושמירה</Button>
        <Button variant="ghost" onClick={onCancel} className="flex-1">בטל</Button>
      </div>
    </div>
  );
}
