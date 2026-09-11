# Memorial Técnico 06: Expulgo de Tags Órfãs, Filtro Contextual e Gerenciamento de Tags

Este documento registra as decisões de engenharia, arquitetura de dados e implementação realizadas para sanar tags sem tarefas vinculadas, implementar o filtro contextual por status na interface e estabelecer rotinas de *Garbage Collection* no banco de dados.

---

## 1. Contexto, Diagnóstico e Motivação

### O Problema Identificado
Ao navegar no projeto **Carreira Livre** na aba **Pendentes (22)**, o usuário selecionou a tag **`MELHORIAS DE UX`** e a interface apresentou a mensagem: *"Nenhuma tarefa encontrada neste filtro."*.

### Análise de Causa Raiz
1. **Acúmulo Estático de Tags no Filtro:** No componente [`src/app/components/DashboardContent.tsx`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/components/DashboardContent.tsx), o array de tags únicas para a barra de filtros (`allUniqueTags`) era extraído indiscriminadamente de `initialTasks`, misturando tarefas pendentes e tarefas concluídas.
2. **Tags com Zero Tarefas no Status Ativo:** No banco de dados, existia apenas 1 tarefa vinculada à tag `MELHORIAS DE UX` (`"Depois do perfil impulsionado, mudar esse texto para algo menor de 1 linha"`), com status `completed` (Concluída). Por estar na aba Pendentes, a consulta retornava zero tarefas, dando a sensação de se tratar de uma tag "órfã" ou "fantasma". O mesmo acontecia com tags como `APP` e `CELULAR` (que só possuem itens concluídos).
3. **Inconsistência Semântica de Plural:** A base de dados continha simultaneamente `MELHORIA DE UX` (singular, com 6 tarefas ativas) e `MELHORIAS DE UX` (plural, com 1 tarefa), violando a consistência semântica das tags.
4. **Ausência de Descarte Automático de Configurações Órfãs (*Garbage Collection*):** Quando uma tag deixava de existir em tarefas (ou quando uma tarefa era excluída), eventuais cores personalizadas salvas na tabela `TagConfig` permaneciam residentes no banco indefinidamente sem uso real.

---

## 2. Conceitos Técnicos Aplicados

- **Filtro Contextual e Derivado (Contextual Filtering):** Padrão de UX/UI onde as opções de filtro disponíveis refletem dinamicamente o subconjunto de dados do contexto selecionado pelo usuário, evitando opções nulas ou resultados vazios decepcionantes.
- **Coleta de Lixo / Descarte Órfão (Garbage Collection):** Rotina de higienização de banco de dados que detecta entidades de apoio (como configurações de cores em `TagConfig`) que perderam suas entidades principais de referência (`Task.tags`) e as purga automaticamente.
- **Deduplicação e Normalização de Dados (Data Normalization):** Garantia de que variações morfológicas espúrias (ex: plural inadvertido vs singular canônico) sejam unificadas na representação primária.
- **Idempotência (Idempotency):** Scripts de migração desenvolvidos para execução segura repetida, sem corrupção de estado ou duplicação de dados.

---

## 3. Ações Técnicas Realizadas

### A. Unificação e Higienização no Banco de Dados
- Desenvolvido e executado o script idempotente [`scripts/unify_ux_tags.js`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/scripts/unify_ux_tags.js):
  - Localizada a tarefa `c302fc7b-bafa-4151-86ad-d2038db2d6d9` contendo `MELHORIAS DE UX`.
  - Migradas as tags para a representação canônica `MELHORIA DE UX`.
  - A variante `MELHORIAS DE UX` foi extinta com 100% de sucesso.

### B. Backend: Garbage Collection e Exclusão em Lote
No arquivo [`src/app/actions/tags.ts`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/actions/tags.ts):
- **`cleanupOrphanTagConfigs(userId: string)`:**
  - Varre todas as tarefas de todos os projetos do usuário autenticado e constrói o conjunto de tags ativas.
  - Compara com os registros da tabela `TagConfig`.
  - Remove automaticamente do PostgreSQL (`deleteMany`) quaisquer registros em `TagConfig` que não pertençam a nenhuma tarefa ativa do usuário.
- **`deleteTag(projectId: string, tagName: string)`:**
  - Valida permissões e posse do projeto via `userId`.
  - Localiza todas as tarefas do projeto contendo a referida tag e a remove do array `tags`.
  - Dispara a rotina de *Garbage Collection* (`cleanupOrphanTagConfigs`) para expurgar cores órfãs.
  - Revalida a rota via `revalidatePath("/")`.

No arquivo [`src/app/actions/tasks.ts`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/actions/tasks.ts):
- Integrada a chamada de `cleanupOrphanTagConfigs(userId)` em `updateTask` e `deleteTask`, assegurando que a remoção ou edição de tarefas mantenha a tabela `TagConfig` permanentemente higienizada.

### C. Frontend: Filtro Contextual e Contadores Dinâmicos
No arquivo [`src/app/components/DashboardContent.tsx`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/components/DashboardContent.tsx):
- **Cálculo Contextual com Memoização (`contextualTagsWithCount`):**
  - A barra de tags agora filtra dinamicamente as tags a partir de `currentStatusTasks` (tarefas do status ativo: `pending` ou `completed`).
  - Tags com zero tarefas no status atual não são exibidas na barra de filtros daquele status.
  - Ao alternar entre Pendentes e Concluídas, um `useEffect` monitora a seleção e desmarca automaticamente a tag caso ela não possua tarefas no novo status (`setSelectedTag(null)`).
- **Contador Integrado por Tag:**
  - Cada botão de tag na interface agora exibe um badge discreto e elegante com a contagem de tarefas disponíveis (ex: `MELHORIA DE UX (4)`, `BUG (2)`). O botão "Todas" também indica o total do status ativo (ex: `Todas (22)`).
- **Ação de Exclusão Rápida:**
  - No hover de cada tag na barra de filtros, foi disponibilizado um botão com ícone `X` permitindo ao usuário remover aquela tag de todas as tarefas daquele projeto com confirmação em tempo real.
- **Preservação de Sugestões:**
  - O `datalist` de sugestões no modal de criação e edição de tarefas foi mantido com base em `allUniqueTags` (todas as tags do projeto), facilitando o reuso rápido de termos conhecidos.

---

## 4. Verificação e Testes

1. **Purga da Tag Inconsistente:** Executado [`scratch/check_ux.js`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/scratch/check_ux.js) confirmando que `MELHORIAS DE UX` foi completamente eliminada e incorporada em `MELHORIA DE UX` ($7$ tarefas no total: $4$ pendentes e $3$ concluídas).
2. **Teste de Garbage Collection:** Executado [`scratch/test_cleanup.js`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/scratch/test_cleanup.js), gerando um registro fictício em `TagConfig` e validando sua identificação e eliminação automática.
3. **Compilação de Produção (`npx next build`):** Build concluído com sucesso absoluto em 2.0s sem erros de tipagem TypeScript ou de runtime.
4. **Navegação:**
   - Na aba **Pendentes**: são listadas apenas as 10 tags que possuem pendências reais com suas respectivas contagens.
   - Na aba **Concluídas**: são listadas apenas as tags de tarefas concluídas, eliminando de forma definitiva telas vazias ao clicar em tags.
