import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductMutations } from '../../hooks/useProducts';
import { useProductCategories } from '../../hooks/useProductCategories';
import { useStalls } from '../../hooks/useStalls';
import { api } from '../../api/client';
import { useToast } from '../../components/admin/ToastContext';
import { ArrowLeft, Save, Loader2, UtensilsCrossed, GlassWater } from 'lucide-react';

export function ProductFormPage({ mode }: { mode: 'create' | 'edit' }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const { createProduct, updateProduct } = useProductMutations();

  const { stalls, fetchStalls } = useStalls();
  useEffect(() => { fetchStalls(); }, [fetchStalls]);
  const activeStalls = stalls.filter((s: any) => s.is_active);

  const { categories, fetchCategories } = useProductCategories();
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const [formData, setFormData] = useState({
    name: '',
    parent_type: 'food' as 'food' | 'drink',
    category_id: '',
    stall_id: '',
    price: '',
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(mode === 'edit');

  const filteredCategories = categories.filter((c: any) => c.parent_type === formData.parent_type);

  useEffect(() => {
    if (mode === 'edit' && id) {
      api.getProducts().then(res => {
        const product = res.data.find(p => p.id === Number(id) || p.id === String(id));
        if (product) {
          setFormData({
            name: product.name,
            parent_type: product.parent_type,
            category_id: product.category_id ? String(product.category_id) : '',
            stall_id: product.stall_id ? String(product.stall_id) : '',
            price: product.price.toString(),
            is_active: product.is_active,
          });
        }
      }).catch(() => showToast('Erro ao carregar produto.', 'error'))
        .finally(() => setIsLoadingProduct(false));
    }
  }, [mode, id, showToast]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Obrigatório.';
    if (!formData.stall_id) newErrors.stall_id = 'Selecione uma barraca.';
    if (!formData.category_id) newErrors.category_id = 'Selecione uma categoria.';

    const numPrice = parseFloat(formData.price.replace(',', '.'));
    if (!formData.price || isNaN(numPrice)) {
      newErrors.price = 'Preço inválido.';
    } else if (numPrice <= 0) {
      newErrors.price = 'O preço deve ser maior que zero.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = () => validate();

  const handlePriceChange = (val: string) => {
    // Permite apenas números, ponto e vírgula
    const cleaned = val.replace(/[^0-9.,]/g, '');
    setFormData(prev => ({ ...prev, price: cleaned }));
    setErrors(prev => ({ ...prev, price: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        parent_type: formData.parent_type,
        category_id: Number(formData.category_id),
        stall_id: formData.stall_id,
        price: parseFloat(formData.price.replace(',', '.')),
        is_active: formData.is_active,
      };

      if (mode === 'create') {
        await createProduct(payload);
        showToast('Produto criado com sucesso!', 'success');
      } else {
        await updateProduct(id!, payload);
        showToast('Produto atualizado com sucesso!', 'success');
      }
      navigate('/admin/products');
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar produto.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingProduct) {
    return <div className="p-8 text-gray-400">Carregando dados...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      <button
        onClick={() => navigate('/admin/products')}
        className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div>
        <h1 className="text-2xl font-black text-black tracking-tight">
          {mode === 'create' ? 'Novo Produto' : 'Editar Produto'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">Cadastre o item de cardápio e vincule-o a uma barraca.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#191b24] p-6 rounded-2xl border border-gray-800 space-y-5 shadow-sm">

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="product_name" className="text-xs font-semibold text-gray-300">Nome do Produto</label>
            <input
              id="product_name"
              type="text"
              value={formData.name}
              onBlur={handleBlur}
              onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
              placeholder="Ex: Hambúrguer Artesanal"
              aria-describedby={errors.name ? 'product-name-error' : undefined}
              className={`block w-full px-4 py-2.5 border rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 sm:text-sm transition-all ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-[#0066ff] focus:ring-[#0066ff]'}`}
            />
            {errors.name && <p id="product-name-error" className="text-xs text-red-500 font-medium">{errors.name}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Tipo Principal</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, parent_type: 'food', category_id: '' })}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${formData.parent_type === 'food'
                  ? 'border-[#0066ff] bg-[#0066ff]/10 text-[#0066ff]'
                  : 'border-gray-700 bg-[#121319] text-gray-400 hover:bg-gray-800'
                  }`}
              >
                <UtensilsCrossed className="w-4 h-4" /> Alimento
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, parent_type: 'drink', category_id: '' })}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all ${formData.parent_type === 'drink'
                  ? 'border-[#0066ff] bg-[#0066ff]/10 text-[#0066ff]'
                  : 'border-gray-700 bg-[#121319] text-gray-400 hover:bg-gray-800'
                  }`}
              >
                <GlassWater className="w-4 h-4" /> Bebida
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="category_id" className="text-xs font-semibold text-gray-300">Subcategoria</label>
            <select
              id="category_id"
              value={formData.category_id}
              onBlur={handleBlur}
              onChange={e => { setFormData({ ...formData, category_id: e.target.value }); setErrors({ ...errors, category_id: '' }); }}
              aria-describedby={errors.category_id ? 'category-error' : undefined}
              className={`block w-full px-4 py-2.5 border rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 sm:text-sm transition-all cursor-pointer ${errors.category_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-[#0066ff] focus:ring-[#0066ff]'}`}
            >
              <option value="">Selecione...</option>
              {filteredCategories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id ? (
              <p id="category-error" className="text-xs text-red-500 font-medium">{errors.category_id}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Crie subcategorias no painel "Categorias".</p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="stall_id" className="text-xs font-semibold text-gray-300">Barraca Responsável</label>
            <select
              id="stall_id"
              value={formData.stall_id}
              onBlur={handleBlur}
              onChange={e => { setFormData({ ...formData, stall_id: e.target.value }); setErrors({ ...errors, stall_id: '' }); }}
              aria-describedby={errors.stall_id ? 'stall-error' : undefined}
              className={`block w-full px-4 py-2.5 border rounded-xl bg-[#121319] text-white focus:outline-none focus:ring-2 sm:text-sm transition-all cursor-pointer ${errors.stall_id ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-[#0066ff] focus:ring-[#0066ff]'}`}
            >
              <option value="">Selecione...</option>
              {activeStalls.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.stall_id && <p id="stall-error" className="text-xs text-red-500 font-medium">{errors.stall_id}</p>}
          </div>

          <div className="space-y-1">
            <label htmlFor="price" className="text-xs font-semibold text-gray-300">Preço (R$)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 font-medium text-sm">
                R$
              </span>
              <input
                id="price"
                type="text"
                value={formData.price}
                onBlur={handleBlur}
                onChange={e => handlePriceChange(e.target.value)}
                placeholder="0,00"
                aria-describedby="price-error"
                className={`block w-full pl-9 pr-4 py-2.5 border rounded-xl bg-[#121319] text-white font-mono focus:outline-none focus:ring-2 sm:text-sm transition-all ${errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-[#0066ff] focus:ring-[#0066ff]'}`}
              />
            </div>
            {errors.price && <span id="price-error" className="text-xs text-red-500 font-medium">{errors.price}</span>}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-800 flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 text-[#0066ff] rounded border-gray-600 bg-gray-800 focus:ring-[#0066ff]"
            />
            <span className="text-sm font-semibold text-gray-200">Produto Ativo (Disponível p/ venda)</span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-[#0066ff] text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
}
