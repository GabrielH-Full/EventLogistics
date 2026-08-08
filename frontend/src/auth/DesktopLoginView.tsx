import React, { useState } from 'react';
import { LogIn, Lock, User as UserIcon, AlertCircle, Eye, EyeOff, Boxes, KeyRound } from 'lucide-react';
import { LoginPresentationProps } from './MobileLoginView'; // We can import the interface from here

export default function DesktopLoginView({
  username,
  setUsername,
  password,
  setPassword,
  error,
  submitting,
  onSubmit
}: LoginPresentationProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex w-full min-h-screen bg-white">
      {/* Left Panel: Visual/Branding */}
      <div className="relative hidden lg:flex flex-1 flex-col justify-end p-12 overflow-hidden bg-[#D8E3FB]">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/login-bg.png')" }}
        />
        {/* Atmospheric Overlays */}
        <div className="absolute inset-0 z-10 bg-[#0050CB]/40 mix-blend-multiply" />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-[#111C2D]/90 via-[#111C2D]/40 to-transparent" />

        {/* Content */}
        <div className="relative z-30 max-w-lg mb-8">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center mb-6 border border-white/20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
            <Boxes className="w-6 h-6 text-[#DAE1FF]" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-tight drop-shadow-md">
            Operações Estratégicas
          </h1>
          <p className="text-lg text-white/90 leading-relaxed font-medium">
            Gestão unificada para o ecossistema de eventos. Acesso
            seguro e monitoramento em tempo real para equipes de
            logística.
          </p>
        </div>
      </div>

      {/* Right Panel: Login Form Area */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 bg-white overflow-y-auto relative">
        <div className="w-full max-w-[440px] space-y-10">

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-[32px] font-bold text-[#111C2D] tracking-tight leading-tight">
              EventFlow
            </h2>
            <p className="text-[#424656] text-base font-normal">
              Insira suas credenciais para acessar o painel operacional.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold tracking-wider text-[#424656] uppercase">
                USUÁRIO
              </label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-[#505F76] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="w-full pl-12 pr-4 h-14 rounded-lg border border-[#C2C6D8] bg-[#F9F9FF] text-[#111C2D] text-[15px] font-medium placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0050CB]/30 focus:border-[#0050CB] transition-all"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold tracking-wider text-[#424656] uppercase">
                SENHA
              </label>
              <div className="relative flex items-center">
                <Lock className="w-5 h-5 text-[#505F76] absolute left-4" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full pl-12 pr-12 h-14 rounded-lg border border-[#C2C6D8] bg-[#F9F9FF] text-[#111C2D] text-[15px] font-medium placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0050CB]/30 focus:border-[#0050CB] transition-all"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-[#505F76] hover:text-[#111C2D] focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-[#ffdad6] border border-[#ffb4ab] text-[#ba1a1a] text-sm font-semibold px-4 py-3 rounded-lg shadow-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-14 mt-2 flex items-center justify-center gap-2 rounded-lg bg-[#0050CB] hover:bg-[#0040a8] disabled:opacity-70 text-white font-semibold text-lg transition-all active:scale-[0.98] shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
            >
              <span>{submitting ? 'Entrando...' : 'Entrar'}</span>
              {!submitting && <LogIn className="w-5 h-5" />}
            </button>
          </form>

          {/* Demo Instructions */}
          <div className="mt-12 bg-[#E7EEFF] border border-[#C2C6D8] rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-[#0050CB]" />
              <h3 className="text-[#111C2D] text-lg font-semibold">
                Contas de Demonstração
              </h3>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-[#C2C6D8]/50">
              <span className="text-[#424656] text-sm font-medium">Administrador Global:</span>
              <span className="bg-white px-3 py-1 rounded border border-[#C2C6D8] text-[#111C2D] font-mono text-sm shadow-sm">
                admin / admin123
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#424656] text-sm font-medium">Caixa Pastel:</span>
              <span className="bg-white px-3 py-1 rounded border border-[#C2C6D8] text-[#111C2D] font-mono text-sm shadow-sm">
                pastel / pastel123
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#424656] text-sm font-medium">Caixa Churrasco:</span>
              <span className="bg-white px-3 py-1 rounded border border-[#C2C6D8] text-[#111C2D] font-mono text-sm shadow-sm">
                churrasco / churrasco123
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 text-center w-full">
          <p className="text-[#727687] text-xs font-bold tracking-wider uppercase">
            © 2026 EventFlow Systems
          </p>
        </div>
      </div>
    </div>
  );
}
