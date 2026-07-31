# PRD: Cadastro e Gestão Dinâmica de Usuários e Barracas via Interface Web

## Visão Geral

Atualmente, o cadastro e a manutenção de usuários (incluindo contas de administrador) e de barracas do sistema são realizados de forma manual, diretamente no arquivo de dados inicial (`seedData.js`). Isso significa que qualquer alteração — criar um novo usuário, editar permissões, desativar uma conta ou registrar/atualizar uma barraca — exige a edição de código-fonte por um desenvolvedor, seguida de um novo deploy da aplicação.

Essa funcionalidade tem como objetivo eliminar essa dependência técnica, entregando uma **tela de CRUD (Criar, Ler, Atualizar, Excluir) dedicada no frontend**, acessível apenas pela conta `admin`, que permita gerenciar usuários e barracas em tempo real, sem necessidade de alterar código ou realizar novo deploy.

O problema que resolve: hoje, mudanças simples de operação (como adicionar um novo atendente ou cadastrar uma nova barraca no dia do evento) dependem de um desenvolvedor disponível, o que gera atraso, risco de erro humano na edição do arquivo e impede que a equipe operacional/administrativa seja autônoma.

É valiosa para:
- **Administradores do sistema**, que ganham autonomia para gerenciar o cadastro sem depender de terceiros.
- **Equipe técnica**, que deixa de receber pedidos recorrentes de alterações manuais em `seedData.js` e reduz o risco de subir código com erros de digitação em dados de produção.
- **Organização do evento/operação como um todo**, que passa a ter maior agilidade para reagir a mudanças de última hora (ex.: uma barraca cancelada, um novo operador contratado em cima da hora).

## Objetivos

- Permitir que um usuário `admin` cadastre, edite, visualize e remova usuários e barracas exclusivamente pela interface web, sem qualquer intervenção em código.
- Eliminar 100% das edições manuais em `seedData.js` para fins de gestão de usuários e barracas após o lançamento da funcionalidade.
- Reduzir o tempo médio para cadastrar um novo usuário ou barraca de "depende de deploy" (horas/dias) para menos de 2 minutos.
- Reduzir a zero os incidentes de produção causados por erro de sintaxe/digitação na edição manual do arquivo de seed.
- Métricas a acompanhar:
  - Número de cadastros/edições realizados via nova interface (esperado: crescimento e adoção total, substituindo o fluxo antigo).
  - Número de solicitações de suporte técnico relacionadas a "adicionar/editar usuário ou barraca" (meta: redução para próximo de zero).
  - Tempo médio entre a decisão de cadastrar algo e o cadastro efetivamente disponível no sistema.

## Histórias de Usuário

- Como **administrador (`admin`)**, eu quero cadastrar um novo usuário diretamente pela interface web, para que eu não precise pedir para um desenvolvedor alterar o código.
- Como **administrador (`admin`)**, eu quero editar os dados de um usuário já existente (nome, permissões, status ativo/inativo, barraca vinculada), para que eu possa corrigir informações ou atualizar responsabilidades sem esperar um novo deploy.
- Como **administrador (`admin`)**, eu quero desativar ou remover um usuário que não faz mais parte da operação, para que contas antigas não continuem com acesso ao sistema.
- Como **administrador (`admin`)**, eu quero cadastrar uma nova barraca com seus dados básicos (nome, categoria/tipo, responsável, status), para que ela apareça no sistema no mesmo dia em que for criada, sem depender de deploy.
- Como **administrador (`admin`)**, eu quero editar informações de uma barraca já cadastrada (ex.: renomear, trocar responsável, mudar status para inativa), para manter os dados sempre atualizados.
- Como **administrador (`admin`)**, eu quero visualizar uma lista consolidada de todos os usuários e todas as barracas cadastradas, com busca e filtros básicos, para localizar rapidamente um registro específico.
- Como **administrador (`admin`)**, eu quero receber uma confirmação antes de excluir um usuário ou barraca, para evitar exclusões acidentais que afetem a operação.
- Como **desenvolvedor/equipe técnica** (persona secundária), eu quero que essa gestão pare de depender de alterações em `seedData.js`, para reduzir chamados de suporte e riscos de erro em produção.
- Caso extremo: Como **administrador**, eu quero ser impedido de excluir um usuário ou barraca que possua vínculos ativos importantes (ex.: uma barraca com vendas/pedidos em aberto), para não gerar inconsistência nos dados do sistema.
- Caso extremo: Como **administrador**, eu quero ser avisado se tentar cadastrar um usuário com um identificador (login/e-mail) já existente, para evitar duplicidade de contas.

## Funcionalidades Principais

### 1. Tela de Listagem de Usuários
- O que faz: exibe todos os usuários cadastrados em formato de tabela/lista, com colunas como nome, tipo de conta (admin/operador/etc.), barraca vinculada (se aplicável) e status (ativo/inativo).
- Por que é importante: dá visibilidade completa ao admin sobre quem tem acesso ao sistema hoje.
- Como funciona: consulta os usuários persistidos (ver Restrições Técnicas) e apresenta com opções de busca por nome/login e filtro por status/tipo.
- Requisitos funcionais:
  1.1. O sistema deve listar todos os usuários cadastrados, com paginação caso o volume seja alto.
  1.2. O sistema deve permitir busca por nome ou login/identificador.
  1.3. O sistema deve permitir filtrar por status (ativo/inativo) e por tipo de conta.
  1.4. Apenas usuários autenticados com a conta `admin` (ou perfil equivalente com permissão de administração) podem acessar esta tela.

### 2. Cadastro de Novo Usuário
- O que faz: formulário para criar um novo usuário informando os dados necessários (nome, login/e-mail, senha inicial ou mecanismo de definição de senha, tipo de conta/permissão, barraca vinculada quando aplicável).
- Por que é importante: é o núcleo da funcionalidade — substitui a edição manual do `seedData.js`.
- Como funciona: formulário validado no frontend e no backend antes de persistir o novo registro.
- Requisitos funcionais:
  2.1. O sistema deve validar campos obrigatórios (nome, login/identificador, tipo de conta) antes de permitir o envio.
  2.2. O sistema deve impedir a criação de usuários com login/identificador duplicado, exibindo mensagem de erro clara.
  2.3. O sistema deve permitir associar o novo usuário a uma barraca existente, quando o tipo de conta exigir esse vínculo.
  2.4. O sistema deve definir o novo usuário como "ativo" por padrão, com opção de já cadastrá-lo como inativo.
  2.5. O sistema deve exibir confirmação de sucesso (ou erro detalhado) após a tentativa de cadastro.

### 3. Edição de Usuário Existente
- O que faz: permite alterar dados de um usuário já cadastrado.
- Por que é importante: mantém os dados corretos ao longo do tempo (mudança de responsabilidade, correção de nome, troca de barraca vinculada, etc.).
- Como funciona: formulário pré-preenchido com os dados atuais do usuário selecionado na listagem.
- Requisitos funcionais:
  3.1. O sistema deve permitir editar nome, tipo de conta, barraca vinculada e status do usuário.
  3.2. O sistema deve permitir redefinir a senha do usuário (ou disparar fluxo de redefinição), conforme mecanismo de autenticação adotado.
  3.3. O sistema deve impedir a edição do login/identificador para um valor já usado por outro usuário.
  3.4. O sistema deve registrar a mudança de forma consistente, refletindo imediatamente na listagem.

### 4. Ativação/Desativação e Exclusão de Usuário
- O que faz: permite desativar (soft delete) ou remover definitivamente um usuário.
- Por que é importante: controla o acesso ao sistema sem necessariamente perder o histórico associado ao usuário.
- Como funciona: ação disponível na listagem/tela de detalhe do usuário, com modal de confirmação.
- Requisitos funcionais:
  4.1. O sistema deve exigir confirmação explícita antes de desativar ou excluir um usuário.
  4.2. O sistema deve priorizar a desativação (soft delete) sobre a exclusão definitiva, preservando histórico/vínculos.
  4.3. O sistema deve impedir a exclusão definitiva de usuários com vínculos ativos relevantes (ex.: registros de vendas, pedidos ou sessões em aberto), sugerindo desativação como alternativa.
  4.4. Um usuário desativado não deve conseguir autenticar-se no sistema.

### 5. Tela de Listagem de Barracas
- O que faz: exibe todas as barracas cadastradas com seus principais atributos (nome, categoria, responsável, status).
- Por que é importante: espelha para barracas a mesma autonomia de gestão dada aos usuários.
- Como funciona: análogo à listagem de usuários, com busca e filtros.
- Requisitos funcionais:
  5.1. O sistema deve listar todas as barracas cadastradas, com busca por nome e filtro por status/categoria.
  5.2. Apenas a conta `admin` (ou perfil equivalente) pode acessar esta tela.

### 6. Cadastro, Edição, Ativação/Desativação e Exclusão de Barracas
- O que faz: espelha para barracas as mesmas capacidades de CRUD descritas para usuários.
- Por que é importante: garante que a operação de barracas também deixe de depender do `seedData.js`.
- Como funciona: formulários de criação/edição e ações de ativação/desativação/exclusão, seguindo as mesmas regras de confirmação e proteção contra exclusão indevida descritas para usuários.
- Requisitos funcionais:
  6.1. O sistema deve permitir cadastrar uma barraca com nome, categoria/tipo e responsável (podendo vincular um usuário responsável já cadastrado).
  6.2. O sistema deve permitir editar todos os campos de uma barraca existente.
  6.3. O sistema deve impedir a exclusão definitiva de barracas com vínculos ativos (ex.: pedidos em aberto, usuários ainda vinculados), sugerindo desativação.
  6.4. O sistema deve exigir confirmação explícita antes de desativar ou excluir uma barraca.

### 7. Controle de Acesso à Área de Gestão
- O que faz: garante que somente a conta `admin` (ou perfil autorizado) visualize e utilize as telas de CRUD.
- Por que é importante: usuários e barracas são dados sensíveis à operação; acesso indevido pode comprometer a integridade do sistema.
- Como funciona: validação de perfil/permissão no acesso às rotas/telas de gestão.
- Requisitos funcionais:
  7.1. O sistema deve bloquear o acesso às telas de gestão de usuários e barracas para qualquer conta que não seja `admin` (ou perfil equivalente autorizado).
  7.2. O sistema deve redirecionar ou exibir mensagem de acesso negado para usuários não autorizados que tentem acessar essas rotas diretamente.

## Experiência do Usuário

- **Persona primária**: Administrador do sistema (conta `admin`), geralmente responsável pela organização/operação do evento, com conhecimento operacional mas não necessariamente técnico.
- **Persona secundária**: Equipe técnica/desenvolvimento, que deixa de ser acionada para tarefas rotineiras de cadastro.

- Fluxos principais:
  - Admin acessa uma área de "Gestão" (ou "Administração") no menu principal, exclusiva para seu perfil.
  - A partir dessa área, acessa duas seções: "Usuários" e "Barracas", cada uma com listagem + botão de "Novo Cadastro".
  - Ao criar ou editar, o admin preenche um formulário simples, com validação em tempo real e mensagens de erro claras.
  - Ações destrutivas (desativar/excluir) sempre passam por uma confirmação explícita (modal), evitando cliques acidentais.

- Considerações de UI/UX:
  - Interface consistente com o restante do sistema (mesmo padrão visual e de navegação já utilizado).
  - Feedback visual claro de sucesso, erro e carregamento em todas as ações (salvar, excluir, desativar).
  - Formulários com labels claras e mensagens de validação objetivas, pensando em usuários não técnicos.
  - Listagens com paginação e busca para lidar com volumes crescentes de usuários/barracas sem perda de performance percebida.

- Requisitos de acessibilidade:
  - Formulários navegáveis via teclado.
  - Contraste de cores adequado para leitura de textos e estados (ativo/inativo, erro/sucesso).
  - Uso de labels associadas corretamente aos campos de formulário para compatibilidade com leitores de tela.

## Restrições Técnicas de Alto Nível

- A funcionalidade deve substituir o uso de `seedData.js` como mecanismo de gestão contínua de usuários e barracas; o arquivo pode continuar existindo apenas para o setup inicial/dados de exemplo em ambiente de desenvolvimento.
- Deve existir uma camada de persistência real (banco de dados) para usuários e barracas, já que dados mantidos apenas em arquivo estático de seed não sobrevivem a deploys/reinícios da aplicação.
- O acesso às novas telas e às operações de CRUD deve respeitar o mecanismo de autenticação/autorização já existente no sistema, restringindo o uso à conta `admin` (ou perfil equivalente).
- Senhas de usuários (quando aplicável) devem ser tratadas com armazenamento seguro (hash), nunca em texto plano, seguindo boas práticas já adotadas (ou a serem adotadas) pelo sistema.
- Dados de usuários podem ser considerados dados pessoais/sensíveis; a solução deve prever cuidado no armazenamento e exibição dessas informações (ex.: não expor senha em nenhuma tela ou log).
- Não há, neste momento, requisito explícito de alto volume/alta escala (TPS) informado; a expectativa é de uso administrativo, com poucos usuários simultâneos gerenciando os cadastros.
- Detalhes de implementação (modelagem de banco, endpoints de API, tecnologia de frontend/backend específica) serão definidos na Especificação Técnica.

## Não-Objetivos (Fora de Escopo)

- Esta funcionalidade não inclui um sistema completo de gestão de permissões granulares (ex.: permissões customizadas por tela/ação) além dos perfis básicos já existentes — isso pode ser considerado em uma fase futura.
- Não está no escopo criar um fluxo de "autocadastro" (usuários se cadastrando sozinhos); todo cadastro continua sendo feito exclusivamente pelo `admin`.
- Não está no escopo desta funcionalidade a migração ou importação em massa de dados históricos que hoje estão no `seedData.js` — isso pode ser tratado como uma tarefa técnica separada (migração inicial de dados), fora do PRD da funcionalidade de gestão contínua.
- Não inclui, neste momento, relatórios avançados ou dashboards analíticos sobre usuários/barracas (ex.: histórico de alterações, auditoria detalhada) — pode ser considerado como evolução futura.
- Não contempla gestão de outras entidades do sistema além de usuários e barracas (ex.: produtos, pedidos), mesmo que essas também dependam hoje de arquivos estáticos.

(Nota: Riscos de implementação técnica serão detalhados na Tech Spec.)

## Questões em Aberto

- Qual é o mecanismo de autenticação atual do sistema (login/senha simples, OAuth, etc.)? Isso impacta diretamente o fluxo de criação/redefinição de senha na nova tela de usuários.
- Existem hoje diferentes tipos/perfis de usuário além de `admin` (ex.: operador de barraca, caixa)? Se sim, quais permissões cada perfil deve ter na própria tela de gestão?
- Os dados atualmente em `seedData.js` precisam ser migrados para a nova camada de persistência antes do lançamento, ou o sistema pode começar "do zero" nesse novo modelo?
- Existe necessidade de manter um histórico/auditoria de quem criou ou alterou um usuário ou barraca (ex.: para fins de rastreabilidade), mesmo que fora do escopo inicial?
- Qual o volume esperado de usuários e barracas no médio prazo? Isso ajuda a validar se a paginação/filtros propostos são suficientes.
- Deve haver algum tipo de notificação (e-mail, etc.) para o usuário recém-criado (ex.: para definição da própria senha), ou o `admin` define e comunica a senha manualmente?
- Barracas podem ter mais de um usuário responsável vinculado, ou a relação é sempre um-para-um?