import { useState, useMemo } from 'react';
import { Product } from '../types';
import { api } from '../api/client';

export function useStallValidationCart(products: Product[]) {
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIncrement = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setSelectedItems(prev => {
      const current = prev[productId] || 0;
      if (current >= product.stock) {
        // Can't select more than stock
        return prev;
      }
      return { ...prev, [productId]: current + 1 };
    });
  };

  const handleDecrement = (productId: string) => {
    setSelectedItems(prev => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const newState = { ...prev };
        delete newState[productId];
        return newState;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  const clearCart = () => {
    setSelectedItems({});
    setError(null);
  };

  const { totalSelectedCount, totalValue, isValidatable } = useMemo(() => {
    let count = 0;
    let value = 0;
    let valid = true;

    for (const [productId, qty] of Object.entries(selectedItems)) {
      const product = products.find(p => p.id === productId);
      if (!product) {
        valid = false;
        continue;
      }

      // If suddenly stock drops below selected quantity (via websocket update), it becomes invalid
      if (product.stock < qty) {
        valid = false;
      }

      count += qty;
      value += product.price * qty;
    }

    if (count === 0) valid = false;

    return { totalSelectedCount: count, totalValue: value, isValidatable: valid };
  }, [selectedItems, products]);

  const handleSubmitTicket = async () => {
    if (!isValidatable || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);

    // Timeout logic built-in to prevent hanging states if connection drops
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Tempo limite da requisição excedido (3s). Verifique sua conexão.')), 3000)
    );

    const itemsPayload = Object.entries(selectedItems).map(([productId, quantity]) => {
      const product = products.find(p => p.id === productId)!;
      return {
        productId,
        quantity,
        unitPrice: product.price
      };
    });

    try {
      await Promise.race([
        api.validateStallTicket(itemsPayload),
        timeoutPromise
      ]);
      
      // Success: clear cart
      clearCart();
    } catch (err: any) {
      setError(err.message || 'Erro ao validar ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevertTicket = async (ticketId: string) => {
    try {
      await api.revertTicket(ticketId);
    } catch (err: any) {
      alert(err.message || 'Erro ao reverter ticket');
    }
  };

  return {
    selectedItems,
    isSubmitting,
    error,
    totalSelectedCount,
    totalValue,
    isValidatable,
    handleIncrement,
    handleDecrement,
    clearCart,
    handleSubmitTicket,
    handleRevertTicket
  };
}
