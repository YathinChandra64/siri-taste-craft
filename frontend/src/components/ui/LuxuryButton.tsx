// /src/components/ui/LuxuryButton.tsx
// ✅ PRODUCTION-READY LUXURY BUTTON COMPONENT

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface LuxuryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variantStyles = {
  primary:
    'bg-[var(--accent-gold)] text-[var(--bg-primary)] hover:bg-[var(--accent-deep-gold)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]',
  secondary:
    'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-soft)] border border-[var(--border-soft)]',
  outline:
    'border-2 border-[var(--border-light)] text-[var(--text-primary)] hover:border-[var(--accent-gold)] hover:bg-[var(--bg-secondary)]',
  ghost:
    'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]',
} as const;

const sizeStyles = {
  sm: 'px-[var(--spacing-md)] py-[var(--spacing-sm)] text-sm font-medium',
  md: 'px-[var(--spacing-lg)] py-[var(--spacing-md)] text-base font-medium',
  lg: 'px-[var(--spacing-xl)] py-[var(--spacing-lg)] text-base font-semibold',
} as const;

export const LuxuryButton = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled = false,
  children,
  ...props
}: LuxuryButtonProps) => {
  return (
    <button
      disabled={disabled || loading}
      className={`
        rounded-[var(--radius-lg)]
        transition-all
        duration-[var(--transition-fast)]
        disabled:opacity-50
        disabled:cursor-not-allowed
        active:scale-95
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};