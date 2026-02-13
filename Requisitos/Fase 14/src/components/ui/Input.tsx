import React, { useId } from 'react';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}
export function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || useId();
  return (
    <div className="w-full">
      {label &&
      <label
        htmlFor={inputId}
        className="block text-sm font-medium text-text-primary mb-1.5">

          {label}
        </label>
      }
      <input
        id={inputId}
        className={`
          flex h-11 w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
          ${error ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300'}
          ${className}
        `}
        {...props} />

      {helperText && !error &&
      <p className="mt-1.5 text-xs text-text-secondary">{helperText}</p>
      }
      {error &&
      <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
      }
    </div>);

}