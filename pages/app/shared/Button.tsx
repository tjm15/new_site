import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  className?: string;
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = ''
}: ButtonProps) {
  const baseStyles = "px-6 py-3 rounded-xl font-medium transition-all focus:outline-none focus:[box-shadow:var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-[var(--color-accent)] text-white shadow-md hover:shadow-lg",
    secondary: "bg-[var(--color-ink)] text-white shadow-md hover:shadow-lg",
    outline: "border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white"
  };
  
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
