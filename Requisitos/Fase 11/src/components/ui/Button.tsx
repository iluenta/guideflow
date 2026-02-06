import React from 'react';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
}
export function Button({
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  style,
  ...props
}: ButtonProps) {
  const baseStyles =
  'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-95';
  // We'll apply dynamic styles via the style prop for theme colors
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          className: 'text-white shadow-lg shadow-blue-900/20 hover:opacity-90',
          style: {
            backgroundColor: 'var(--color-primary)',
            ...style
          }
        };
      case 'secondary':
        return {
          className:
          'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm',
          style: style
        };
      case 'outline':
        return {
          className: 'border-2 hover:bg-gray-50',
          style: {
            borderColor: 'var(--color-primary)',
            color: 'var(--color-primary)',
            ...style
          }
        };
      case 'ghost':
        return {
          className: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
          style: style
        };
      case 'link':
        return {
          className:
          'underline-offset-4 hover:underline p-0 h-auto active:scale-100',
          style: {
            color: 'var(--color-primary)',
            ...style
          }
        };
      default:
        return {
          className: '',
          style
        };
    }
  };
  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-12 px-6 text-sm',
    lg: 'h-14 px-8 text-base',
    icon: 'h-10 w-10 p-2'
  };
  const widthClass = fullWidth ? 'w-full' : '';
  const variantConfig = getVariantStyles();
  return (
    <button
      className={`${baseStyles} ${variantConfig.className} ${sizes[size]} ${widthClass} ${className}`}
      style={variantConfig.style}
      {...props}>

      {children}
    </button>);

}