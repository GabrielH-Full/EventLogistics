# PRD Frontend: Validação de Tickets

## Visão Geral
Este documento traduz os requisitos lógicos do sistema de Validação de Tickets (definidos no `prd.md`) para uma especificação técnica de interface de usuário e componentes front-end, tendo como base o layout projetado no Figma (node-id: 31-1148).

## 1. Arquitetura da Interface (Layout Principal)
A tela "Operação da Barraca" é dividida em 4 seções principais:
1. **Header (Navegação Superior)**: Identidade visual da "EventLogistics" e link/status para "Inventory".
2. **Dashboard de Resumo (Topo)**: Métricas rápidas de operação (Tickets Recebidos, Estoque Médio).
3. **Grid de Seleção de Produtos (Centro)**: Lista horizontal/grade de produtos disponíveis para seleção pelo operador.
4. **Painel Inferior Duplo (Rodapé/Conteúdo Secundário)**:
   - **Monitor de Estoque** (Ocupa 2/3 da largura): Visão detalhada do saldo atual.
   - **Últimos Tickets** (Ocupa 1/3 da largura): Feed de validações recentes.
5. **Botão Flutuante de Ação (Primary Action)**: Um botão proeminente "Validar X Tickets" que sobrepõe a tela (ou fixa-se entre o grid de produtos e o painel inferior) para acesso ultra-rápido.

## 2. Especificação de Componentes

### 2.1 Componentes de Layout Base
- **Cor de Fundo da Página**: `#FAF8FF`
- **Tipografia**: `Inter` em toda a aplicação.

### 2.2 `SummaryCard` (Cards de Métrica)
- **Props**: `title` (string), `value` (string/number), `icon` (SVG), `trend` (opcional: { label: string, isPositive: boolean }).
- **Visual**: Fundo branco (`#FFFFFF`), borda esquerda colorida (`#0050CB` para tickets, `#006E2F` para estoque), sombra suave.

### 2.3 `ProductSelector` (Card de Produto para Seleção)
- **Props**: `product` (id, nome, imagem, status, preço).
- **Estado Local**: Quantidade selecionada (`count`).
- **Visual**: Fundo branco, bordas arredondadas (20px).
- **Interação**: 
  - Ao clicar no produto, incrementa a quantidade.
  - Exibe um "badge" flutuante (Azul `#5F59FF`) com a quantidade atual. 
  - *Nota*: A lógica de negócio exige o cálculo do valor total. O frontend deverá somar o `count` de todos os produtos selecionados.

### 2.4 `FloatingValidationButton` (Botão de Validação)
- **Estado Ativo**: Habilitado apenas se a soma de produtos selecionados > 0.
- **Props**: `totalQuantity` (number), `totalValue` (number).
- **Visual**: Fundo verde principal (`#0066FF` / azul no Figma original, mas deve refletir destaque), texto "Validar X Ticket(s)". 
- **Comportamento**: Fixo na tela para evitar scroll excessivo do operador. Ao clicar, dispara o fluxo atômico de validação e reseta as seleções.

### 2.5 `InventoryMonitor` (Lista de Estoque)
- **Lista de `InventoryItem`**: Exibe Nome, Quantidade e Unidade.
- **Lógica de Alerta de Estoque**: 
  - Se a quantidade estiver confortável: Exibe apenas o número (preto).
  - Se estiver próximo do fim (ex: < 15 unid): Exibe um badge vermelho (`#FFDAD6` fundo, `#93000A` texto) escrito "BAIXO ESTOQUE".
  - Se quantidade == 0: Produto entra em estado *Disabled* (desabilitado) no Grid de Seleção (requisito do PRD base).

### 2.6 `RecentTicketsFeed` (Feed de Histórico)
- **Lista de `TicketHistoryItem`**: Exibe Resumo do Pedido ("2x Pastel de Carne"), Ticket ID e Tempo ("Agora", "3 min atrás").
- **Visual**: Lista em tons decrescentes de opacidade para indicar passagem do tempo.
- **Ação Requerida (Nova)**: Adicionar um pequeno botão/ícone de **"Desfazer / Estornar"** no item mais recente ("Agora") para cumprir o requisito de cancelamento rápido de erros do operador.

## 3. Gerenciamento de Estado (Frontend)

O frontend precisará gerenciar um estado global/contexto complexo para garantir resposta < 500ms:
- `selectedItems`: Dicionário `[productId: string]: number`.
- `inventoryState`: Dicionário `[productId: string]: number` (atualizado em tempo real ou via polling agressivo).
- **Derivações**:
  - `totalSelectedCount` = soma dos valores de `selectedItems`.
  - `totalValue` = soma de `selectedItems[id] * price[id]`.
  - `isValidatable` = `totalSelectedCount > 0` E `selectedItems[id] <= inventoryState[id]` (não permite validar se não tiver estoque suficiente).

## 4. Design Tokens Extras Extraídos
- Primária (Ações em foco): `#0050CB` (Azul escuro), `#0066FF` (Azul brilhante)
- Sucesso/Estoque Seguro: `#006E2F`, `#007432` (Verde escuro) e `#6BFF8F` (Verde claro)
- Alerta/Erro (Bloqueio de Estoque): Texto `#93000A`, Fundo `#FFDAD6` (Vermelho)
- Tipografia em foco: Bold (700) para valores, Semi Bold (600) para títulos secundários.

## 5. Próximos Passos (To-Do)
- [ ] Exportar os assets de imagem (Pastel de Carne, Queijo, Caldo de Cana) através do servidor MCP.
- [ ] Implementar estrutura do grid principal e responsividade.
- [ ] Criar a lógica de mock state para validar os bloqueios de estoque a zero antes de integrar com a API real.
