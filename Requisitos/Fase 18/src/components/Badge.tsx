import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'neutral' | 'outline';
  className?: string;
}
export function Badge({
  children,
  variant = 'default',
  className
}: BadgeProps) {
  const variants = {
    default: 'bg-indigo-100 text-indigo-700 border-transparent',
    success: 'bg-emerald-100 text-emerald-700 border-transparent',
    warning: 'bg-amber-100 text-amber-800 border-transparent',
    neutral: 'bg-gray-100 text-gray-700 border-transparent',
    outline: 'bg-transparent border-gray-200 text-gray-600 border'
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}>

      {children}
    </span>);

}