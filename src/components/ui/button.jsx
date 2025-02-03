import { cn } from '@/lib/utils';
import PropTypes from 'prop-types';
import { forwardRef } from 'react';

const Button = forwardRef(({ className, variant = 'primary', size = 'md', ...props }, ref) => {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 btn-hover-effect',
        {
          'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 active:translate-y-0': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200 transform hover:-translate-y-0.5 active:translate-y-0': variant === 'secondary',
          'border border-gray-200 bg-white hover:bg-gray-100 transform hover:-translate-y-0.5 active:translate-y-0': variant === 'outline',
          'hover:bg-gray-100 transform hover:-translate-y-0.5 active:translate-y-0': variant === 'ghost',
          'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transform hover:-translate-y-0.5 active:translate-y-0 animate-pulse-slow': variant === 'gradient',
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'ghost', 'gradient']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export { Button };
