export const HEB_NUM: Record<string, number> = {
  'אחת':1,'אחד':1,'שתיים':2,'שתים':2,'שניים':2,'שני':2,'פעמיים':2,
  'שלוש':3,'שלושה':3,'ארבע':4,'ארבעה':4,'חמש':5,'חמישה':5,
  'שש':6,'שישה':6,'שבע':7,'שבעה':7,'שמונה':8,'תשע':9,'תשעה':9,'עשר':10,'עשרה':10
};

// Say one of these to undo the last captured item (mis-recognition fix).
export const CANCEL_WORDS = ['בטל', 'ביטול', 'תבטל', 'מחק', 'תמחק', 'טעות', 'cancel', 'delete', 'undo', 'remove'];

export function isCancel(text: string): boolean {
  const low = text.toLowerCase().trim();
  return CANCEL_WORDS.some(w => low === w || low.includes(w));
}

export type ParsedAnswer =
  | { type: 'no' }
  | { type: 'qty'; qty: number }
  | { type: 'yes' }
  | { type: 'none' };

export function parseAnswer(text: string): ParsedAnswer {
  const clean = text.replace(/[.,!?״"']/g, '').trim();
  const lower = clean.toLowerCase();
  const noWords = ['לא', 'אין', 'דלג', 'no', 'nope', 'skip'];
  if (noWords.some(w => lower.includes(w))) return { type: 'no' };
  const m = clean.match(/\d+/);
  if (m) { const n = parseInt(m[0], 10); if (n > 0) return { type: 'qty', qty: Math.min(n, 99) }; }
  for (const w in HEB_NUM) { if (lower.includes(w)) return { type: 'qty', qty: HEB_NUM[w] }; }
  const yesWords = ['כן', 'אוקיי', 'אוקי', 'בטח', 'יש', 'צריך', 'בסדר', 'yes', 'yep', 'ok'];
  if (yesWords.some(w => lower.includes(w))) return { type: 'yes' };
  return { type: 'none' };
}

export function normalizeSpeechText(s: string): string {
  return (s || '').replace(/[‎‏﻿]/g, '').normalize('NFC').trim();
}

export function displayTitle(name: string, qty: number): string {
  return qty > 1 ? `${name} ×${qty}` : name;
}

// Loose match for duplicate-item detection: strips whitespace/hyphens/punctuation
// and lowercases (Latin only — Hebrew has no case) so "עגבניות", "עגבניות ", and
// "Tomato-Sauce"/"tomatosauce" are recognized as the same item.
export function normalizeForDupCheck(s: string): string {
  return (s || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}
