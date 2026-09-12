# Memorial Técnico — Marco 19: Filtro de Tarefas com Ações Pendentes

## 1. Contexto e Motivação
Com a introdução do sistema de **Subtarefas e Ações Pendentes** (Marco 17), os cartões de tarefas passaram a exibir um indicador proporcional (ex: `0/1`, `1/3`), destacando o número de pendências resolvidas em relação ao total.

Entretanto, em projetos com elevado volume de atividades (como o projeto *Carreira Livre*, com dezenas de tarefas pendentes), o desenvolvedor necessitava percorrer visualmente toda a listagem para localizar quais tarefas continham subtarefas/ações que ainda exigiam resolução ou validação técnica.

Surgiu a demanda de incorporar um filtro dedicado na barra de status superior para listar exclusivamente as tarefas que possuem ações/subtarefas pendentes de conclusão.

---

## 2. Decisões Técnicas e Ações Realizadas

### A. Expansão da Tipagem e Estado de Filtro (`DashboardContent.tsx`)
- O estado `statusFilter` foi tipado para incluir a nova modalidade:
  `statusFilter: "pending" | "completed" | "subtasks_pending"`.
- Foi estabelecida a regra de negócio para a condição de "tarefa com ações pendentes":
  - A tarefa pai deve estar ativa (`status !== "completed"`).
  - A tarefa deve possuir subtarefas cadastradas (`subtasks && subtasks.length > 0`).
  - Pelo menos uma das subtarefas deve estar em aberto (`subtasks.some(s => !s.completed)`).

### B. Integração com Tags Contextuais e Pipeline de Filtragem
- **Tags Contextuais (`currentStatusTasks`):** O cálculo reativo com `useMemo` agora filtra dinamicamente as tarefas no modo `subtasks_pending`. Isso faz com que a barra superior de tags exiba somente as tags das tarefas que possuem ações pendentes, permitindo cruzamento inteligente de filtros (ex: apenas tarefas de "BACKEND" com ações pendentes).
- **Listagem Principal (`normalTasks`):** O memo de tarefas normais respeita o critério unificado de `subtasks_pending` em conjunto com o filtro de tags selecionado.
- **Estado Vazio Amigável:** Quando não houver tarefas correspondentes no projeto para este filtro, a interface apresenta a mensagem contextual *"Nenhuma tarefa com ações pendentes neste projeto."*.

### C. Interface Visual e Harmonização Cromática
- **Nova Aba "Ações Pendentes":** Posicionada estrategicamente entre as abas *Pendentes* e *Concluídas*, com overflow horizontal suave (`overflow-x-auto no-scrollbar`) para manter compatibilidade plena em dispositivos móveis.
- **Padronização Visual:** Seguindo estritamente a identidade das abas vizinhas (*Pendentes* e *Concluídas*), a aba mantém apenas a tipografia de texto e o badge numérico com a contagem proporcional em tempo real, preservando uma estética limpa, uniforme e sem elementos visuais concorrentes.
- **Coerência Cromática com a Badge dos Cards:**
  - **Tema Escuro:** Destaque em tom âmbar/dourado (`text-amber-400 font-extrabold`), badge com borda luminosa (`bg-amber-400/20 text-amber-300 border border-amber-400/30`) e barra indicadora inferior com halo de brilho (`bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]`).
  - **Tema Claro (Sépia/Caderno):** Destaque em tom âmbar escuro de alto contraste (`text-amber-900 font-extrabold`), badge contrastada (`bg-amber-800/20 text-amber-950 border border-amber-900/30`) e linha inferior sólida.

---

## 3. Arquivos Modificados
- `src/app/components/DashboardContent.tsx`:
  - Expansão do tipo `statusFilter`.
  - Atualização do cálculo de `currentStatusTasks` e `normalTasks`.
  - Inserção da aba de "Ações Pendentes" com ícone `ListTodo` e contador dinâmico.
  - Mensagem contextual no estado vazio.

---

## 4. Validação
- Validação estática de tipos TypeScript via `npx tsc --noEmit` concluída com zero erros.
- Verificada a sincronização em tempo real das contagens ao concluir/reabrir subtarefas.
