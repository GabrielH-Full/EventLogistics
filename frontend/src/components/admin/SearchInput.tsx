import React from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
  placeholder?: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export function SearchInput({ placeholder = 'Buscar...', onChange, debounceMs = 300 }: SearchInputProps) {
  const [value, setValue] = React.useState('');

  React.useEffect(() => {
    const handler = setTimeout(() => {
      onChange(value);
    }, debounceMs);
    return () => clearTimeout(handler);
  }, [value, onChange, debounceMs]);

  return (
    <div className="relative w-full max-w-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <input
        type="text"
        className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-xl leading-5 bg-[#191b24] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-[#0066ff] sm:text-sm transition-all duration-200"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
