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
    type: 'Alimento',
    category_id: '',
    ///suser_ids: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStall, setIsLoadingStall] = useState(mode === 'edit');

  useEffect(() => {
    if (mode === 'edit' && id) {
      api.getStalls().then(res => {
        const stall = res.data.find((s: any) => s.id === Number(id) || s.id === String(id));
        if (stall) {
          const [mainType, ...sub] = stall.type ? stall.type.split(': ') : ['Alimento'];
          const category = sub.length > 0 ? sub.join(': ') : (mainType === 'Alimento' ? 'Pastel' : 'Refrigerante');
          setFormData({
            name: stall.name,
            type: mainType || 'Alimento',
            category_id: stall.category_id ? String(stall.category_id) : '1',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const payload = {
      ...formData,
      category_id: Number(formData.category_id),
    };

    try {
      if (mode === 'create') {
        await createStall(payload);
        showToast('Barraca criada com sucesso!', 'success');
      } else {
        await updateStall(id!, payload);
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
        <h1 className="text-2xl font-black text-black tracking-tight">
          {mode === 'create' ? 'Nova Barraca' : 'Editar Barraca'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">Configure o ponto de venda e equipe.</p>
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
              onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
              placeholder="Ex: Barraca do Cachorro Quente"
              aria-describedby={errors.name ? 'stall-name-error' : undefined}
              className={`block w-full px-4 py-2.5 border rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 sm:text-sm transition-all ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-[#0066ff] focus:ring-[#0066ff]'}`}
            />
            {errors.name && <p id="stall-name-error" className="text-xs text-red-500 font-medium">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {['Alimento', 'Bebida'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: t, category_id: t === 'Alimento' ? 'Pastel' : 'Refrigerante' })}
                  className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all cursor-pointer border ${formData.type === t ? 'border-[#0066ff] bg-[#0066ff]/20 text-[#0066ff]' : 'border-gray-700 bg-[#121319] text-gray-400 hover:border-gray-500'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="category_id" className="text-xs font-semibold text-gray-300">Categoria</label>
            <select
              id="category_id"
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="block w-full px-4 py-2.5 border border-gray-700 rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-[#0066ff] sm:text-sm transition-all"
            >
              <option value="" disabled>Selecione uma categoria...</option>
              {(formData.type === 'Alimento' ? ['Pastel', 'Pizza', 'Doce', 'Outros'] : ['Refrigerante', 'Suco', 'Água', 'Outros']).map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
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
