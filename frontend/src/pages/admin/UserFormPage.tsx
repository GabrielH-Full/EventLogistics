import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserMutations } from '../../hooks/useUsers';
import { useStalls } from '../../hooks/useStalls';
import { api } from '../../api/client';
import { useToast } from '../../components/admin/ToastContext';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

export function UserFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const { createUser, updateUser } = useUserMutations();

  // Buscar barracas p/ o multiselect
  const { stalls, fetchStalls } = useStalls();
  useEffect(() => { fetchStalls(); }, [fetchStalls]);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'operator',
    display_name: '',
    stall_ids: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(mode === 'edit');

  useEffect(() => {
    if (mode === 'edit' && id) {
      api.getUsers().then(res => {
        const user = res.data.find(u => u.id === Number(id));
        if (user) {
          setFormData({
            username: user.username,
            password: '',
            role: user.role,
            display_name: user.display_name || '',
            stall_ids: user.stalls?.map((s: any) => String(s.id)) || [],
          });
        }
      }).catch(() => showToast('Erro ao carregar usuário.', 'error'))
        .finally(() => setIsLoadingUser(false));
    }
  }, [mode, id, showToast]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username) newErrors.username = 'Obrigatório.';
    if (mode === 'create' && !formData.password) newErrors.password = 'Obrigatório.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = () => validate();

  const toggleStall = (stallId: string) => {
    setFormData(prev => ({
      ...prev,
      stall_ids: prev.stall_ids.includes(stallId)
        ? prev.stall_ids.filter(sid => sid !== stallId)
        : [...prev.stall_ids, stallId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: any = { ...formData };
      if (mode === 'edit' && !payload.password) {
        delete payload.password;
      }
      
      if (mode === 'create') {
        await createUser(payload);
        showToast('Usuário criado com sucesso!', 'success');
      } else {
        await updateUser(id!, payload);
        showToast('Usuário atualizado com sucesso!', 'success');
      }
      navigate('/admin/users');
    } catch (err: any) {
      if (err.status === 409) {
        setErrors({ username: 'Nome de usuário já existe.' });
      } else {
        showToast(err.message || 'Erro ao salvar.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser) {
    return <div className="p-8 text-gray-400">Carregando dados...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <button
        onClick={() => navigate('/admin/users')}
        className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {mode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
        </h1>
        <p className="text-sm text-gray-400 mt-1">Preencha os dados do acesso.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#191b24] p-6 rounded-2xl border border-gray-800 space-y-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1">
            <label htmlFor="username" className="text-xs font-semibold text-gray-300">Login (Username)</label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onBlur={handleBlur}
              onChange={e => { setFormData({...formData, username: e.target.value}); setErrors({...errors, username: ''}); }}
              aria-describedby={errors.username ? 'username-error' : undefined}
              className={`block w-full px-4 py-2.5 border rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 sm:text-sm transition-all ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-[#0066ff] focus:ring-[#0066ff]'}`}
            />
            {errors.username && <p id="username-error" className="text-xs text-red-500 font-medium">{errors.username}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-semibold text-gray-300">Senha {mode === 'edit' && <span className="text-gray-500 font-normal">(Deixe em branco para manter)</span>}</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onBlur={handleBlur}
              onChange={e => { setFormData({...formData, password: e.target.value}); setErrors({...errors, password: ''}); }}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={`block w-full px-4 py-2.5 border rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 sm:text-sm transition-all ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-[#0066ff] focus:ring-[#0066ff]'}`}
            />
            {errors.password && <p id="password-error" className="text-xs text-red-500 font-medium">{errors.password}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="display_name" className="text-xs font-semibold text-gray-300">Nome de Exibição (Opcional)</label>
            <input
              id="display_name"
              type="text"
              value={formData.display_name}
              onChange={e => setFormData({...formData, display_name: e.target.value})}
              className="block w-full px-4 py-2.5 border border-gray-700 rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-[#0066ff] sm:text-sm transition-all"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="role" className="text-xs font-semibold text-gray-300">Cargo</label>
            <select
              id="role"
              value={formData.role}
              onChange={e => setFormData({...formData, role: e.target.value, stall_ids: e.target.value === 'admin' ? [] : formData.stall_ids})}
              className="block w-full px-4 py-2.5 border border-gray-700 rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-[#0066ff] sm:text-sm transition-all cursor-pointer"
            >
              <option value="operator">Operador (Restrito)</option>
              <option value="admin">Administrador (Acesso Total)</option>
            </select>
          </div>
        </div>

        {formData.role === 'operator' && (
          <div className="space-y-2 pt-4 border-t border-gray-800">
            <label className="text-xs font-semibold text-gray-300">Barracas Vinculadas (Múltipla Seleção)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto p-1">
              {stalls.map((stall: any) => (
                <label key={stall.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${formData.stall_ids.includes(String(stall.id)) ? 'border-[#0066ff] bg-[#0066ff]/10' : 'border-gray-700 bg-[#121319] hover:bg-gray-800'}`}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#0066ff] rounded border-gray-600 bg-gray-800 focus:ring-[#0066ff] focus:ring-offset-gray-900"
                    checked={formData.stall_ids.includes(String(stall.id))}
                    onChange={() => toggleStall(String(stall.id))}
                  />
                  <span className="text-sm font-medium text-gray-200 truncate">{stall.name}</span>
                </label>
              ))}
              {stalls.length === 0 && (
                <div className="col-span-full text-sm text-gray-500">Nenhuma barraca cadastrada.</div>
              )}
            </div>
          </div>
        )}

        <div className="pt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-[#0066ff] text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSubmitting ? 'Salvando...' : 'Salvar Usuário'}
          </button>
        </div>
      </form>
    </div>
  );
}
