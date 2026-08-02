import { useCallback } from 'react';
import { useAdminFetch } from './useAdminFetch';
import { api } from '../api/client';

export function useProducts(params?: Record<string, string>) {
  const { data, total, isLoading, error, fetchData } = useAdminFetch<any[]>();

  const paramsString = params ? JSON.stringify(params) : '';

  const fetchProducts = useCallback(() => {
    fetchData(async () => {
      const response = await api.getProducts(paramsString ? JSON.parse(paramsString) : undefined);
      return response;
    });
  }, [fetchData, paramsString]);

  return { products: data || [], total, isLoading, error, fetchProducts };
}

export function useProductMutations() {
  return {
    createProduct: api.createProduct,
    updateProduct: api.updateProduct,
    toggleStatus: api.toggleProductStatus,
    deleteProduct: api.deleteProduct,
  };
}
