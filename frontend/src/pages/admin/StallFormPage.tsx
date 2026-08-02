import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStallMutations } from '../../hooks/useStalls';
import { useUsers } from '../../hooks/useUsers';
import { api } from '../../api/client';
import { useToast } from '../../components/admin/ToastContext';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export function StallFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const { createStall, updateStall } = useStallMutations();

  // Buscar usuários p/ o multiselect (apenas operadores e ativos idealmente)
  const { users, fetchUsers } = useUsers();
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  const availableUsers = users.filter((u: any) => u.role === 'operator');

  const [formData, setFormData] = useState({
    name: '',
    type: 'Alimentação',
    icon: '🏪',
    user_ids: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStall, setIsLoadingStall] = useState(mode === 'edit');

  useEffect(() => {
    if (mode === 'edit' && id) {
      api.getStalls().then(res => {
        const stall = res.data.find(s => s.id === Number(id) || s.id === String(id));
        if (stall) {
          setFormData({
            name: stall.name,
            type: stall.type || 'Alimentação',
            icon: stall.icon || '🏪',
            user_ids: stall.users?.map((u: any) => String(u.id)) || [],
          });
        }
      }).catch(() => showToast('Erro ao carregar barraca.', 'error'))
        .finally(() => setIsLoadingStall(false));
    }
  }, [mode, id, showToast]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Obrigatório.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = () => validate();

  const toggleUser = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      user_ids: prev.user_ids.includes(userId)
        ? prev.user_ids.filter(uid => uid !== userId)
        : [...prev.user_ids, userId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createStall(formData);
        showToast('Barraca criada com sucesso!', 'success');
      } else {
        await updateStall(id!, formData);
        showToast('Barraca atualizada com sucesso!', 'success');
      }
      navigate('/admin/stalls');
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar barraca.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingStall) {
    return <div className="p-8 text-gray-400">Carregando dados...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <button
        onClick={() => navigate('/admin/stalls')}
        className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {mode === 'create' ? 'Nova Barraca' : 'Editar Barraca'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">Configure o ponto de venda e equipe.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#191b24] p-6 rounded-2xl border border-gray-800 space-y-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="stall_name" className="text-xs font-semibold text-gray-300">Nome da Barraca</label>
            <input
              id="stall_name"
              type="text"
              value={formData.name}
              onBlur={handleBlur}
              onChange={e => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: ''}); }}
              placeholder="Ex: Barraca do Cachorro Quente"
              aria-describedby={errors.name ? 'stall-name-error' : undefined}
              className={`block w-full px-4 py-2.5 border rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 sm:text-sm transition-all ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-[#0066ff] focus:ring-[#0066ff]'}`}
            />
            {errors.name && <p id="stall-name-error" className="text-xs text-red-500 font-medium">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="stall_type" className="text-xs font-semibold text-gray-300">Tipo</label>
            <input
              id="stall_type"
              type="text"
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              placeholder="Ex: Alimentação, Bebida"
              className="block w-full px-4 py-2.5 border border-gray-700 rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-[#0066ff] sm:text-sm transition-all"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="stall_icon" className="text-xs font-semibold text-gray-300">Ícone / Emoji</label>
            <input
              id="stall_icon"
              type="text"
              value={formData.icon}
              onChange={e => setFormData({...formData, icon: e.target.value})}
              placeholder="🍔"
              className="block w-full px-4 py-2.5 border border-gray-700 rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-[#0066ff] sm:text-sm transition-all"
            />
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-gray-800">
          <label className="text-xs font-semibold text-gray-300">Operadores Vinculados (Múltipla Seleção)</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto p-1">
            {availableUsers.map((user: any) => (
              <label key={user.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${formData.user_ids.includes(String(user.id)) ? 'border-[#0066ff] bg-[#0066ff]/10' : 'border-gray-700 bg-[#121319] hover:bg-gray-800'}`}>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#0066ff] rounded border-gray-600 bg-gray-800 focus:ring-[#0066ff] focus:ring-offset-gray-900"
                  checked={formData.user_ids.includes(String(user.id))}
                  onChange={() => toggleUser(String(user.id))}
                />
                <span className="text-sm font-medium text-gray-200 truncate">{user.display_name || user.username}</span>
              </label>
            ))}
            {availableUsers.length === 0 && (
              <div className="col-span-full text-sm text-gray-500">Nenhum operador (comum) cadastrado.</div>
            )}
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-[#0066ff] text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSubmitting ? 'Salvando...' : 'Salvar Barraca'}
          </button>
        </div>
      </form>
    </div>
  );
}
