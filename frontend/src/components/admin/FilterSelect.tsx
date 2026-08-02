import React from 'react';

interface Option {
  label: string;
  value: string;
}

interface FilterSelectProps {
  label: string;
  options: Option[];
  value: string;
  onChange: (val: string) => void;
}

export function FilterSelect({ label, options, value, onChange }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1 w-full max-w-xs">
      <label className="text-xs font-semibold text-gray-400">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-700 rounded-xl leading-5 bg-[#191b24] text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-[#0066ff] sm:text-sm transition-all duration-200 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
