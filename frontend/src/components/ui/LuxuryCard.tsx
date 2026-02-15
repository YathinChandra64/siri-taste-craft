// /src/components/ui/LuxuryCard.tsx
// ✅ PRODUCTION-READY LUXURY CARD COMPONENT

import { ReactNode } from 'react';

interface LuxuryCardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const paddingStyles = {
  sm: 'p-[var(--spacing-lg)]',
  md: 'p-[var(--spacing-xl)]',
  lg: 'p-[var(--spacing-2xl)]',
} as const;

export const LuxuryCard = ({
  children,
  className = '',
  interactive = false,
  padding = 'md',
  hoverable = interactive,
}: LuxuryCardProps) => {
  return (
    <div
      className={`
        bg-[var(--bg-card)]
        rounded-[var(--radius-xl)]
        border border-[var(--border-soft)]
        shadow-[var(--shadow-sm)]
        transition-all
        duration-[var(--transition-fast)]
        ${hoverable && 'hover:shadow-[var(--shadow-md)] hover:border-[var(--border-light)] cursor-pointer'}
        ${interactive && 'hover:scale-[1.02]'}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};