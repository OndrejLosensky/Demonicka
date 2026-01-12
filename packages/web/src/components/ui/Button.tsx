import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  isLoading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'flex justify-center items-center py-2 px-4 rounded-md shadow-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-primary hover:bg-primary text-white border border-transparent focus:ring-primary',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border border-transparent focus:ring-gray-500',
    outline: 'bg-background-primary hover:bg-background-secondary text-text-primary border border-gray-300 focus:ring-primary',
  };

  const styles = clsx(
    baseStyles,
    variants[variant],
    fullWidth && 'w-full',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  return (
    <button
      className={styles}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
} 