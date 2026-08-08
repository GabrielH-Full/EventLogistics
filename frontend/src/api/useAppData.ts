import { useEffect, useState, useCallback } from 'react';
import { Product, Stall, Ticket } from '../types';
import { api } from './client';
import { getSocket } from './socket';
import { useAuth } from '../auth/AuthContext';

interface AppDataState {
  products: Product[];
  stalls: Stall[];
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
}

// Fonte única de dados no frontend: carrega o snapshot inicial via REST e
// depois só reage a eventos 'state:update' do WebSocket. Caixa Central e
// todas as barracas usam esse mesmo hook, então tudo fica sincronizado
// automaticamente, sem precisar dar refresh.
export function useAppData() {
  const { user } = useAuth();
  
  const [state, setState] = useState<AppDataState>({
    products: [],
    stalls: [],
    tickets: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    let cancelled = false;

    api.getState()
      .then(data => {
        if (cancelled) return;
        setState({
          products: data.products,
          stalls: data.stalls,
          tickets: data.tickets,
          loading: false,
          error: null
        });
      })
      .catch(err => {
        if (cancelled) return;
        setState(prev => ({ ...prev, loading: false, error: err.message }));
      });

    const socket = getSocket(user?.stallId || undefined);
    const onUpdate = (data: { products: Product[]; stalls: Stall[]; tickets: Ticket[] }) => {
      setState(prev => ({ ...prev, products: data.products, stalls: data.stalls, tickets: data.tickets, loading: false }));
    };
    socket.on('state:update', onUpdate);

    return () => {
      cancelled = true;
      socket.off('state:update', onUpdate);
    };
  }, []);

  const refresh = useCallback(() => {
    api.getState().then(data => {
      setState(prev => ({ ...prev, products: data.products, stalls: data.stalls, tickets: data.tickets }));
    });
  }, []);

  return { ...state, refresh };
}
