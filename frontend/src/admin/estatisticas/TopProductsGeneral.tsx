import React from 'react';
import { motion } from 'motion/react';
import { AggregatedProductSale, brl } from './stats';
import { PackageCheck } from 'lucide-react';

interface TopProductsGeneralProps {
  products: (AggregatedProductSale & { color: string })[];
  totalUnits: number;
}

export function TopProductsGeneral({ products, totalUnits }: TopProductsGeneralProps) {
  // Compute donut segments
  const R = 40;
  const C = 2 * Math.PI * R; // ~251.327

  let cumulativePercent = 0;
  const segments = products.map((item) => {
    const percent = totalUnits > 0 ? item.qty / totalUnits : 0;
    const strokeDasharray = `${percent * C} ${C}`;
    const strokeDashoffset = -cumulativePercent * C;
    cumulativePercent += percent;

    return {
      ...item,
      percent: (percent * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-lg font-black text-[#191b24] tracking-tight flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-600" />
            <span>Produtos Mais Vendidos</span>
          </h3>
          <span className="text-xs font-extrabold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
            {totalUnits.toLocaleString('pt-BR')} unid.
          </span>
        </div>
        <p className="text-xs text-gray-500 font-medium mb-6">
          Distribuição geral de unidades validadas no evento
        </p>

        {products.length === 0 || totalUnits === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm font-semibold border-2 border-dashed border-gray-100 rounded-xl">
            Nenhuma unidade validada ainda.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
            {/* SVG Donut Chart */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={R}
                  className="stroke-gray-100 fill-none"
                  strokeWidth="14"
                />
                {/* Donut Segments */}
                {segments.map((seg, idx) => (
                  <motion.circle
                    key={seg.id}
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="14"
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    initial={{ strokeDasharray: `0 ${C}` }}
                    animate={{ strokeDasharray: seg.strokeDasharray }}
                    transition={{ duration: 0.6, delay: idx * 0.08 }}
                  />
                ))}
              </svg>
              {/* Inner Donut Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                <span className="text-2xl font-black text-[#191b24] leading-none">
                  {totalUnits.toLocaleString('pt-BR')}
                </span>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  Unidades
                </span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="flex-1 w-full space-y-2.5">
              {segments.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-bold text-gray-800 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-gray-400 text-[11px] font-normal">{item.percent}%</span>
                    <span className="font-black text-gray-900">{item.qty} un.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
        <span>Ranking dos top produtos</span>
        <span className="font-bold text-gray-700">{products.length} itens no topo</span>
      </div>
    </div>
  );
}
