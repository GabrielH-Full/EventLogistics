import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isActive
          ? 'bg-green-500/10 text-green-500'
          : 'bg-gray-500/10 text-gray-500'
      }`}
    >
      {isActive ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  );
}
