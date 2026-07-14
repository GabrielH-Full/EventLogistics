import React, { useState } from 'react';
import { Product, TicketItem } from '../types';
import { 
  Search, 
  ShoppingCart, 
  AlertTriangle, 
  Printer, 
  User, 
  Ban, 
  Store, 
  Check, 
  Trash2,
  Plus,
  Minus
} from 'lucide-react';

interface CustomerTicketViewProps {
  products: Product[];
  cart: { [productId: string]: number };
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: string) => void;
  onUpdateCartQuantity: (productId: string, quantity: number) => void;
  onCheckout: () => void;
  checkoutStatus: 'idle' | 'processing' | 'success';
}

export default function CustomerTicketView({
  products,
  cart,
  onAddToCart,
  onRemoveFromCart,
  onUpdateCartQuantity,
  onCheckout,
  checkoutStatus
}: CustomerTicketViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'Todos' | 'Salgados' | 'Doces' | 'Bebidas'>('Todos');

  // Filter products by search query and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate cart items & totals
  const cartItems = Object.entries(cart)
    .map(([id, quantity]) => {
      const product = products.find(p => p.id === id);
      return product ? { product, quantity } : null;
    })
    .filter((item): item is { product: Product; quantity: number } => item !== null);

  const totalAmount = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);


  return (
    <div className="flex flex-col min-h-screen pb-48">
      {/* Top App Bar */}
      <header className="bg-white shadow-sm sticky top-0 z-40 flex justify-between items-center w-full px-4 h-16 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="bg-[#0050cb] p-2 rounded-lg text-white">
            <Store className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-black text-[#0050cb] tracking-tight">EventLogistics</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#0050cb] bg-blue-50 px-3 py-1 rounded-full">
            Novo Ticket
          </span>
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
            <User className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </header>

        {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        {/* Search & Filter Section */}
        <section className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos ou ler código..."
              className="w-full h-14 pl-12 pr-4 bg-[#f2f3ff] border-none rounded-xl focus:ring-2 focus:ring-[#0050cb] text-base outline-none transition-all shadow-sm"
              id="product-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-medium"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['Todos', 'Salgados', 'Doces', 'Bebidas'] as const).map((category) => (
              <button
                key={category}
                id={`cat-btn-${category}`}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-2 rounded-full text-sm font-semibold whitespace-nowrap active:scale-95 transition-all duration-200 ${
                  activeCategory === category
                    ? 'bg-[#0050cb] text-white shadow-md'
                    : 'bg-[#ecedfa] text-[#424656] hover:bg-[#e1e2ee]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Product Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="customer-product-grid">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= 15;
            const currentCartQty = cart[product.id] || 0;

            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                className={`group flex flex-col text-left bg-white p-4 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 transition-all ${
                  isOutOfStock
                    ? 'grayscale opacity-75 relative cursor-not-allowed'
                    : 'hover:border-[#0050cb] hover:shadow-[0_4px_25px_rgba(0,102,255,0.08)]'
                }`}
              >
                {/* Product Image */}
                <div className="w-full h-40 rounded-xl mb-4 bg-gray-50 overflow-hidden relative">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      !isOutOfStock && 'group-hover:scale-105'
                    }`}
                  />
                  
                  {/* Warning Overlay for Low Stock */}
                  {isLowStock && !isOutOfStock && (
                    <div className="absolute top-2 right-2 bg-[#a06500] text-[#fff7f1] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-300" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Baixo</span>
                    </div>
                  )}

                  {/* Out of Stock Overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                      <span className="bg-[#191b24] text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest rotate-[-6deg] shadow-lg border border-red-500/25">
                        ESGOTADO
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Metadata */}
                <div className="flex justify-between items-start mb-1 gap-2">
                  <h3 className="font-bold text-lg text-[#191b24] leading-tight">{product.name}</h3>
                  {isOutOfStock ? (
                    <span className="bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      Esgotado
                    </span>
                  ) : isLowStock ? (
                    <span className="bg-[#ffddb8] text-[#2a1700] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      Baixo Estoque
                    </span>
                  ) : (
                    <span className="bg-[#6bff8f]/30 text-[#007432] px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                      Disponível
                    </span>
                  )}
                </div>

                {/* Price */}
                <p className="text-xl font-extrabold text-[#0050cb] mb-4">
                  R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>

                {/* Footer of Card with Quantity & Add Button */}
                <div className="mt-auto flex items-center justify-between w-full pt-1">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Quantidade</span>
                    <span className={`text-sm font-bold ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-600' : 'text-gray-600'}`}>
                      {product.stock} {product.stock === 1 ? 'unidade' : 'unidades'}
                    </span>
                  </div>

                  {isOutOfStock ? (
                    <div className="bg-gray-100 p-2.5 rounded-xl text-gray-400 cursor-not-allowed">
                      <Ban className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {currentCartQty > 0 && (
                        <div className="flex items-center bg-gray-100 rounded-xl px-1.5 py-1 gap-2 border border-gray-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateCartQuantity(product.id, currentCartQty - 1);
                            }}
                            className="p-1 hover:bg-white rounded-lg text-[#424656] transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-extrabold text-[#191b24] min-w-[12px] text-center">
                            {currentCartQty}
                          </span>
                          <button
                            disabled={currentCartQty >= product.stock}
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateCartQuantity(product.id, currentCartQty + 1);
                            }}
                            className="p-1 hover:bg-white rounded-lg text-[#424656] transition-colors disabled:opacity-30"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(product);
                        }}
                        disabled={currentCartQty >= product.stock}
                        className={`p-3 rounded-xl transition-all active:scale-90 ${
                          currentCartQty > 0
                            ? 'bg-[#007432] hover:bg-[#005321] text-white'
                            : 'bg-[#0066ff] hover:bg-[#0050cb] text-white shadow-md shadow-blue-500/10'
                        } disabled:opacity-40`}
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* Cart Summary & Checkout Persistent Bottom Drawer */}
      <footer className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.08)] border-t border-gray-100 p-4">
        <div className="max-w-5xl mx-auto">
          {/* Cart Items List Preview */}
          {cartItems.length > 0 ? (
            <div className="mb-4 max-h-32 overflow-y-auto space-y-2 pr-1">
              {cartItems.map(({ product, quantity }) => (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between bg-[#f2f3ff] px-4 py-2.5 rounded-xl border border-blue-100/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#0066ff] flex items-center justify-center text-white font-extrabold text-xs">
                      {quantity}x
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#191b24]">{product.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-extrabold">
                        {product.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-sm text-[#0050cb]">
                      R$ {(product.price * quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <button 
                      onClick={() => onRemoveFromCart(product.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-4 py-3 bg-[#faf8ff] rounded-xl border border-dashed border-gray-200">
              <ShoppingCart className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-400 font-medium">Nenhum pastel ou bebida adicionada ao carrinho</p>
            </div>
          )}

          {/* Totals & Checkout Trigger Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="text-center sm:text-left">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Total do Pedido</p>
              <p className="font-black text-2xl text-[#191b24] tracking-tight">
                R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            
            <button
              onClick={onCheckout}
              disabled={cartItems.length === 0 || checkoutStatus === 'processing'}
              className={`w-full sm:w-auto px-8 h-14 rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg ${
                checkoutStatus === 'processing'
                  ? 'bg-amber-500 text-white cursor-wait shadow-amber-500/10'
                  : checkoutStatus === 'success'
                  ? 'bg-[#006e2f] text-white shadow-green-500/10'
                  : 'bg-[#0066ff] hover:bg-[#0050cb] text-white shadow-[#0066ff]/20 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed'
              }`}
            >
              {checkoutStatus === 'processing' ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Processando...</span>
                </>
              ) : checkoutStatus === 'success' ? (
                <>
                  <Check className="w-5 h-5 text-white" />
                  <span>Ticket Impresso com Sucesso!</span>
                </>
              ) : (
                <>
                  <Printer className="w-5 h-5" />
                  <span>Finalizar e Imprimir Ticket</span>
                </>
              )}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
