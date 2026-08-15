import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportStatsToXlsx } from './exportXlsx';
import { Ticket, Product, Stall } from '../../types';

interface ExportButtonProps {
  tickets: Ticket[];
  products: Product[];
  stalls: Stall[];
}

export function ExportButton({ tickets, products, stalls }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      // Defer curto para renderizar o spinner antes do processamento síncrono da planilha
      await new Promise(r => setTimeout(r, 50));
      exportStatsToXlsx(tickets, products, stalls);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 bg-[#0066ff] text-white shadow-sm px-4 py-2 rounded-xl font-bold text-xs hover:bg-[#0052cc] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Exportar relatório em Excel (.xlsx)"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
      )}
      <span>{loading ? 'Gerando...' : 'Exportar .xlsx'}</span>
    </button>
  );
}
