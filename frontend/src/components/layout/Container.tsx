// /src/components/layout/Container.tsx
// ✅ PRODUCTION-READY REUSABLE LAYOUT CONTAINER

import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
  full: 'max-w-full',
} as const;

export const Container = ({
  children,
  className = '',
  maxWidth = '2xl',
}: ContainerProps) => {
  return (
    <div
      className={`
        mx-auto
        px-[var(--spacing-lg)]
        sm:px-[var(--spacing-xl)]
        md:px-[var(--spacing-2xl)]
        ${maxWidthClasses[maxWidth]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};