import type { VoiceAnswerKind } from '../../hooks/useSession';

interface CurrentItemCardProps {
  name: string;
  supportsSR: boolean;
  voiceAnswer: { text: string; kind: VoiceAnswerKind };
}

const ANSWER_CLASSES: Record<VoiceAnswerKind, string> = {
  '': 'text-muted',
  yes: 'text-accent',
  no: 'text-red',
};

export function CurrentItemCard({ name, supportsSR, voiceAnswer }: CurrentItemCardProps) {
  return (
    <div className="w-full bg-surface border-[1.5px] border-border rounded-app px-6 py-8 text-center">
      <div className="text-xs text-muted mb-3 tracking-wide">האם צריך?</div>
      <div className="text-[32px] font-extrabold tracking-tight leading-[1.1] [overflow-wrap:anywhere]">{name || '—'}</div>
      <div className="flex items-center gap-2 text-[13px] text-accent mt-4 justify-center">
        {supportsSR ? (
          <>
            <div className="pulse-dot" /> מאזין...
          </>
        ) : (
          'הזיהוי הקולי לא נתמך בדפדפן זה — ענה בכפתורים'
        )}
      </div>
      <div className={`text-sm min-h-5 mt-2 ${ANSWER_CLASSES[voiceAnswer.kind]}`}>{voiceAnswer.text}</div>
    </div>
  );
}
