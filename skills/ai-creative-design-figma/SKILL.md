---
name: figma
description: Use o servidor MCP do Figma para buscar contexto de design, capturas de tela, variáveis e assets do Figma, e para traduzir nós do Figma em código de produção. Acione quando uma tarefa envolver URLs do Figma, IDs de nó, implementação de design para código, ou configuração e solução de problemas do Figma MCP.
author: openai
---
# Figma MCP
Use o servidor MCP do Figma para implementações orientadas pelo Figma. Para detalhes de configuração e depuração (variáveis de ambiente, config, verificação), consulte `references/figma-mcp-config.md`.

## Regras de Integração do Figma MCP
Estas regras definem como traduzir entradas do Figma em código para este projeto e devem ser seguidas em toda mudança orientada pelo Figma.

### Fluxo obrigatório (não pule etapas)
1. Execute get_design_context primeiro para buscar a representação estruturada do(s) nó(s) exato(s).
2. Se a resposta for grande demais ou truncada, execute get_metadata para obter o mapa de nós de alto nível e então rebusque apenas o(s) nó(s) necessário(s) com get_design_context.
3. Execute get_screenshot para obter uma referência visual da variante do nó que está sendo implementada.
4. Somente depois de ter tanto get_design_context quanto get_screenshot, baixe os assets necessários e inicie a implementação.
5. Traduza a saída (geralmente React + Tailwind) para as convenções, estilos e framework deste projeto. Reutilize os tokens de cor, componentes e tipografia do projeto sempre que possível.
6. Valide em relação ao Figma para garantir paridade 1:1 de aparência e comportamento antes de marcar como concluído.

### Regras de implementação
- Trate a saída do Figma MCP (React + Tailwind) como uma representação do design e do comportamento, não como o estilo de código final.
- Substitua as classes utilitárias do Tailwind pelos utilitários/tokens do design system preferidos do projeto, quando aplicável.
- Reutilize componentes existentes (por exemplo, botões, inputs, tipografia, wrappers de ícones) em vez de duplicar funcionalidades.
- Use o sistema de cores, a escala tipográfica e os tokens de espaçamento do projeto de forma consistente.
- Respeite os padrões de roteamento, gerenciamento de estado e busca de dados já adotados no repositório.
- Busque paridade visual 1:1 com o design do Figma. Quando houver conflitos, prefira os tokens do design system e ajuste espaçamentos ou tamanhos minimamente para corresponder ao visual.
- Valide a UI final em relação à captura de tela do Figma tanto para aparência quanto para comportamento.

### Manuseio de assets
- O Servidor Figma MCP fornece um endpoint de assets que pode servir imagens e assets SVG.
- IMPORTANTE: Se o Servidor Figma MCP retornar uma fonte localhost para uma imagem ou um SVG, use essa fonte de imagem ou SVG diretamente.
- IMPORTANTE: NÃO importe/adicione novos pacotes de ícones; todos os assets devem estar no payload do Figma.
- IMPORTANTE: NÃO use nem crie placeholders se uma fonte localhost for fornecida.

### Prompting baseado em link
- O servidor é baseado em links: copie o link do frame/camada do Figma e forneça essa URL ao cliente MCP ao pedir ajuda com a implementação.
- O cliente não consegue navegar pela URL, mas extrai o ID do nó a partir do link; sempre garanta que o link aponte para o nó/variante exato que você deseja.

## Referências
- `references/figma-mcp-config.md` — configuração, verificação, solução de problemas e lembretes de uso baseado em links.
- `references/figma-tools-and-prompts.md` — catálogo de ferramentas e padrões de prompt para selecionar frameworks/componentes e buscar metadados.