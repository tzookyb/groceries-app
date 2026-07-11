import type { ButtonHTMLAttributes } from 'react';

type Kind = 'move' | 'del';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: Kind;
}

const KIND_CLASSES: Record<Kind, string> = {
  move: 'bg-surface2 text-muted active:text-text active:bg-border',
  del: 'bg-surface2 text-muted active:text-red active:bg-red-dim',
};

export function IconButton({ kind = 'move', className = '', disabled, ...rest }: IconButtonProps) {
  return (
    <button
      disabled={disabled}
      className={`w-11 h-11 flex items-center justify-center border-none rounded-[10px] text-base shrink-0 transition-colors duration-150 cursor-pointer ${KIND_CLASSES[kind]} ${disabled ? 'opacity-30' : ''} ${className}`}
      {...rest}
    />
  );
}
