import React from 'react';

const Button = ({ children, type = "submit", loading = false, className = "" }) => (
  <button
    type={type}
    disabled={loading}
    className={`flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98] disabled:opacity-70 ${className}`}
  >
    {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
    {children}
  </button>
);

export default Button;