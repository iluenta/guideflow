import React from 'react';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}
export function Card({
  children,
  className = '',
  title,
  description
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>

      {(title || description) &&
      <div className="px-6 pt-6 pb-4 border-b border-gray-50">
          {title &&
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        }
          {description &&
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
        }
        </div>
      }
      <div className="p-6">{children}</div>
    </div>);

}