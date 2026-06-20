import type { ReactNode } from 'react';

interface IconProps {
  children: ReactNode;
  className?: string;
}

export function Icon({ children, className = '' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}
