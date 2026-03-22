import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-5 mb-2 px-1">
      {children}
    </h3>
  );
}

export function MetricCard({ label, value, sub, color = 'brand' }) {
  const colors = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="text-xs font-medium opacity-70 mb-1">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-green-100 text-green-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md ${colors[color]}`}>
      {children}
    </span>
  );
}

export function Input({ label, ...props }) {
  return (
    <div className="mb-3">
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      <input
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
        {...props}
      />
    </div>
  );
}

export function Select({ label, options, ...props }) {
  return (
    <div className="mb-3">
      {label && <label className="block text-xs text-gray-500 mb-1">{label}</label>}
      <select
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-900"
        {...props}
      >
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </div>
  );
}

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const base = 'w-full py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95';
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ message }) {
  return (
    <div className="text-center py-8 text-gray-400 text-sm">{message}</div>
  );
}

export function ListItem({ main, sub, extra, right, rightSub, onDelete }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0 fade-in">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{main}</div>
        {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
        {extra && <div className="mt-1">{extra}</div>}
      </div>
      <div className="flex items-start gap-3 ml-3 shrink-0">
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">{right}</div>
          {rightSub && <div className="text-xs text-gray-400">{rightSub}</div>}
        </div>
        {onDelete && (
          <button onClick={onDelete} className="text-gray-300 hover:text-red-400 transition-colors mt-0.5 text-base">✕</button>
        )}
      </div>
    </div>
  );
}

export function DatePicker({ value, onChange }) {
  return (
    <input
      type="date"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-700"
    />
  );
}
