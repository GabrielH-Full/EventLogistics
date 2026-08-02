import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminGuard } from '../../components/admin/AdminGuard';
import { DataTable, Column } from '../../components/admin/DataTable';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { StatusBadge } from '../../components/admin/StatusBadge';
import { SearchInput } from '../../components/admin/SearchInput';
import { FilterSelect } from '../../components/admin/FilterSelect';
import { useUsers, useUserMutations } from '../../hooks/useUsers';
import { useToast } from '../../components/admin/ToastContext';
import { Plus, Edit2, Trash2, PowerOff } from 'lucide-react';
import { ApiError } from '../../auth/AuthContext';

export function UsersPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { users, total, isLoading, error, fetchUsers } = useUsers({
    page: String(page),
    limit: '10',
    ...(search && { search }),
    ...(roleFilter && { role: roleFilter }),
    ...(statusFilter && { is_active: statusFilter }),
  });

  const { toggleStatus, deleteUser } = useUserMutations();

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'toggle' | 'delete' | null;
    user: any | null;
    isLoading: boolean;
  }>({ isOpen: false, type: null, user: null, isLoading: false });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async () => {
    if (!confirmModal.user) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await toggleStatus(confirmModal.user.id);
      showToast('Status atualizado com sucesso.', 'success');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message || 'Erro ao alterar status.', 'error');
    } finally {
      setConfirmModal({ isOpen: false, type: null, user: null, isLoading: false });
    }
  };

  const handleDelete = async () => {
    if (!confirmModal.user) return;
    setConfirmModal((prev) => ({ ...prev, isLoading: true }));
    try {
      await deleteUser(confirmModal.user.id);
      showToast('Usuário excluído com sucesso.', 'success');
      fetchUsers();
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 409) {
        showToast('Usuário possui vínculos. Considere inativá-lo.', 'error');
      } else {
        showToast(err.message || 'Erro ao excluir.', 'error');
      }
    } finally {
      setConfirmModal({ isOpen: false, type: null, user: null, isLoading: false });
    }
  };

  const columns: Column<any>[] = [
    { key: 'username', header: 'Usuário' },
    { key: 'display_name', header: 'Nome', render: (u) => u.display_name || '-' },
    { key: 'role', header: 'Cargo', render: (u) => (u.role === 'admin' ? 'Administrador' : 'Operador') },
    { key: 'stalls', header: 'Barracas', render: (u) => u.stalls?.map((s: any) => s.name).join(', ') || '-' },
    { key: 'is_active', header: 'Status', render: (u) => <StatusBadge isActive={u.is_active} /> },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">Gestão de Usuários</h1>
          <p className="text-sm text-gray-600 mt-1">Gerencie os acessos ao painel e PDV.</p>
        </div>
        <button
          onClick={() => navigate('/admin/users/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[#0066ff] text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-600 transition-all active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-[#191b24] p-4 rounded-2xl border border-gray-800">
        <div className="flex-1 min-w-[200px]">
          <SearchInput onChange={(val) => { setSearch(val); setPage(1); }} placeholder="Buscar usuário..." />
        </div>
        <FilterSelect
          label="Cargo"
          options={[
            { label: 'Todos', value: '' },
            { label: 'Administrador', value: 'admin' },
            { label: 'Operador', value: 'operator' },
          ]}
          value={roleFilter}
          onChange={(val) => { setRoleFilter(val); setPage(1); }}
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
        data={users}
        total={total}
        isLoading={isLoading}
        error={error}
        onRetry={fetchUsers}
        page={page}
        limit={10}
        onPageChange={setPage}
        actions={(row) => (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => navigate(`/admin/users/${row.id}/edit`)}
              className="p-2 text-gray-400 hover:text-[#0066ff] hover:bg-[#0066ff]/10 rounded-lg transition-colors cursor-pointer"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmModal({ isOpen: true, type: 'toggle', user: row, isLoading: false })}
              className="p-2 text-gray-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-lg transition-colors cursor-pointer"
              title={row.is_active ? 'Desativar' : 'Ativar'}
            >
              <PowerOff className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmModal({ isOpen: true, type: 'delete', user: row, isLoading: false })}
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
        title={confirmModal.type === 'delete' ? 'Excluir Usuário' : 'Alterar Status'}
        description={
          confirmModal.type === 'delete'
            ? `Tem certeza que deseja EXCLUIR permanentemente o usuário "${confirmModal.user?.username}"?`
            : `Deseja alterar o status do usuário "${confirmModal.user?.username}"?`
        }
        variant={confirmModal.type === 'delete' ? 'danger' : 'warning'}
        isLoading={confirmModal.isLoading}
        onConfirm={confirmModal.type === 'delete' ? handleDelete : handleToggleStatus}
        onCancel={() => setConfirmModal({ isOpen: false, type: null, user: null, isLoading: false })}
      />
    </div>
  );
}

export * from './UserFormPage';
