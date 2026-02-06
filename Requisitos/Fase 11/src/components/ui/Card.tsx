import React from 'react';
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}
export function Card({
  className = '',
  hoverable = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
        ${hoverable ? 'transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer' : ''}
        ${className}
      `}
      {...props}>

      {children}
    </div>);

}