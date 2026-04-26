import React from 'react';

interface PixelButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'gold';
  disabled?: boolean;
  className?: string;
}

const variantClasses = {
  primary: 'bg-accent-green text-white hover:bg-starbucks-green',
  secondary: 'bg-transparent border-2 border-accent-green text-accent-green hover:bg-accent-green/10',
  danger: 'bg-danger text-white hover:bg-red-700',
  gold: 'bg-gold text-white hover:bg-yellow-600',
};

export const PixelButton: React.FC<PixelButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-pill font-semibold text-sm tracking-tight
        transition-transform duration-150
        active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        border-2
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  );
};
