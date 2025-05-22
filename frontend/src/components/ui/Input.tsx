import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={id} 
          className="block text-sm font-medium text-text-primary dark:text-text-dark-primary"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={clsx(
          'block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
          error ? 'border-red-300' : 'border-gray-300 dark:border-dark-primary',
          'text-text-primary dark:text-text-dark-primary bg-background-card dark:bg-background-dark-card',
          'placeholder-text-tertiary dark:placeholder-text-dark-tertiary',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
} 