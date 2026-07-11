import { forwardRef, type InputHTMLAttributes } from 'react';

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput(props, ref) {
    return (
      <input
        ref={ref}
        type="text"
        className="flex-1 bg-surface border-[1.5px] border-border rounded-xl text-text text-base px-4 min-h-12 outline-none transition-colors duration-200 focus:border-accent"
        {...props}
      />
    );
  }
);
