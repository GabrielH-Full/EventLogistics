import React from 'react';
import { motion } from 'motion/react';
import { StallRevenue, brl } from './stats';
import { DollarSign } from 'lucide-react';

interface RevenueByStallProps {
  data: StallRevenue[];
  totalRevenue: number;
}

export function RevenueByStall({ data, totalRevenue }: RevenueByStallProps) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="text-lg font-black text-[#191b24] tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#0066ff]" />
            <span>Faturamento por Barraca</span>
          </h3>
          <span className="text-xs font-extrabold bg-blue-50 text-[#0066ff] px-2.5 py-1 rounded-full border border-blue-100">
            {brl(totalRevenue)} Total
          </span>
        </div>
        <p className="text-xs text-gray-500 font-medium mb-6">
          Receita em R$ de tickets validados por ponto de venda
        </p>

        {data.length === 0 || totalRevenue === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm font-semibold border-2 border-dashed border-gray-100 rounded-xl">
            Nenhum faturamento validado registrado ainda.
          </div>
        ) : (
          <div className="space-y-4 my-2">
            {data.map((item, idx) => {
              const percentage = totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(1) : '0';
              const barWidth = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;

              return (
                <div key={item.stallId} className="group">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-800">{item.stallName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-[11px] font-normal">{percentage}%</span>
                      <span className="text-gray-900 font-black">{brl(item.revenue)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 h-3.5 rounded-full overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(barWidth, item.revenue > 0 ? 4 : 0)}%` }}
                      transition={{ duration: 0.5, delay: idx * 0.08 }}
                      className="h-full rounded-full transition-all"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
        <span>Considera apenas tickets validados</span>
        <span className="font-bold text-gray-700">{data.length} barracas</span>
      </div>
    </div>
  );
}
