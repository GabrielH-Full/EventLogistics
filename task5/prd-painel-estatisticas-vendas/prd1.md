# PRD — Exportação de Relatórios em .xlsx (Painel Estatísticas)

## 1. Visão Geral

| Campo | Valor |
| --- | --- |
| Funcionalidade | Exportação de Relatórios em Excel (`.xlsx`) |
| Módulo | Painel de Estatísticas (`/admin/statistics`) |
| Produto | EventLogistics — Controle de Estoque e Vendas |
| Autor | Equipe de Produto |
| Status | Especificado / Em Integração |
| Versão | 1.0 |

---

## 2. Contexto da Stack e Arquitetura

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 19 + Vite 6 + TypeScript |
| Roteamento | `react-router-dom` v7 (rota `/admin/statistics`) |
| Estilização | Tailwind CSS v4 |
| Ícones | `lucide-react` (`FileSpreadsheet` / `Download`) |
| Animações | `motion` (Framer Motion v12) |
| Biblioteca de Excel | `xlsx` (SheetJS) |
| Fonte de Dados | Hook `useAppData` (`src/api/useAppData.ts`) + `src/admin/estatisticas/stats.ts` |

> **Observação de Arquitetura:**
> O projeto utiliza Vite (sem Next.js/SSR). Toda a geração da planilha é realizada **100% no client-side**, reutilizando as funções puras de agregação de estatísticas já existentes em `src/admin/estatisticas/stats.ts`.

---

## 3. Problema e Objetivo

### 3.1 Problema
O painel de estatísticas exibe o faturamento e os produtos mais vendidos por barraca na tela. No entanto, coordenadores e a tesouraria do evento necessitam desses números em formato de planilha para prestação de contas, fechamento de caixa e conferência física pós-evento.

### 3.2 Objetivo
Permitir que o usuário com perfil `admin` exporte, com um clique, um arquivo `.xlsx` estruturado contendo 4 abas consolidadas com os dados em tempo real do evento.

---

## 4. Escopo do Recurso

### 4.1 Dentro do escopo
- Botão "Exportar .xlsx" no cabeçalho da página `src/admin/estatisticas/EstatisticasPage.tsx`.
- Geração instantânea *client-side* via biblioteca `xlsx`.
- Indicador de carregamento (spinner) no botão durante a montagem do arquivo.
- Estruturação em 4 abas na mesma planilha:
  1. **Resumo Geral**: Indicadores consolidados (Faturamento Validado R$, Unidades Entregues, Barracas Ativas, Produto Destaque).
  2. **Faturamento por Barraca**: Lista de barracas com receita total (R$), unidades vendidas e participação %.
  3. **Produtos Geral**: Ranking dos produtos mais vendidos em todo o evento (Nome, Categoria, Barraca, Preço Unitário, Unidades e Receita).
  4. **Produtos por Barraca**: Detalhamento de vendas agrupado por barraca.
- Nome do arquivo padronizado com data ISO local: `estatisticas-evento-YYYY-MM-DD.xlsx`.

### 4.2 Fora do escopo
- Exportação em PDF ou CSV nesta versão.
- Envio automático por e-mail.
- Processamento server-side ou rotas de API dedicadas para exportação.

---

## 5. Requisitos Funcionais

| ID | Requisito |
| --- | --- |
| **RF-01** | O sistema deve disponibilizar o botão "Exportar .xlsx" no cabeçalho da página `EstatisticasPage.tsx`. |
| **RF-02** | O sistema deve utilizar as métricas de `src/admin/estatisticas/stats.ts` baseadas estritamente em tickets com status `validated`. |
| **RF-03** | A planilha gerada deve conter 4 abas: `Resumo`, `Faturamento por Barraca`, `Produtos Geral` e `Produtos por Barraca`. |
| **RF-04** | Formatação de valores monetários como moeda (R$) e números inteiros para quantidades de unidades. |
| **RF-05** | O botão deve desabilitar temporariamente e exibir animação de *loading* durante a geração. |
| **RF-06** | Nome automático do arquivo no formato `estatisticas-evento-YYYY-MM-DD.xlsx`. |

---

## 6. Estrutura Técnica de Arquivos

| Arquivo | Descrição / Responsabilidade |
| --- | --- |
| `src/admin/estatisticas/exportXlsx.ts` | Módulo com a função `exportEstatisticasToXlsx(...)` responsável por formatar e disparar o download. |
| `src/admin/estatisticas/EstatisticasPage.tsx` | Componente container que renderiza o botão no cabeçalho e repassa os dados atualizados. |
| `src/admin/estatisticas/stats.ts` | Fonte única de cálculo e agregação de dados. |

---

## 7. Estrutura das Abas da Planilha

### Aba 1: Resumo
| Indicador | Valor | Descrição |
| --- | --- | --- |
| Faturamento Validado | R$ X.XXX,XX | Total arrecadado em tickets validados |
| Unidades Entregues | X | Total de produtos entregues |
| Barracas Ativas | X | Quantidade de pontos de venda ativos |
| Produto Destaque | Nome do Produto | Produto com maior volume de vendas |

### Aba 2: Faturamento por Barraca
| Barraca | Receita (R$) | Unidades Vendidas | Participação (%) |
| --- | --- | --- | --- |
| Barraca do Pastel | R$ 3.360,00 | 336 | 45.2% |

### Aba 3: Produtos Geral
| Ranking | Produto | Categoria | Barraca | Preço Unit. (R$) | Unid. Vendidas | Faturamento (R$) |
| --- | --- | --- | --- | --- | --- | --- |

### Aba 4: Produtos por Barraca
| Barraca | Produto | Preço Unit. (R$) | Unid. Vendidas | Faturamento (R$) |
| --- | --- | --- | --- | --- |

---

## 8. Critérios de Aceite

- [ ] O botão "Exportar .xlsx" está visível e funcional no painel de estatísticas (`/admin/statistics`).
- [ ] O arquivo baixado abre corretamente em Microsoft Excel, Google Sheets e LibreOffice Calc.
- [ ] Os números contidos na planilha são 100% idênticos aos exibidos nos cards e gráficos da tela.
- [ ] O arquivo gerado contém exatamente as 4 abas especificadas.
- [ ] Somente vendas de tickets com status `validated` são computadas.