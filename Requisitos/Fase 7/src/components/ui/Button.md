import React from 'react';
import { Loader2 } from 'lucide-react';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}
export function Button({
  children,
  variant = 'primary',
  isLoading,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
  'inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base';
  const variants = {
    primary:
    'bg-[#1e3a5f] text-white hover:bg-[#2d4f7c] focus:ring-[#1e3a5f] shadow-md hover:shadow-lg',
    secondary:
    'bg-[#f5f0e8] text-[#1e3a5f] hover:bg-[#e6decf] focus:ring-[#1e3a5f]',
    outline:
    'border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#f5f0e8] focus:ring-[#1e3a5f]',
    ghost: 'text-[#1e3a5f] hover:bg-[#f5f0e8]/50 focus:ring-[#1e3a5f]'
  };
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}>

      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!isLoading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>);

}