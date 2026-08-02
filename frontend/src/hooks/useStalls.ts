import { useCallback } from 'react';
import { useAdminFetch } from './useAdminFetch';
import { api } from '../api/client';

export function useStalls(params?: Record<string, string>) {
  const { data, total, isLoading, error, fetchData } = useAdminFetch<any[]>();

  const paramsString = params ? JSON.stringify(params) : '';

  const fetchStalls = useCallback(() => {
    fetchData(async () => {
      const response = await api.getStalls(paramsString ? JSON.parse(paramsString) : undefined);
      return response;
    });
  }, [fetchData, paramsString]);

  return { stalls: data || [], total, isLoading, error, fetchStalls };
}

export function useStallMutations() {
  return {
    createStall: api.createStall,
    updateStall: api.updateStall,
    toggleStatus: api.toggleStallStatus,
    deleteStall: api.deleteStall,
  };
}
