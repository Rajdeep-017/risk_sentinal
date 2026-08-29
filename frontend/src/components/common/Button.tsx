import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const baseStyles: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontWeight: 600,
  borderRadius: '8px',
  borderWidth: 0,
  borderStyle: 'solid',
  borderColor: 'transparent',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
  outline: 'none',
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'linear-gradient(135deg, var(--accent-primary), #2563eb)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'var(--color-text-primary)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  danger: {
    background: 'linear-gradient(135deg, var(--risk-critical), #b91c1c)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  outline: {
    backgroundColor: 'transparent',
    color: 'var(--accent-primary)',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'var(--accent-primary)',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '12px', gap: '6px' },
  md: { padding: '10px 20px', fontSize: '14px', gap: '8px' },
  lg: { padding: '14px 28px', fontSize: '16px', gap: '10px' },
};

const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    boxShadow: '0 4px 16px rgba(59, 130, 246, 0.5)',
    transform: 'translateY(-1px)',
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  danger: {
    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.5)',
    transform: 'translateY(-1px)',
  },
  ghost: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: 'var(--color-text-primary)',
  },
  outline: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'var(--accent-primary)',
  },
};

const activeStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)' },
  secondary: { backgroundColor: 'rgba(255,255,255,0.15)' },
  danger: { transform: 'translateY(0)', boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)' },
  ghost: { backgroundColor: 'rgba(255,255,255,0.1)' },
  outline: { backgroundColor: 'rgba(59, 130, 246, 0.15)' },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, disabled, children, style, className, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);
    const [isActive, setIsActive] = React.useState(false);
    const isDisabled = disabled || loading;

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) setIsHovered(true);
      onMouseEnter?.(e);
    };
    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsHovered(false);
      setIsActive(false);
      onMouseLeave?.(e);
    };
    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!isDisabled) setIsActive(true);
      onMouseDown?.(e);
    };
    const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsActive(false);
      onMouseUp?.(e);
    };

    const combinedStyle: React.CSSProperties = {
      ...baseStyles,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...(isHovered && !isDisabled ? hoverStyles[variant] : {}),
      ...(isActive && !isDisabled ? activeStyles[variant] : {}),
      ...(isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
      ...(fullWidth ? { width: '100%' } : {}),
      ...(style || {}),
    };

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={combinedStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        {...props}
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            {leftIcon && <span style={{ display: 'flex' }}>{leftIcon}</span>}
            {children}
            {rightIcon && <span style={{ display: 'flex' }}>{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';