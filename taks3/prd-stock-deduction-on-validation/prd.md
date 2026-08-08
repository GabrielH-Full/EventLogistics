# PRD: Validação de Tickets na Barraca

## Visão Geral

O módulo de Validação de Tickets é uma interface voltada para os operadores nas barracas de entrega de produtos. Ele resolve o problema de controle de saída e gestão de inventário no momento da retirada, substituindo processos manuais por um fluxo digital rápido. O objetivo é permitir que o operador troque um ticket físico (comprado previamente) pelo produto real, garantindo agilidade no atendimento, baixa automática de estoque e auditoria completa da operação.

## Objetivos

- **Velocidade de Atendimento**: Garantir que o processo de seleção e validação ocorra em poucos segundos (clique rápido).
- **Precisão de Inventário**: Assegurar que 100% dos itens entregues tenham baixa imediata e exata no estoque.
- **Rastreabilidade**: Registrar o operador responsável e o horário exato de todas as saídas de produtos.
- **Métricas Principais**: Tempo médio de validação por ticket, taxa de divergência de estoque, número de validações por minuto em horário de pico.

## Histórias de Usuário

- Como **operador de barraca**, eu quero selecionar os produtos correspondentes ao ticket físico na tela e visualizar a quantidade através de badges numéricos, para que eu possa conferir e montar o pedido corretamente antes de entregá-lo.
- Como **operador de barraca**, eu quero confirmar a entrega com um único clique em um botão que mostra a quantidade total selecionada (ex: "Validar 2 Tickets"), para que a validação seja ágil e visualmente segura.
- Como **gestor de estoque**, eu quero que os itens sejam reduzidos imediatamente após a validação e que o "Monitor de Estoque" seja atualizado em tempo real, para que eu tenha visibilidade imediata de reposições necessárias.

## Funcionalidades Principais

1. **Seleção e Conferência de Produtos**
   - **O que faz**: Permite ao operador selecionar visualmente os itens solicitados no ticket.
   - **Como funciona**: Ao selecionar um produto, um badge numérico (ex: "1", "9") é exibido ao lado do nome do produto. O sistema também calcula dinamicamente o valor total do ticket com base na soma dos produtos escolhidos.
   - **Por que é importante**: Fornece um feedback visual imediato antes da confirmação final, evitando erros de entrega.

2. **Botão de Validação Dinâmica (Clique Único)**
   - **O que faz**: Botão de ação principal que consolida a seleção e finaliza a entrega.
   - **Como funciona**: O texto do botão se adapta dinamicamente à quantidade selecionada (ex: "Validar 1 Ticket", "Validar 3 Tickets"). Exige apenas um clique para finalizar.
   - **Por que é importante**: Minimiza o atrito cognitivo e físico, acelerando a fila.

3. **Baixa de Estoque em Tempo Real e Bloqueio**
   - **O que faz**: Atualiza o inventário no exato momento do clique em "Validar" e previne saídas sem saldo.
   - **Como funciona**: Deduz a quantidade correspondente. O sistema impede a validação (bloqueia o registro) caso o estoque do item chegue a zero.
   - **Por que é importante**: Mantém o controle rigoroso de insumos e previne furos de inventário.

4. **Registro de Pedido e Auditoria**
   - **O que faz**: Salva o histórico da transação no banco de dados.
   - **Como funciona**: Cria um registro com ID único, status "Validado/Vendido", timestamp exato do clique e identificação do operador logado.
   - **Por que é importante**: Essencial para reconciliação de vendas, segurança e acompanhamento de produtividade.

5. **Feed de Últimos Tickets e Estorno**
   - **O que faz**: Exibe um histórico recente de operações na tela do operador com opção de reversão.
   - **Como funciona**: Após a validação, a operação aparece no feed com um ícone de confirmação. O operador possui permissão para clicar e desfazer (estornar) uma validação caso tenha clicado por engano.
   - **Por que é importante**: Dá certeza do registro e oferece uma margem de segurança essencial para erros operacionais na correria do evento.

## Experiência do Usuário

- **Personas**: Operadores de barraca (foco em velocidade e simplicidade, ambiente possivelmente barulhento ou de alta pressão) e Gestores (foco em dados confiáveis).
- **Interações**: A interface deve ser altamente responsiva, otimizada para toques rápidos (em tablets ou telas touch) ou cliques de mouse sem necessidade de digitação.
- **Feedback Visual**: Cores claras para indicar estados (ex: verde para sucesso, indicadores visuais claros no estoque).
- **Prevenção de Erros**: O botão de validação dinâmico age como uma última barreira visual ("Estou realmente validando 3 itens?").

## Restrições Técnicas de Alto Nível

- **Performance**: A ação de validação deve ser processada com baixíssima latência (ideia de tempo de resposta < 500ms) para não atrasar a fila de clientes. O sistema deve suportar um volume de processamento de até **1.000 tickets validados por hora** em momentos de pico.
- **Transações Seguras**: A baixa de estoque e o registro de auditoria devem ser operações atômicas no banco de dados (se um falhar, o outro não deve ocorrer).
- **Concorrência**: O sistema deve lidar de forma segura com validações simultâneas feitas por múltiplos operadores sem corromper a contagem do estoque (race conditions).

## Não-Objetivos (Fora de Escopo)

- **Emissão/Venda de Tickets**: Toda a etapa de pagamento, geração e impressão do ticket ocorre em outro momento (caixa/pré-venda) e não faz parte deste fluxo.
- **Processamento Financeiro**: Embora o sistema calcule e exiba o valor total do ticket para conferência, ele não processa transações de pagamento (cartão, pix, dinheiro), apenas controla a lógica de totalização e o fluxo logístico/físico do produto.
- **Cadastro de Produtos**: A criação e edição dos produtos/estoque inicial não acontece nesta interface de operação.

## Questões em Aberto

*Todas as dúvidas iniciais foram esclarecidas com os stakeholders e integradas às funcionalidades acima.*
