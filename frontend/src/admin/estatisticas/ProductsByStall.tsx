import React from 'react';
import { motion } from 'motion/react';
import { StallProductsGroup, brl } from './stats';

interface ProductsByStallProps {
  groups: StallProductsGroup[];
}

export function ProductsByStall({ groups }: ProductsByStallProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {groups.map((group, groupIdx) => {
        const totalStallRevenue = group.products.reduce((acc, p) => acc + p.revenue, 0);
        const totalStallQty = group.products.reduce((acc, p) => acc + p.qty, 0);
        const maxQtyInStall = Math.max(...group.products.map(p => p.qty), 1);

        return (
          <motion.div
            key={group.stallId}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: groupIdx * 0.05 }}
            className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: group.color }}
                  />
                  <h4 className="text-base font-black text-[#191b24] tracking-tight">
                    {group.stallName}
                  </h4>
                </div>
                <span className="text-xs font-extrabold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                  {totalStallQty} unid.
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium mb-4">
                Mais vendidos · Total: <span className="font-bold text-gray-900">{brl(totalStallRevenue)}</span>
              </p>

              {group.products.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs font-semibold border-2 border-dashed border-gray-100 rounded-xl">
                  Nenhuma venda validada nesta barraca.
                </div>
              ) : (
                <div className="space-y-3">
                  {group.products.map((p, idx) => {
                    const barWidth = (p.qty / maxQtyInStall) * 100;

                    return (
                      <div key={p.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-800 truncate max-w-[180px]">
                            {p.name}
                          </span>
                          <div className="flex items-center gap-2 font-semibold">
                            <span className="text-gray-400 text-[11px] font-normal">{brl(p.revenue)}</span>
                            <span className="text-gray-900 font-black">{p.qty} un.</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(barWidth, p.qty > 0 ? 5 : 0)}%` }}
                            transition={{ duration: 0.4, delay: idx * 0.05 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
