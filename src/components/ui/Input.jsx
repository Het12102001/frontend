// src/components/ui/Input.jsx
import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({ label, type = 'text', placeholder, value, onChange, required, error }) => {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
        <label style={{
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--text-2)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          style={{
            width: '100%',
            background: 'var(--surface)',
            border: `1px solid ${error ? 'var(--danger)' : 'var(--border-strong)'}`,
            borderRadius: 'var(--radius)',
            padding: isPassword ? '14px 48px 14px 16px' : '14px 16px',
            fontSize: '14px',
            fontFamily: 'var(--font)',
            color: 'var(--text)',
            outline: 'none',
            transition: 'border-color var(--transition), box-shadow var(--transition), background var(--transition)',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'var(--accent)';
            e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
            e.target.style.background = 'var(--surface-2)';
          }}
          onBlur={e => {
            e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border-strong)';
            e.target.style.boxShadow = 'none';
            e.target.style.background = 'var(--surface)';
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            style={{
              position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
              display: 'flex', alignItems: 'center', padding: '2px',
              transition: 'color var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-2)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-3)'}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && (
        <p style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: '500' }}>{error}</p>
      )}
    </div>
  );
};

export default Input;


// ─────────────────────────────────────────────────────────
// src/components/ui/Button.jsx  (export separately below)
// ─────────────────────────────────────────────────────────
