import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable, Column } from '../../components/admin/DataTable';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { SearchInput } from '../../components/admin/SearchInput';
import { FilterSelect } from '../../components/admin/FilterSelect';
import { CategoryDrawer } from '../../components/admin/CategoryDrawer';
import { useProducts, useProductMutations } from '../../hooks/useProducts';
import { useStalls } from '../../hooks/useStalls';
import { useToast } from '../../components/admin/ToastContext';
import { Plus, Edit2, Trash2, PowerOff, Tag, UtensilsCrossed, GlassWater } from 'lucide-react';
import { ApiError } from '../../auth/AuthContext';

export function ProductsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stallFilter, setStallFilter] = useState('');
  const [parentTypeFilter, setParentTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);

  const { stalls, fetchStalls } = useStalls();
  useEffect(() => { fetchStalls(); }, [fetchStalls]);

  const { products, total, isLoading, error, fetchProducts } = useProducts({
    page: String(page),
    limit: '10',
    ...(search && { search }),
    ...(statusFilter && { is_active: statusFilter }),
    ...(stallFilter && { stall_id: stallFilter }),
    ...(parentTypeFilter && { parent_type: parentTypeFilter }),
  });

  const { toggleStatus, deleteProduct } = useProductMutations();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'toggle' | 'delete' | null;
    product: any | null;
    isLoading: boolean;
  }>({ isOpen: false, type: null, product: null, isLoading: false });

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const formatBRL = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const handleToggleStatus = async () => {
    if (!confirmModal.product) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await toggleStatus(confirmModal.product.id);
      showToast('Status atualizado com sucesso.', 'success');
      fetchProducts();
    } catch (err: any) {
      showToast(err.message || 'Erro ao alterar status.', 'error');
    } finally {
      setConfirmModal({ isOpen: false, type: null, product: null, isLoading: false });
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.product) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteProduct(confirmModal.product.id);
      showToast('Produto excluído com sucesso.', 'success');
      fetchProducts();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        showToast('Produto possui ingressos/pedidos já emitidos. Considere inativá-lo.', 'error');
      } else {
        showToast(err.message || 'Erro ao excluir.', 'error');
      }
    } finally {
      setConfirmModal({ isOpen: false, type: null, product: null, isLoading: false });
    }
  };

  const columns: Column<any>[] = [
    { key: 'name', header: 'Produto' },
    { key: 'parent_type', header: 'Tipo', render: (p) => p.parent_type === 'food' ? 'Alimento' : 'Bebida' },
    { key: 'category_name', header: 'Categoria', render: (p) => p.category_name || '-' },
    { key: 'stall_name', header: 'Barraca', render: (p) => p.stall_name || '-' },
    { key: 'price', header: 'Preço', render: (p) => <span className="font-bold text-white">{formatBRL(p.price)}</span> },
    { key: 'is_active', header: 'Status', render: (p) => <StatusBadge isActive={p.is_active} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">Gestão de Produtos</h1>
          <p className="text-sm text-gray-600 mt-1">Gerencie os itens do menu e categorias do evento.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCategoryDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#191b24] border border-gray-700 text-gray-300 rounded-xl text-sm font-bold shadow-sm hover:text-white hover:border-gray-500 transition-all active:scale-95 cursor-pointer"
          >
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Categorias</span>
          </button>
          <button
            onClick={() => navigate('/admin/products/new')}
            className="flex items-center gap-2 px-4 py-2 bg-[#0066ff] text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-[#191b24] p-4 rounded-2xl border border-gray-800">
        <div className="flex-1 min-w-[200px]">
          <SearchInput onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Buscar produto..." />
        </div>
        <FilterSelect
          label="Barraca"
          options={[
            { label: 'Todas as barracas', value: '' },
            ...stalls.map((s: any) => ({ label: s.name, value: String(s.id) }))
          ]}
          value={stallFilter}
          onChange={(val) => { setStallFilter(val); setPage(1); }}
        />
        <FilterSelect
          label="Tipo"
          options={[
            { label: 'Todos', value: '' },
            { label: 'Alimentos', value: 'food' },
            { label: 'Bebidas', value: 'drink' },
          ]}
          value={parentTypeFilter}
          onChange={(val) => { setParentTypeFilter(val); setPage(1); }}
        />
        <FilterSelect
          label="Status"
          options={[
            { label: 'Todos', value: '' },
            { label: 'Ativos', value: 'true' },
            { label: 'Inativos', value: 'false' },
          ]}
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1); }}
        />
      </div>

      <DataTable
        columns={columns}
        data={products}
        total={total}
        isLoading={isLoading}
        error={error}
        onRetry={fetchProducts}
        page={page}
        limit={10}
        onPageChange={setPage}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => navigate(`/admin/products/${row.id}/edit`)}
              className="p-2 text-gray-400 hover:text-[#0066ff] hover:bg-[#0066ff]/10 rounded-lg transition-colors cursor-pointer"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmModal({ isOpen: true, type: 'toggle', product: row, isLoading: false })}
              className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors cursor-pointer"
              title={row.is_active ? 'Desativar' : 'Ativar'}
            >
              <PowerOff className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmModal({ isOpen: true, type: 'delete', product: row, isLoading: false })}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.type === 'delete' ? 'Excluir Produto' : 'Alterar Status'}
        description={
          confirmModal.type === 'delete'
            ? `Tem certeza que deseja EXCLUIR permanentemente o produto "${confirmModal.product?.name}"?`
            : `Deseja alterar o status do produto "${confirmModal.product?.name}"?`
        }
        variant={confirmModal.type === 'delete' ? 'danger' : 'warning'}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.type === 'delete' ? handleDelete : handleToggleStatus}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, product: null, isLoading: false })}
      />

      <CategoryDrawer
        isOpen={isCategoryDrawerOpen}
        onClose={() => setIsCategoryDrawerOpen(false)}
      />
    </div>
  );
}

export * from './ProductFormPage';
