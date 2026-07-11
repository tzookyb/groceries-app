import { useRef } from 'react';
import { SectionTitle } from '../ui/SectionTitle';
import { Button } from '../ui/Button';
import { useGroceryData } from '../../hooks/useGroceryData';

export function BackupSection() {
  const { data, importData } = useGroceryData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function exportBackup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `groceries-backup-${stamp}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importBackup(input: HTMLInputElement) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const d = JSON.parse(reader.result as string);
        if (!d || !Array.isArray(d.items)) throw new Error('bad');
        importData(d);
        alert('הגיבוי יובא בהצלחה.');
      } catch (e) {
        alert('קובץ גיבוי לא תקין.');
      }
      input.value = '';
    };
    reader.readAsText(file);
  }

  return (
    <>
      <SectionTitle>גיבוי</SectionTitle>
      <div className="flex flex-col gap-2.5 bg-surface border-[1.5px] border-border rounded-app p-4">
        <p className="text-[13px] text-muted leading-[1.6]">
          כל המידע נשמר מקומית בלבד. ייצא גיבוי לפני מחיקת נתונים או מעבר מכשיר.
        </p>
        <Button variant="ghost" onClick={exportBackup} className="w-full">ייצא גיבוי (JSON)</Button>
        <label className="rounded-xl font-semibold text-[15px] cursor-pointer transition-all duration-150 px-[18px] min-h-12 border-[1.5px] border-border bg-surface text-muted w-full text-center block py-3">
          ייבא גיבוי
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={e => importBackup(e.currentTarget)}
          />
        </label>
      </div>
    </>
  );
}
