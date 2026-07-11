import { useRef } from 'react';
import { Button } from './Button';
import { TextInput } from './TextInput';

interface AddRowProps {
  placeholder: string;
  onAdd: (value: string) => void;
  extra?: React.ReactNode;
}

export function AddRow({ placeholder, onAdd, extra }: AddRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function submit() {
    const val = inputRef.current?.value.trim();
    if (!val) return;
    onAdd(val);
    if (inputRef.current) inputRef.current.value = '';
    inputRef.current?.focus();
  }

  return (
    <div className="flex gap-2">
      <TextInput
        ref={inputRef}
        placeholder={placeholder}
        onKeyDown={e => { if (e.key === 'Enter') submit(); }}
      />
      <Button onClick={submit} className="whitespace-nowrap">הוסף</Button>
      {extra}
    </div>
  );
}
