import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, Lock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
interface WizardStepProps {
  stepNumber: number;
  title: string;
  status: 'complete' | 'active' | 'upcoming';
  onClick?: () => void;
}
export function WizardStep({
  stepNumber,
  title,
  status,
  onClick
}: WizardStepProps) {
  return (
    <button
      onClick={status !== 'upcoming' ? onClick : undefined}
      disabled={status === 'upcoming'}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 border-l-4',
        status === 'active' ?
        'bg-indigo-50 border-indigo-600' :
        'border-transparent hover:bg-gray-50',
        status === 'upcoming' &&
        'cursor-not-allowed opacity-60 hover:bg-transparent'
      )}>

      <div className="relative flex-shrink-0">
        {status === 'complete' ?
        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div> :
        status === 'active' ?
        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
            <span className="text-xs font-bold">{stepNumber}</span>
          </div> :

        <div className="w-7 h-7 rounded-full border border-gray-300 text-gray-400 flex items-center justify-center">
            <span className="text-xs font-medium">{stepNumber}</span>
          </div>
        }
      </div>

      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm font-medium truncate block',
            status === 'active' ?
            'text-indigo-900' :
            status === 'complete' ?
            'text-gray-700' :
            'text-gray-400'
          )}>

          {title}
        </span>
      </div>

      {status === 'active' &&
      <motion.div
        layoutId="active-indicator"
        className="w-1.5 h-1.5 rounded-full bg-indigo-600" />

      }
    </button>);

}