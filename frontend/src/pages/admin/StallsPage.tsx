import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminGuard } from '../../components/admin/AdminGuard';
import { DataTable, Column } from '../../components/admin/DataTable';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { SearchInput } from '../../components/admin/SearchInput';
import { FilterSelect } from '../../components/admin/FilterSelect';
import { useStalls, useStallMutations } from '../../hooks/useStalls';
import { useToast } from '../../components/admin/ToastContext';
import { Plus, Edit2, Trash2, PowerOff } from 'lucide-react';
import { ApiError } from '../../auth/AuthContext';

export function StallsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { stalls, total, isLoading, error, fetchStalls } = useStalls({
    page: String(page),
    limit: '10',
    ...(search && { search }),
    ...(statusFilter && { is_active: statusFilter }),
  });

  const { toggleStatus, deleteStall } = useStallMutations();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'toggle' | 'delete' | null;
    stall: any | null;
    isLoading: boolean;
  }>({ isOpen: false, type: null, stall: null, isLoading: false });

  useEffect(() => {
    fetchStalls();
  }, [fetchStalls]);

  const handleToggleStatus = async () => {
    if (!confirmModal.stall) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await toggleStatus(confirmModal.stall.id);
      showToast('Status atualizado com sucesso.', 'success');
      fetchStalls();
    } catch (err: any) {
      showToast(err.message || 'Erro ao alterar status.', 'error');
    } finally {
      setConfirmModal({ isOpen: false, type: null, stall: null, isLoading: false });
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.stall) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteStall(confirmModal.stall.id);
      showToast('Barraca excluída com sucesso.', 'success');
      fetchStalls();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        showToast('Barraca possui produtos vinculados. Considere inativá-la.', 'error');
      } else {
        showToast(err.message || 'Erro ao excluir.', 'error');
      }
    } finally {
      setConfirmModal({ isOpen: false, type: null, stall: null, isLoading: false });
    }
  };

  const columns: Column<any>[] = [
    { key: 'name', header: 'Nome da Barraca' },
    { key: 'type', header: 'Tipo' },
    { key: 'is_active', header: 'Status', render: (s) => <StatusBadge isActive={s.is_active} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">Gestão de Barracas</h1>
          <p className="text-sm text-gray-600 mt-1">Gerencie os pontos de venda e estoque.</p>
        </div>
        <button
          onClick={() => navigate('/admin/stalls/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#0066ff] text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Barraca</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-[#191b24] p-4 rounded-2xl border border-gray-800">
        <div className="flex-1 min-w-[200px]">
          <SearchInput onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Buscar barraca..." />
        </div>
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
        data={stalls}
        total={total}
        isLoading={isLoading}
        error={error}
        onRetry={fetchStalls}
        page={page}
        limit={10}
        onPageChange={setPage}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => navigate(`/admin/stalls/${row.id}/edit`)}
              className="p-2 text-gray-400 hover:text-[#0066ff] hover:bg-[#0066ff]/10 rounded-lg transition-colors cursor-pointer"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmModal({ isOpen: true, type: 'toggle', stall: row, isLoading: false })}
              className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors cursor-pointer"
              title={row.is_active ? 'Desativar' : 'Ativar'}
            >
              <PowerOff className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmModal({ isOpen: true, type: 'delete', stall: row, isLoading: false })}
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
        title={confirmModal.type === 'delete' ? 'Excluir Barraca' : 'Alterar Status'}
        description={
          confirmModal.type === 'delete'
            ? `Tem certeza que deseja EXCLUIR permanentemente a barraca "${confirmModal.stall?.name}"?`
            : `Deseja alterar o status da barraca "${confirmModal.stall?.name}"?`
        }
        variant={confirmModal.type === 'delete' ? 'danger' : 'warning'}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.type === 'delete' ? handleDelete : handleToggleStatus}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, stall: null, isLoading: false })}
      />
    </div>
  );
}

export * from './StallFormPage';
