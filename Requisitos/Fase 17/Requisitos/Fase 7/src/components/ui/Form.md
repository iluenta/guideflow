import React from 'react';
import { Check } from 'lucide-react';
interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}
export function Label({
  children,
  className = '',
  required,
  ...props
}: LabelProps) {
  return (
    <label
      className={`block text-sm font-semibold text-[#1e3a5f] mb-2 ${className}`}
      {...props}>

      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>);

}
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}
export function Input({
  label,
  error,
  className = '',
  fullWidth = true,
  required,
  ...props
}: InputProps) {
  return (
    <div className={`${fullWidth ? 'w-full' : ''} mb-4`}>
      {label && <Label required={required}>{label}</Label>}
      <input
        className={`w-full px-4 py-3 rounded-lg border bg-white transition-all duration-200 
          ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20'} 
          focus:outline-none focus:ring-4 text-[#1e3a5f] placeholder:text-gray-400
          ${className}`}
        {...props} />

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>);

}
interface TextAreaProps extends
  React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export function TextArea({
  label,
  error,
  className = '',
  required,
  ...props
}: TextAreaProps) {
  return (
    <div className="w-full mb-4">
      {label && <Label required={required}>{label}</Label>}
      <textarea
        className={`w-full px-4 py-3 rounded-lg border bg-white transition-all duration-200 min-h-[120px]
          ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20'} 
          focus:outline-none focus:ring-4 text-[#1e3a5f] placeholder:text-gray-400
          ${className}`}
        {...props} />

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>);

}
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: {
    value: string;
    label: string;
  }[];
}
export function Select({
  label,
  error,
  options,
  className = '',
  required,
  ...props
}: SelectProps) {
  return (
    <div className="w-full mb-4">
      {label && <Label required={required}>{label}</Label>}
      <div className="relative">
        <select
          className={`w-full px-4 py-3 rounded-lg border bg-white appearance-none transition-all duration-200
            ${error ? 'border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]/20'} 
            focus:outline-none focus:ring-4 text-[#1e3a5f]
            ${className}`}
          {...props}>

          {options.map((opt) =>
          <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          )}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24">

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7" />

          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>);

}
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label
      className={`flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${className}`}>

      <div className="relative flex items-center">
        <input
          type="checkbox"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 shadow-sm checked:border-[#1e3a5f] checked:bg-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/20"
          {...props} />

        <Check className="pointer-events-none absolute h-3.5 w-3.5 left-0.5 top-0.5 text-white opacity-0 peer-checked:opacity-100" />
      </div>
      <span className="ml-3 text-[#1e3a5f] font-medium">{label}</span>
    </label>);

}