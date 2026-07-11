import type { ButtonHTMLAttributes } from 'react';

type Variant = 'accent' | 'ghost' | 'google';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  accent: 'bg-accent text-[#0f1117] active:brightness-110',
  ghost: 'bg-surface text-muted border-[1.5px] border-border active:text-text active:border-muted',
  google: 'flex items-center justify-center gap-2.5 bg-white text-[#333] w-full',
};

export function Button({ variant = 'accent', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-semibold text-[15px] cursor-pointer transition-all duration-150 px-[18px] min-h-12 border-none ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
