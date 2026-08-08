import React from 'react';
import { LogIn, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

export interface LoginPresentationProps {
  username: string;
  setUsername: (u: string) => void;
  password: string;
  setPassword: (p: string) => void;
  error: string | null;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export default function MobileLoginView({
  username,
  setUsername,
  password,
  setPassword,
  error,
  submitting,
  onSubmit
}: LoginPresentationProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf8ff] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] border border-gray-100 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-[#0066ff] p-3 rounded-2xl text-white mb-3">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black text-[#191b24] tracking-tight">Logistica de Eventos</h1>
          <p className="text-xs text-gray-400 font-medium mt-1 text-center">
            Entre com a conta do Caixa Central ou da sua barraca
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1 block">
              Usuário
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="ex: admin, pastel, churrasco"
                className="w-full pl-9 pr-3 h-11 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 focus:border-[#0066ff]"
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1 block">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 h-11 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0066ff]/30 focus:border-[#0066ff]"
                required
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold px-3 py-2.5 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 rounded-xl bg-[#0066ff] hover:bg-[#0050cb] disabled:opacity-60 text-white font-bold text-sm transition-all active:scale-95"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-[10px] text-gray-400 text-center mt-6 leading-relaxed">
          Contas de demonstração — troque as senhas em produção:<br />
          <span className="font-mono">admin/admin123</span> · <span className="font-mono">pastel/pastel123</span> ·{' '}
          <span className="font-mono">churrasco/churrasco123</span>
        </p>
      </div>
    </div>
  );
}
