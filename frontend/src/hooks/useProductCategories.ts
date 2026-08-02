import { useCallback } from 'react';
import { useAdminFetch } from './useAdminFetch';
import { api } from '../api/client';

export function useProductCategories(params?: Record<string, string>) {
  const { data, isLoading, error, fetchData } = useAdminFetch<any[]>();

  const paramsString = params ? JSON.stringify(params) : '';

  const fetchCategories = useCallback(() => {
    fetchData(async () => {
      const response = await api.getProductCategories(paramsString ? JSON.parse(paramsString) : undefined);
      return { data: response.data, total: response.data.length };
    });
  }, [fetchData, paramsString]);

  return { categories: data || [], isLoading, error, fetchCategories };
}

export function useProductCategoryMutations() {
  return {
    createCategory: api.createProductCategory,
    deleteCategory: api.deleteProductCategory,
  };
}
