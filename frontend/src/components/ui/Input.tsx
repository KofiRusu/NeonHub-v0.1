import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type = 'text', ...props }, ref) => {
    const id = props.id || Math.random().toString(36).substring(2, 11);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {icon}
            </div>
          )}
          <input
            id={id}
            type={type}
            className={cn(
              'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors',
              error
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500/50'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/50',
              icon && 'pl-10',
              className,
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-error-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
