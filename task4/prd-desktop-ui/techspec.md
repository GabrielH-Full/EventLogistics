# Especificação Técnica: Nova UI de Login (Desktop)

## Resumo Executivo

A solução arquitetural consiste em implementar um layout *Split Screen* para login em navegadores desktop, mantendo intacta a experiência mobile vigente. Em vez de duplicar a lógica de chamadas da API ou misturar lógicas complexas de UI num mesmo arquivo, implementaremos um padrão de "Wrapper/Container". O componente pai controlará o estado e delegará a renderização puramente visual para os componentes filhos `MobileLoginView` ou `DesktopLoginView` através de Media Queries do Tailwind CSS.

## Arquitetura do Sistema

### Visão Geral dos Componentes

- **`LoginView.tsx` (Container)**: Passa a ser um "Smart Component". Centraliza o estado (`username`, `password`, `error`, `submitting`) e a função `handleSubmit`.
- **`MobileLoginView.tsx` (Presentational)**: Cópia idêntica do retorno JSX e classes Tailwind do login antigo. Recebe o estado via propriedades (props).
- **`DesktopLoginView.tsx` (Presentational)**: Implementação JSX do Figma. Painel dividido com imagem à esquerda, formulário "Corporate Modern" à direita.
- **Assets de Imagem**: Utilizará a imagem estática de background presente no diretório `c:\Users\gabri\Downloads\project\task4\img`.

## Design de Implementação

### Interfaces Principais

```typescript
// Interface central para injeção de dependência nas Views (Desktop e Mobile)
export interface LoginPresentationProps {
  username: string;
  setUsername: (u: string) => void;
  password: string;
  setPassword: (p: string) => void;
  error: string | null;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}
```

### Modelos de Dados & Endpoints de API

*Não há modificações.* O sistema continuará a despachar o payload para a rota já existente `POST /api/auth/login` dentro do `useAuth()`, recebendo o token e os dados de perfil (admin/operador).

## Pontos de Integração

- **Tratamento de Erro (Feedback Visual)**: O erro retornado pela API via `LoginView` (pai) deve ser exibido na nova versão do desktop também como um banner `AlertCircle`, seguindo as paletas vermelhas definidas em `configs.md` (`error-container: '#ffdad6'`, `error: '#ba1a1a'`).
- **Recursos Locais**: A diretiva `<img>` ou `backgroundImage` na `DesktopLoginView` vai referenciar explicitamente a imagem fornecida em `task4/img`.

## Análise de Impacto

| Componente Afetado | Tipo de Impacto | Descrição & Nível de Risco | Ação Requerida |
| --- | --- | --- | --- |
| `LoginView.tsx` | Refatoração Estrutural | Componente será rebaixado a Container lógico. Risco Baixo. | Extrair JSX para arquivo novo |
| Acessibilidade DOM | Duplicação de Entradas | Esconder componentes via `hidden lg:flex` pode gerar duplicidade de tags de senha (`type="password"`) para o gerenciador de senhas do navegador. Risco Médio. | Monitorar auto-completar. |

## Abordagem de Testes

### Testes Unitários e Manuais

- **Preservação de Estado**: Digitar o nome de usuário na janela pequena, redimensionar para tela inteira (>1024px) e garantir que o texto não foi apagado. (Validando o sucesso do "Lifting State Up").
- **Fluxo Crítico**: Tentar o login com a conta `admin / admin123` via Desktop e `operador / log123` para certificar a conectividade intacta com o Contexto React.

## Sequenciamento de Desenvolvimento

### Ordem de Construção

1. **Separação de Camadas**: Refatorar `LoginView.tsx` separando o estado do JSX (mover JSX para `MobileLoginView.tsx`). Garantir que a versão mobile não se quebrou.
2. **Setup de Assets**: Checar a estrutura da pasta `task4/img` e disponibilizar a imagem correta no projeto para que o React (Vite) a encontre (`public/` ou `src/assets/`).
3. **Draft do Desktop**: Criar `DesktopLoginView.tsx` renderizando a estrutura macro (Painel Esquerdo x Painel Direito).
4. **Acabamento do Desktop**: Refinar a estilização do Figma usando os Design Tokens de `configs.md` (tipografia *Hanken Grotesk*, inputs de 56px de altura, etc).
5. **Integração CSS**: Montar ambos no `LoginView.tsx` usando Tailwind: 
   ```jsx
   <div className="block lg:hidden"><MobileLoginView {...props} /></div>
   <div className="hidden lg:block"><DesktopLoginView {...props} /></div>
   ```

## Considerações Técnicas

### Decisões Principais

- **Media Queries CSS vs Hooks React**: Conforme alinhado na resolução do PRD, utilizaremos separação baseada em CSS (Media Queries) diretamente com classes do Tailwind (`lg:block`). É incrivelmente mais performático para *paint* inicial do que amarrar um EventListener do Javascript no ResizeObserver da janela, economizando recursos de CPU.

### Riscos Conhecidos

- **Peso do Asset de Imagem**: A imagem da pasta `task4/img` pode vir pesada e prejudicar o *Time To Interactive*. 
  - *Mitigação*: Faremos uso da tag `<img>` apropriada ou background otimizado. (Será necessário garantir que a extensão da imagem esteja servida de forma enxuta).
- **Tipografia**: Garantir a injeção apropriada da fonte **Hanken Grotesk** globalmente, pois a nova interface desktop baseia fortemente sua legibilidade nos pesos diferenciados dela.
