"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildInitialState = buildInitialState;
/**
 * @deprecated ATENÇÃO: Este arquivo (`seedData.ts`) serve APENAS para o setup inicial
 * de banco via Docker-compose (criação do admin master inicial e migrações básicas).
 * Para criar ou gerenciar produtos, barracas, usuários ou categorias na aplicação,
 * utilize a UI do Painel Administrativo, que garante integridade relacional,
 * formatações estritas de banco de dados e disparo do cache/WebSockets corretamente.
 */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Mesma base de dados que existia em src/data.ts no frontend, agora vivendo
// no backend, que é a fonte única de verdade.
const INITIAL_PRODUCTS = [
    { id: 'pastel_carne', name: 'Pastel de Carne', category: 'Salgados', price: 10.0, stock: 45, maxStock: 100, unit: '100g', stallId: 'pastel', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=400' },
    { id: 'pastel_queijo', name: 'Pastel de Queijo', category: 'Salgados', price: 10.0, stock: 12, maxStock: 100, unit: '100g', stallId: 'pastel', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=400' },
    { id: 'caldo_cana', name: 'Caldo de Cana', category: 'Bebidas', price: 8.0, stock: 0, maxStock: 50, unit: '300ml', stallId: 'pastel', image: 'https://images.unsplash.com/photo-1622597489100-8d3a5a9d0b1c?auto=format&fit=crop&q=80&w=400' },
    { id: 'espetinho_boi', name: 'Espetinho Boi', category: 'Salgados', price: 12.0, stock: 80, maxStock: 100, unit: 'unid', stallId: 'churrasco', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=400' },
    { id: 'pao_alho', name: 'Pão de Alho', category: 'Salgados', price: 7.0, stock: 15, maxStock: 100, unit: 'unid', stallId: 'churrasco', image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&q=80&w=400' },
    { id: 'cocada_cremosa', name: 'Cocada Cremosa', category: 'Doces', price: 6.0, stock: 40, maxStock: 100, unit: 'unid', stallId: 'doces', image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&q=80&w=400' },
    { id: 'brigadeiro_colher', name: 'Brigadeiro Gourmet', category: 'Doces', price: 5.0, stock: 75, maxStock: 100, unit: 'unid', stallId: 'doces', image: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&q=80&w=400' }
];
const INITIAL_STALLS = [
    { id: 'pastel', name: 'Barraca do Pastel', icon: 'bakery_dining' },
    { id: 'churrasco', name: 'Barraca do Churrasco', icon: 'outdoor_grill' },
    { id: 'doces', name: 'Barraca de Doces', icon: 'bakery_dining' }
];
const INITIAL_TICKETS = [
    {
        id: 't1', code: '#8492',
        items: [{ productId: 'pastel_carne', name: 'Pastel de Carne', category: 'Salgados', price: 10.0, quantity: 2 }],
        total: 20.0, time: 'Agora', timestamp: new Date(Date.now() - 1000).toISOString(), status: 'validated'
    },
    {
        id: 't2', code: '#8491',
        items: [{ productId: 'caldo_cana', name: 'Caldo de Cana', category: 'Bebidas', price: 8.0, quantity: 1 }],
        total: 8.0, time: '3 min atrás', timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(), status: 'validated'
    },
    {
        id: 't3', code: '#8490',
        items: [{ productId: 'pastel_queijo', name: 'Pastel de Queijo', category: 'Salgados', price: 10.0, quantity: 3 }],
        total: 30.0, time: '7 min atrás', timestamp: new Date(Date.now() - 7 * 60 * 1000).toISOString(), status: 'validated'
    },
    {
        id: 't4', code: '#8489',
        items: [{ productId: 'pastel_carne', name: 'Pastel de Carne', category: 'Salgados', price: 10.0, quantity: 1 }],
        total: 10.0, time: '12 min atrás', timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(), status: 'validated'
    },
    {
        id: 't5', code: '#8488',
        items: [{ productId: 'caldo_cana', name: 'Caldo de Cana', category: 'Bebidas', price: 8.0, quantity: 2 }],
        total: 16.0, time: '15 min atrás', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), status: 'pending'
    }
];
// Usuários de demonstração. TROQUE AS SENHAS antes de usar em produção.
// role: 'admin' -> acesso ao Caixa Central (venda de tickets + dashboard)
// role: 'stall' -> acesso restrito à própria barraca (produção + validação)
function buildInitialUsers() {
    const plainPasswords = {
        admin: 'admin123',
        pastel: 'pastel123',
        churrasco: 'churrasco123',
        doces: 'doces123'
    };
    return [
        {
            id: 'user_admin',
            username: 'admin',
            passwordHash: bcryptjs_1.default.hashSync(plainPasswords.admin, 10),
            role: 'admin',
            stallId: null,
            displayName: 'Caixa Central'
        },
        {
            id: 'user_pastel',
            username: 'pastel',
            passwordHash: bcryptjs_1.default.hashSync(plainPasswords.pastel, 10),
            role: 'stall',
            stallId: 'pastel',
            displayName: 'Barraca do Pastel'
        },
        {
            id: 'user_churrasco',
            username: 'churrasco',
            passwordHash: bcryptjs_1.default.hashSync(plainPasswords.churrasco, 10),
            role: 'stall',
            stallId: 'churrasco',
            displayName: 'Barraca do Churrasco'
        },
        {
            id: 'user_doces',
            username: 'doces',
            passwordHash: bcryptjs_1.default.hashSync(plainPasswords.doces, 10),
            role: 'stall',
            stallId: 'doces',
            displayName: 'Barraca de Doces'
        }
    ];
}
function buildInitialState() {
    return {
        products: INITIAL_PRODUCTS.map(p => ({ ...p })),
        stalls: INITIAL_STALLS.map(s => ({ ...s })),
        tickets: INITIAL_TICKETS.map(t => ({ ...t, items: t.items.map(i => ({ ...i })) })),
        users: buildInitialUsers()
    };
}
