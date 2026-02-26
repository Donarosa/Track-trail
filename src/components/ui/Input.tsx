'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 rounded-lg border bg-tt-white text-foreground
            placeholder:text-foreground/40
            focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent
            transition-all duration-200
            ${error ? 'border-danger' : 'border-highlight/50'}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-sm text-danger">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
