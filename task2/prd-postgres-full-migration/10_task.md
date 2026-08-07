---
status: completed
parallelizable: false
blocked_by: ["9.0"]
---

<task_context>
<domain>backend/cleanup</domain>
<type>implementation</type>
<scope>configuration</scope>
<complexity>low</complexity>
<dependencies>database</dependencies>
<unblocks>""</unblocks>
</task_context>

# Tarefa 10.0: Remover Arquivos Orfaos

## Visao Geral

Com toda a migração validada pelos testes, esta tarefa realiza a limpeza final: remover ou arquivar os arquivos que não são mais necessários após a migração para PostgreSQL puro. Inclui `seedData.ts` (cujas responsabilidades foram para o `seed.sql`), e confirmar que `data.json` não é mais gerado nem versionado.

## Requisitos

- `seedData.ts` não deve mais ser importado por nenhum arquivo em `backend/src/`
- Se `seedData.ts` não tiver mais nenhum import, removê-lo
- Confirmar que `data.json` não é gerado ao iniciar o servidor
- Confirmar que `data.json` está no `.gitignore` do backend
- Confirmar que o arquivo `data.json` não aparece em `git status` como tracked

## Subtarefas

- [ ] 10.1 Verificar que nenhum arquivo importa `seedData.ts`:
  ```powershell
  Select-String -Path "backend\src\**\*.ts" -Pattern "seedData" -Recurse
  # Resultado esperado: nenhuma ocorrência
  ```
- [ ] 10.2 Se confirmado: deletar `backend/src/seedData.ts`
- [ ] 10.3 Deletar `backend/data.json` (se ainda existir no disco)
- [ ] 10.4 Verificar que `backend/.gitignore` contém `data.json` (já deve estar)
- [ ] 10.5 Executar `npm start`, aguardar 5 segundos e verificar que `data.json` NÃO foi recriado no disco
- [ ] 10.6 Executar `git status` e confirmar que `data.json` não aparece como arquivo modificado ou não rastreado
- [ ] 10.7 Executar `npx tsc --noEmit` — zero erros após remoção dos arquivos
- [ ] 10.8 Executar `npm start` — servidor sobe e responde normalmente

## Sequenciamento

- Bloqueado por: 9.0 (testes devem passar antes da limpeza)
- Desbloqueia: Nenhum (tarefa final)
- Paralelizavel: Nao (última tarefa do projeto)

## Detalhes de Implementacao

**Verificar imports de seedData antes de remover:**
```powershell
Select-String -Path "backend\src\**\*.ts" -Pattern "from.*seedData|require.*seedData" -Recurse
```

**Verificar que data.json está no gitignore:**
```powershell
Get-Content backend\.gitignore
# Deve conter a linha: data.json
```

**Verificar que data.json não é gerado:**
```powershell
Start-Sleep -Seconds 5  # aguardar servidor iniciar
Test-Path "backend\data.json"  # deve retornar False
```

**Opcional — manter seedData.ts como referência:**
Se houver interesse em manter o `seedData.ts` para uso em testes unitários futuros, mover para `backend/src/__tests__/fixtures/seedData.ts` em vez de deletar.

## Criterios de Sucesso

- `backend/src/seedData.ts` deletado (ou movido para fixtures)
- `backend/data.json` não existe no disco após `npm start`
- `backend/.gitignore` contém `data.json`
- `git status` não mostra `data.json` como tracked ou modificado
- `npm start` sobe sem erros ou warnings relacionados ao `data.json` ou `seedData`
- `npx tsc --noEmit` retorna zero erros
- `GET /api/state` ainda retorna dados válidos do banco após limpeza
- BRANCH `refactor/postgres-full-migration` pronta para Pull Request
