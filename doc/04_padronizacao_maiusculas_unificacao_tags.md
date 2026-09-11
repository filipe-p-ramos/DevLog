# Memorial Técnico 04: Padronização em Caixa Alta e Unificação de Tags

Este documento registra as decisões de engenharia, arquitetura de dados e implementação realizadas para padronizar todas as tags do sistema em letras maiúsculas (**UPPERCASE**) e unificar tags duplicadas ou variantes de capitalização (ex: `URGENTE` e `Urgente`, `BUG` e `Bug`).

---

## 1. Contexto, Diagnóstico e Motivação

### O Problema Identificado
Na barra de filtros e na listagem de tarefas da aplicação **Project Notes**, o sistema apresentava botões e agrupamentos fragmentados para tags com o mesmo significado semântico (como `URGENTE` ao lado de `Urgente`, e `BUG` ao lado de `Bug`). 

### Análise de Causa Raiz
1. **Case-Sensitivity no Frontend:** A extração de tags únicas para renderizar os botões de filtro era executada via `Array.from(new Set(initialTasks.flatMap(t => t.tags)))`. Como os comparadores nativos de JavaScript e conjuntos (`Set`) diferenciam maiúsculas de minúsculas (*case-sensitive*), `"URGENTE"` e `"Urgente"` eram tratadas como entidades distintas.
2. **Ausência de Sanitização na Ingestão:** Ao criar uma tarefa via modal ou atualizar uma existente, o texto digitado no formulário não passava por tratamento de caixa nem por deduplicação antes de ser enviado às Server Actions e persistido no PostgreSQL via Prisma.
3. **Desalinhamento em Configurações de Cores (`TagConfig`):** As configurações de cores personalizadas salvas na tabela `TagConfig` utilizavam o texto exato digitado pelo usuário, fazendo com que uma tag em minúsculo não herdasse a cor configurada para a mesma tag em maiúsculo.
4. **Resolução de Pacotes no Windows (`next dev`):** Identificou-se que o Turbopack do Next.js 16 falha na resolução de módulos Tailwind CSS no Windows quando o diretório pai contém espaços (`Google Antigravity`). O parâmetro `--webpack` é a solução estável para o ambiente local.

---

## 2. Conceitos Técnicos Aplicados

- **Normalização de Dados (Data Normalization):** Processo de uniformização de dados antes do armazenamento para garantir que valores semanticamente idênticos possuam uma única representação canônica (`STRING.trim().toUpperCase()`).
- **Idempotência (Idempotency):** Propriedade que garante que um script de migração ou rotina de sanitização possa ser executado múltiplas vezes sem alterar o estado do sistema além da primeira execução ou causar efeitos colaterais indesejados.
- **Sanitização de Input (Input Sanitization):** Limpeza e transformação de strings originadas da camada de usuário (remoção de espaços residuais, conversão para caixa alta e filtragem de valores vazios/nulos) antes de processamento no backend.
- **Single Source of Truth (SSOT):** Centralização da regra de normalização tanto no frontend (feedback imediato e visual) quanto no backend (garantia de integridade incondicional).

---

## 3. Ações Técnicas Realizadas

### A. Migração e Consolidação no Banco de Dados
Foi desenvolvido e executado o script idempotente [`scripts/migrate_tags_uppercase.js`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/scripts/migrate_tags_uppercase.js):
- **Varredura Completa de Tarefas:** Todas as 72 tarefas no banco foram inspecionadas. Um total de **58 tarefas** tiveram suas tags normalizadas para maiúsculas e deduplicadas. Exemplos:
  - `[Urgente]` $\rightarrow$ `[URGENTE]`
  - `[Bug]` $\rightarrow$ `[BUG]`
  - `[Melhoria de UX]` $\rightarrow$ `[MELHORIA DE UX]`
  - `[Backend]` $\rightarrow$ `[BACKEND]`
- **Consolidação da Tabela `TagConfig`:** As configurações de cores de tags foram normalizadas para maiúsculas, mantendo a consistência com as chaves compostas `@@unique([userId, name])`. 7 configurações ativas foram padronizadas sem perda de preferências de cores.

### B. Proteção do Backend (Server Actions)
No arquivo [`src/app/actions/tasks.ts`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/actions/tasks.ts):
- Implementada a função utilitária `sanitizeTags`:
  ```typescript
  function sanitizeTags(tags: string[] = []): string[] {
    return Array.from(
      new Set(
        tags
          .map(t => (typeof t === "string" ? t.trim().toUpperCase() : ""))
          .filter(Boolean)
      )
    );
  }
  ```
- Integrada a chamada de `sanitizeTags` tanto em `createTask` quanto em `updateTask`, assegurando que mesmo requisições externas ou chamadas diretas nunca persistam tags minúsculas ou repetidas.

No arquivo [`src/app/actions/tags.ts`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/actions/tags.ts):
- A Server Action `updateTagColor` agora aplica `name.trim().toUpperCase()` antes de registrar a cor na tabela `TagConfig`.

### C. Experiência de Usuário e Interface (Frontend)
No arquivo [`src/app/components/DashboardContent.tsx`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/components/DashboardContent.tsx):
- **Input de Tags com Feedback em Tempo Real:** 
  - Adicionada classe utilitária `uppercase` ao campo de input.
  - Implementado `onChange={(e) => setNewTaskTags(e.target.value.toUpperCase())}` para que todo caractere digitado seja instantaneamente refletido em maiúsculas no estado e na interface.
  - Atualizado o placeholder para `EX: DESIGN, BACKEND, URGENTE`.
- **Deduplicação da Barra de Filtro (`allUniqueTags`):**
  - Geração estritamente normalizada com `.toUpperCase()` e `Set`, eliminando qualquer duplicação na barra de filtros.
  - Estilização aprimorada do botão com `uppercase tracking-wider`.
- **Filtragem Resiliente (`matchesTag`):**
  - Comparação segura com `t.tags.some(tag => tag.trim().toUpperCase() === selectedTag.trim().toUpperCase())`.
- **Resolução de Cores (`getTagColor`):**
  - Normalização de chave no dicionário `customTagColors` para garantir que qualquer tag encontre sua cor independente de como foi referenciada.

### D. Correção do Ambiente Local de Desenvolvimento e Autenticação
- **Resolução de Módulos (Webpack vs Turbopack):** No arquivo [`package.json`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/package.json), atualizado o script de desenvolvimento para `"dev": "next dev --webpack"` contornando a falha do Turbopack no Windows em diretórios com espaços.
- **Resiliência no `useActionState` (React 19):** Adequada a Server Action `loginWithPassword` em [`src/app/actions/auth.ts`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/actions/auth.ts) para operar de forma polimórfica com os argumentos `(prevState, formData)` do React 19, eliminando o erro `TypeError: Cannot read properties of undefined (reading 'get')`.
- **Eliminação de Erro 500 por Modificação Ilegal de Cookies:** Removida a chamada `cookieStore.delete()` que ocorria durante a renderização de Server Component em `getUserId()`. O fluxo agora redireciona para `/login?reset=1`, onde o middleware realiza a expiração e deleção segura do cookie na resposta HTTP.
- **Sincronização de Credencial:** Validação e fixação da senha do usuário `filipe` no banco de dados via `bcryptjs`.

---

## 4. Verificação e Testes

1. **Checagem de Banco de Dados:** Executado [`scratch/check_tags.js`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/scratch/check_tags.js), comprovando que 100% das tags existentes no banco estão em maiúsculas, com zero duplicatas ou fragmentações.
2. **Compilação de Produção (`npm run build`):** O build do Next.js e a geração estática das rotas foram concluídos com sucesso absoluto em 2.3s, sem erros de TypeScript ou eslint.
3. **Servidor Local (`npm run dev`):** Validada a inicialização com Webpack na porta 3000 em 410ms (`✓ Ready in 410ms`), com compilação sem falhas de resolução de estilo.

---

## 5. Próximos Passos e Recomendações
- O sistema já está pronto para uso contínuo.
- Toda nova tag criada por qualquer usuário será automaticamente formatada em maiúsculas sem necessidade de ação manual.
