import { useState, useCallback } from 'react';

interface FetchState<T> {
  data: T | null;
  total: number;
  isLoading: boolean;
  error: string | null;
}

export function useAdminFetch<T>() {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    total: 0,
    isLoading: false,
    error: null,
  });

  const fetchData = useCallback(async (fetchFn: () => Promise<{ data: T; total?: number }>) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await fetchFn();
      setState({
        data: result.data,
        total: result.total || 0,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Fetch error:', error);
      setState({
        data: null,
        total: 0,
        isLoading: false,
        error: error?.message || 'Erro ao carregar dados',
      });
    }
  }, []);

  return { ...state, fetchData };
}
