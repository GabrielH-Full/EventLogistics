import React from 'react';
import { DollarSign, Ticket, Store, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { brl } from './stats';

interface StatCardsProps {
  revenue: number;
  units: number;
  activeStalls: number;
  topProduct: {
    name: string;
    qty: number;
  };
}

export function StatCards({ revenue, units, activeStalls, topProduct }: StatCardsProps) {
  const cards = [
    {
      label: 'Faturamento Validado',
      value: brl(revenue),
      hint: 'Tickets validados no evento',
      icon: DollarSign,
      accent: 'text-[#0066ff]',
      bg: 'bg-blue-50 border-blue-100',
      iconBg: 'bg-[#0066ff]/10 text-[#0066ff]',
    },
    {
      label: 'Unidades Entregues',
      value: units.toLocaleString('pt-BR'),
      hint: 'Itens em tickets validados',
      icon: Ticket,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
      iconBg: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      label: 'Barracas Ativas',
      value: String(activeStalls),
      hint: 'Pontos de venda com movimento',
      icon: Store,
      accent: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
      iconBg: 'bg-amber-500/10 text-amber-600',
    },
    {
      label: 'Produto Destaque',
      value: topProduct.name,
      hint: `${topProduct.qty.toLocaleString('pt-BR')} unid. validadas`,
      icon: Trophy,
      accent: 'text-fuchsia-600',
      bg: 'bg-fuchsia-50 border-fuchsia-100',
      iconBg: 'bg-fuchsia-500/10 text-fuchsia-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, hint, icon: Icon, iconBg }, idx) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: idx * 0.05 }}
          className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
              {label}
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl lg:text-3xl font-black text-[#191b24] tracking-tight leading-tight truncate">
              {value}
            </p>
            <p className="text-xs font-medium text-gray-500 mt-1">{hint}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
