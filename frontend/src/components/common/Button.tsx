import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: ReactNode;
}

const variantClassNames: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-[var(--color-primary-strong)]',
  secondary: 'border border-line bg-panel text-text hover:bg-surface',
  ghost: 'text-text hover:bg-surface',
  danger: 'bg-[var(--color-up)] text-white hover:brightness-95',
};

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-app px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClassNames[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
