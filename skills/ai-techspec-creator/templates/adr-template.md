# Template - ADR (Architecture Decision Record)
*Arquivo:* `01 - Guias/03 - Templates/01 - Template ADR.md`
*Versão do template:* v1.1 – 27 mai 2025
*data:* 27 mai 2025  

> Siga a numeração sequencial (`ADR-00X`) e atualize **Título**, **Status** e demais campos.
---

## ADR #XXX – *Título da Decisão*


| Campo          | Valor                                     |
| -------------- | ----------------------------------------- |
| **Data**       | YYYY-MM-DD                                |
| **Status**     | *Proposto* \| *Aceito* \| *Descontinuado* |
| **Decisores**  | Nome(s) do(s) arquiteto(s) responsáveis   |
| **Seção Wiki** | `NN - <tópico>`                           | 

---

#### Histórico deste ADR

| Data       | Alteração                     | Autor | Revisor/Contribuidor | Observações |
| ---------- | ----------------------------- | ----- | -------------------- | ----------- |
| YYYY-MM-DD | Criação                       | Nome  | Nome                 |             |
| YYYY-MM-DD | Status alterado para *Aceito* | Nome  |                      |             |

### 1. Contexto

Descreva o problema, requisitos ou forças que motivam a decisão. Inclua restrições (técnicas, de prazo, de compliance) e partes interessadas.

### 2. Decisão

Explique **o que foi decidido** de forma clara e direta.

Ex.: “Adotar *API Gateway X* como ponto único de entrada para microsserviços.” 

### 3. Justificativa

Liste as razões que levaram à decisão, comparando opções, trade-offs e evidências (benchmarks, PoC, referências de mercado).
  
### 4. Consequências

Quais impactos positivos e negativos?

- **Positivos:** ganho de manutenção, padronização, escalabilidade
- **Negativos:** curva de adoção, custo de licença, lock-in
 
### 5. Alternativas Consideradas

| #   | Alternativa | Prós | Contras | Motivo de rejeição |
| --- | ----------- | ---- | ------- | ------------------ |
| 1   | Opção B     | …    | …       | …                  |
| 2   | Opção C     | …    | …       | …                  |
 
---