import React from 'react';
import { Inbox, AlertCircle } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  total: number;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  page?: number;
  limit?: number;
  onPageChange?: (page: number) => void;
  actions?: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  total,
  isLoading,
  error,
  onRetry,
  page = 1,
  limit = 10,
  onPageChange,
  actions
}: DataTableProps<T>) {

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-bold text-black mb-2">Erro ao carregar dados</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        {onRetry && (
          <button onClick={onRetry} className="bg-[#0066ff] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all cursor-pointer">
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="w-full">
      <div className="overflow-x-auto bg-[#191b24] border border-gray-800 rounded-2xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-[#121319]">
              {columns.map((col) => (
                <th key={col.key} className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
              {actions && <th className="px-5 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4">
                      <div className="h-4 bg-gray-800 rounded animate-pulse w-3/4"></div>
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-4">
                      <div className="h-8 bg-gray-800 rounded animate-pulse w-16 ml-auto"></div>
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-5 py-12 text-center">
                  <div className="flex flex-col items-center">
                    <Inbox className="w-12 h-12 text-gray-600 mb-4" />
                    <p className="text-gray-400 font-medium">Nenhum registro encontrado</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-800/30 transition-colors duration-150">
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4 text-sm text-gray-300">
                      {col.render ? col.render(row) : String((row as any)[col.key] ?? '')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-5 py-4 text-right">
                      {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && total > 0 && onPageChange && (
        <div className="mt-4 flex items-center justify-between px-2">
          <span className="text-sm text-gray-500 font-medium">
            Mostrando {Math.min((page - 1) * limit + 1, total)} até {Math.min(page * limit, total)} de {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-400 bg-[#191b24] border border-gray-800 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-300 font-bold px-2">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold text-gray-400 bg-[#191b24] border border-gray-800 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
