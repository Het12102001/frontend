import React from 'react';

const Input = ({ label, type = "text", placeholder, value, onChange, required = false, ...props }) => {
  return (
    <div className="flex flex-col gap-2 w-full text-left">
      {label && <label className="text-sm font-bold text-slate-700 ml-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="
          w-full px-5 py-4 rounded-2xl border border-slate-200 
          bg-white/50 backdrop-blur-sm outline-none transition-all duration-300
          focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5
          text-slate-900 placeholder:text-slate-400
        "
        {...props}
      />
    </div>
  );
};

export default Input;