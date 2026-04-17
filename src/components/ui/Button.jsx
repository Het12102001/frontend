import React from 'react';

const Button = ({ children, type = 'button', onClick, disabled, loading, variant = 'primary', className = '', style = {} }) => {
  const isDisabled = disabled || loading;

  const variants = {
    primary: {
      background: isDisabled ? 'rgba(59,130,246,0.4)' : 'var(--accent-gradient)',
      color: 'white',
      border: 'none',
      boxShadow: isDisabled ? 'none' : 'var(--shadow-accent)',
    },
    secondary: {
      background: 'var(--surface-2)',
      color: 'var(--text)',
      border: '1px solid var(--border-strong)',
      boxShadow: 'none',
    },
    danger: {
      background: isDisabled ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.15)',
      color: 'var(--danger)',
      border: '1px solid rgba(239,68,68,0.3)',
      boxShadow: 'none',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-2)',
      border: '1px solid var(--border)',
      boxShadow: 'none',
    },
  };

  const vs = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '13px 24px',
        borderRadius: 'var(--radius)',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: 'var(--font)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled && !loading ? 0.5 : 1,
        transition: 'all var(--transition)',
        userSelect: 'none',
        letterSpacing: '0.01em',
        ...vs,
        ...style,
      }}
      onMouseEnter={e => {
        if (!isDisabled) {
          if (variant === 'primary') e.currentTarget.style.filter = 'brightness(1.1)';
          if (variant === 'secondary') e.currentTarget.style.background = 'var(--surface-hover)';
          if (variant === 'danger') e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
          if (variant === 'ghost') e.currentTarget.style.background = 'var(--surface)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        if (!isDisabled) {
          e.currentTarget.style.filter = '';
          e.currentTarget.style.background = vs.background;
          e.currentTarget.style.transform = '';
        }
      }}
      onMouseDown={e => { if (!isDisabled) e.currentTarget.style.transform = 'translateY(0)'; }}
      onMouseUp={e => { if (!isDisabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
      className={className}
    >
      {loading ? (
        <>
          <span className="spinner" style={{ width: '16px', height: '16px' }} />
          <span>Loading...</span>
        </>
      ) : children}
    </button>
  );
};

export default Button;
