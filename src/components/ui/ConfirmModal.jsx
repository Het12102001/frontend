import React from 'react';

const ConfirmModal = ({ message, onConfirm, onCancel, danger = true }) => (
  <div style={{
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 9999, padding: '20px'
  }}>
    <div className="animate-scale-in" style={{
      background: '#0f1117',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      padding: '28px 28px 24px',
      maxWidth: '380px', width: '100%',
      boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
    }}>
      <p style={{
        color: '#e2e8f0', fontSize: '15px', fontWeight: '600',
        lineHeight: '1.6', marginBottom: '24px', marginTop: 0
      }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '9px 20px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.05)',
            color: '#94a3b8', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: '13px', fontWeight: '600',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          style={{
            padding: '9px 20px', borderRadius: '10px', border: 'none',
            background: danger
              ? 'linear-gradient(135deg,#ef4444,#dc2626)'
              : 'linear-gradient(135deg,#3b82f6,#6366f1)',
            color: '#fff', cursor: 'pointer',
            fontFamily: 'var(--font)', fontSize: '13px', fontWeight: '700',
            boxShadow: danger ? '0 4px 14px rgba(239,68,68,0.4)' : '0 4px 14px rgba(59,130,246,0.4)',
          }}
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
