import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Tag, Loader2 } from 'lucide-react';
import { useProductCategories, useProductCategoryMutations } from '../../hooks/useProductCategories';
import { useToast } from './ToastContext';
import { ConfirmModal } from './ConfirmModal';

interface CategoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryDrawer({ isOpen, onClose }: CategoryDrawerProps) {
  const { categories, isLoading, fetchCategories } = useProductCategories();
  const { createCategory, deleteCategory } = useProductCategoryMutations();
  const { showToast } = useToast();

  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('food');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, fetchCategories]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsSubmitting(true);
    try {
      await createCategory({ name: newCatName.trim(), parent_type: newCatType });
      showToast('Categoria adicionada!', 'success');
      setNewCatName('');
      fetchCategories();
    } catch (err: any) {
      showToast(err.message || 'Erro ao adicionar categoria', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteCategory(confirmDeleteId);
      showToast('Categoria removida!', 'success');
      fetchCategories();
    } catch (err: any) {
      if (err.status === 409) {
        showToast('Não é possível remover: existem produtos usando esta categoria.', 'error');
      } else {
        showToast(err.message || 'Erro ao remover categoria', 'error');
      }
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-[#191b24] shadow-2xl border-l border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <Tag className="w-5 h-5 text-[#0066ff]" />
            <h2 className="text-xl font-bold text-white tracking-tight">Gerenciar Categorias</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 border-b border-gray-800 bg-[#121319]">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Adicionar Nova</h3>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value)}
                className="w-1/3 px-3 py-2 border border-gray-700 rounded-xl bg-[#191b24] text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-[#0066ff] text-sm cursor-pointer"
              >
                <option value="food">Alimento</option>
                <option value="drink">Bebida</option>
              </select>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ex: Espetos"
                className="flex-1 px-3 py-2 border border-gray-700 rounded-xl bg-[#191b24] text-white focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-[#0066ff] text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !newCatName.trim()}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-[#0066ff] text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar Categoria
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Categorias Cadastradas</h3>
          
          {isLoading ? (
            <div className="flex justify-center p-8 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center p-8 text-gray-500 text-sm">
              Nenhuma subcategoria cadastrada.
            </div>
          ) : (
            <ul className="space-y-2">
              {categories.map((cat: any) => (
                <li
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-800 bg-[#121319] hover:border-gray-700 transition-colors"
                >
                  <div>
                    <p className="text-sm font-bold text-white">{cat.name}</p>
                    <p className="text-xs text-gray-400">{cat.parent_type === 'food' ? 'Alimento' : 'Bebida'}</p>
                  </div>
                  <button
                    onClick={() => setConfirmDeleteId(cat.id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmDeleteId !== null}
        title="Remover Categoria"
        description="Tem certeza que deseja apagar essa categoria? Ela não poderá ser removida se houver produtos atrelados a ela."
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </>
  );
}
