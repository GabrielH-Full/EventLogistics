import { useCallback } from 'react';
import { useAdminFetch } from './useAdminFetch';
import { api } from '../api/client';

export function useUsers(params?: Record<string, string>) {
  const { data, total, isLoading, error, fetchData } = useAdminFetch<any[]>();

  const paramsString = params ? JSON.stringify(params) : '';

  const fetchUsers = useCallback(() => {
    fetchData(async () => {
      const response = await api.getUsers(paramsString ? JSON.parse(paramsString) : undefined);
      return response;
    });
  }, [fetchData, paramsString]);

  return { users: data || [], total, isLoading, error, fetchUsers };
}

export function useUserMutations() {
  return {
    createUser: api.createUser,
    updateUser: api.updateUser,
    toggleStatus: api.toggleUserStatus,
    deleteUser: api.deleteUser,
  };
}
