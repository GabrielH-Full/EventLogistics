# Template Arquitetural — EventLogistics (Backend & Frontend)

> Este template define a estrutura padronizada para especificação, design e refatoração de novos módulos ou funcionalidades no projeto **EventLogistics** (React 19 + Vite + Node/Express + Socket.io + TypeScript).

---

## 1. Visão Geral do Módulo / Funcionalidade

- **Nome do Módulo / Feature:** `[ex: Gestão de Combos / Descontos por Categoria]`
- **Bounded Context (DDD):** `[ex: Vendas / Estoque / Autenticação]`
- **Papéis Impactados:**
  - [ ] `admin` (Caixa Central — acesso global)
  - [ ] `stall` (Barraca — restrito ao `stallId` do usuário)
- **Objetivo da Mudança:** `[Descrição clara do problema de negócio e do comportamento esperado]`

---

## 2. Design do Domínio e Regras de Negócio (Backend Core)

### 2.1 Modelo de Dados / Tipos TypeScript

Defina os tipos principais que residirão em `backend/src/types/` e serão refletidos em `frontend/src/types.ts`:

```typescript
// Exemplo de interface de entidade do domínio
export interface NovaEntidade {
  id: string;
  stallId?: string;
  createdAt: string;
  // Adicione os campos necessários
}
```

### 2.2 Regras de Negócio e Invariantes Absolutas

1. **Fonte Única de Verdade:** Toda a validação de regra de negócio ocorre no backend antes de alterar o estado em memória.
2. **Validação de Concorrência e Estoque:** Em caso de indisponibilidade ou conflito, responder com código de status HTTP `409 Conflict`.
3. **Isolamento de Papel (Role Scoping):** Usuários com papel `stall` só podem interagir com recursos pertencentes ao seu `stallId`.
4. **Persistência Durável:** Toda rota mutável deve obrigatoriamente chamar `save()` para atualizar o `data.json`.
5. **Notificação em Tempo Real:** Toda rota mutável deve obrigatoriamente chamar `broadcastState()` no WebSocket.

---

## 3. Arquitetura Hexagonal (Ports & Adapters)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ADAPTADORES DE ENTRADA                          │
│   HTTP REST (Express Routes)        │       WebSocket (Socket.io)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          CASOS DE USO / CORE                           │
│   Serviços de Domínio / Validações / Modificações de Estado (`db.ts`)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ADAPTADORES DE SAÍDA                            │
│   Persistência (`db.ts` -> `data.json`) │ WebSocket Broadcast (`socket.ts`)│
└────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Portas de Entrada (HTTP REST Endpoints)

| Método | Endpoint | Autenticação / Permissão | Payload / Params | Status de Sucesso | Erros Previstos |
|---|---|---|---|---|---|
| `GET` | `/api/...` | `requireAuth` | N/A | `200 OK` | `401 Unauthorized` |
| `POST` | `/api/...` | `requireAuth`, `requireRole('admin')` | `{ ... }` | `201 Created` | `400 Bad Request`, `409 Conflict` |

### 3.2 Persistência e WebSocket (Outbound Adapters)

- **Fluxo no Backend:**
  1. Alteração no objeto `state` em memória (`backend/src/db.ts`).
  2. Invocação de `save()` para persistência em disco.
  3. Invocação de `broadcastState()` enviando `publicState()` a todos os clientes conectados.

---

## 4. Adaptação no Frontend (React 19)

### 4.1 Camada de Comunicação (`frontend/src/api/client.ts`)

Adicione o método no cliente HTTP encapsulando `fetch` e capturando erros com `ApiError`:

```typescript
export async function novoMetodoApi(payload: NovoPayload): Promise<Resultado> {
  return request<Resultado>('/api/caminho', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
```

### 4.2 Sincronização em Tempo Real (`frontend/src/api/useAppData.ts`)

Garantir que a nova propriedade no estado seja propagada automaticamente via evento `state:update`:

```typescript
// useAppData reage automaticamente ao broadcastState do backend
```

### 4.3 Componentes e Visões UI

- **ADM (`frontend/src/admin/AdminApp.tsx`):** Gestão global e relatórios.
- **Barraca (`frontend/src/stall/StallApp.tsx`):** Operação simplificada filtrada por `user.stallId`.

---

## 5. Checklist de Conformidade Arquitetural

- [ ] **Sem duplicação de regras:** O frontend não valida estoque nem permissões de forma isolada; ele apenas exibe erros retornados pela API.
- [ ] **Segurança Middleware:** As rotas usam `requireAuth` e `requireRole('admin' | 'stall')`.
- [ ] **Consistência de dados:** O token JWT transporta o `stallId` e `role`.
- [ ] **Broadcasting:** Todas as mutações chamam `broadcastState()` no `socket.ts`.
- [ ] **Persistência:** Todas as mutações chamam `save()` no `db.ts`.
- [ ] **Sem mutação silenciosa:** Respostas de erro HTTP contêm mensagens claras e legíveis para exibição na UI.
