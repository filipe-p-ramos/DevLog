# Memorial Técnico — Marco 17: Subtarefas e Ações Pendentes com Registro de Resolução

## 1. Contexto e Motivação Operacional
No fluxo de desenvolvimento de software e resolução de problemas técnicos (como bugs de integração, testes com OAuth Google, atualizações em lojas de aplicativos ou deploy de microsserviços), uma tentativa de correção raramente é instantânea e definitiva em um único passo. Quase sempre surgem **ações de validação intermediárias** (ex: *"Aguardar atualização do app subir para teste do fluxo Google"*, *"Verificar se webhook do Mercado Pago respondeu com 200"* ou *"Validar token expirado em ambiente físico"*).

Anteriormente, o sistema DevLog suportava apenas o registro de andamentos textuais gerais (*Logs*) e o status macro da tarefa (*Pendente* ou *Concluída*). Isso gerava uma lacuna quando o desenvolvedor precisava rastrear pendências granulares dentro da tarefa, marcar quando uma hipótese foi validada e registrar formalmente **o que foi resolvido** ou o resultado do teste.

O objetivo do **Marco 17** foi introduzir uma arquitetura robusta de **Subtarefas e Ações Pendentes**, permitindo criar checklists acionáveis, marcar itens como resolvidos e persistir uma nota explicativa de resolução para cada subtarefa.

---

## 2. Modelagem Relacional e Banco de Dados (Prisma & PostgreSQL)
Foi criada a entidade `Subtask` no `prisma/schema.prisma`:

```prisma
model Subtask {
  id             String    @id @default(uuid())
  title          String    // Título ou descrição da ação pendente
  completed      Boolean   @default(false) // Estado de resolução
  resolutionNote String?   // Registro explicativo do que foi feito/resolvido
  completedAt    DateTime? // Timestamp do momento da conclusão
  order          Int       @default(0)     // Ordenação sequencial
  taskId         String
  task           Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@index([taskId])
}
```

### Decisões de Engenharia no Banco:
- **Cascade Delete (`onDelete: Cascade`):** Ao excluir uma tarefa principal, todas as suas subtarefas vinculadas são expurgadas automaticamente pelo PostgreSQL, garantindo integridade referencial e prevenindo registros órfãos.
- **Indexação (`@@index([taskId])`):** Otimiza as consultas relacionais de busca de tarefas por projeto com `include: { subtasks: true }`.
- **Campos de Auditoria e Resolução (`resolutionNote` & `completedAt`):** Preservam a data exata em que o desenvolvedor testou e concluiu a pendência, além de documentar o parecer técnico.

---

## 3. Backend e Server Actions Sanitizadas
No arquivo `src/app/actions/tasks.ts`, foram implementadas ações seguras com transações atômicas (`prisma.$transaction`) e revalidação de rota sob demanda (`revalidatePath`):

1. **`getTasks(projectId)`:** Atualizado para incluir as subtarefas ordenadas por data de criação (`subtasks: { orderBy: { createdAt: "asc" } }`).
2. **`createSubtask(taskId, title)`:** Higieniza o título e atualiza o `updatedAt` da tarefa pai para refletir atividade recente no quadro.
3. **`toggleSubtask(id, completed, resolutionNote)`:** Alterna o estado booleano de conclusão, atribuindo o timestamp `completedAt` e salvando a nota explicativa quando concluída, ou reabrindo a pendência quando desmarcada.
4. **`updateSubtask(id, title, resolutionNote)`:** Permite ajustar o título e a anotação de resolução a qualquer momento.
5. **`deleteSubtask(id)`:** Exclui a ação pendente de forma segura.

---

## 4. Experiência do Usuário (UX) e Design System

### A. Modal de Detalhes da Tarefa (`task-detail-modal`)
- **Seção Dedicada:** Localizada entre o resumo da tarefa e o histórico de andamentos, com título, ícone `ListTodo` e contador dinâmico de progresso `(X/Y)`.
- **Indicador "Todas Concluídas":** Badge esmeralda quando 100% das ações foram finalizadas.
- **Formulário de Cadastro Inline:** Campo de texto com foco automático e submissão via `Enter` ou botão `+ Adicionar`.
- **Fluxo Interativo de Resolução:**
  - Ao clicar no checkbox de uma ação pendente, uma caixa de confirmação elegante é expandida perguntando: *"Conclusão da Ação: O que você resolveu?"*.
  - O desenvolvedor pode detalhar o teste ou resultado e clicar em **"Concluir com Resolução"** (ou **"Concluir sem nota"**).
  - A subtarefa assume estilo finalizado e renderiza um box verde com o parecer técnico e data/hora.
  - **Calibração Cromática & Contraste (WCAG):** Foi aplicado verde floresta de alta densidade (`text-emerald-950` / `text-emerald-300`) com fundo sombreado e texto da nota em preto sólido (`text-[var(--foreground)]`) no tema claro sépia, eliminando o efeito esbranquiçado ou desbotado e garantindo leitura nítida e confortável.
  - Ao desmarcar uma tarefa já concluída, ela retorna ao estado pendente permitindo novas tentativas caso o teste tenha falhado posteriormente.
- **Edição e Exclusão:** Botões de ação rápida para alterar título e nota ou remover a pendência.

### B. Cards no Quadro Principal (`renderTaskCard`)
- Adicionado um badge sutil de subtarefas no rodapé de cada card quando a tarefa possui ações cadastradas (`ListTodo X/Y`), mudando para verde esmeralda quando todas forem resolvidas.

### C. Busca Unificada Aprimorada
- O hook reativo `searchMatchingTasks` passou a inspecionar também os títulos e as notas de resolução das subtarefas, permitindo encontrar tarefas a partir de qualquer termo registrado nas pendências.

---

## 5. Validação Técnica
- **Migração do Banco:** `npx prisma db push` aplicado com sucesso no banco PostgreSQL Supabase.
- **Tipagem Estrita:** `npx tsc --noEmit` executado com zero erros em todo o repositório.
- **Hot Reload:** Integração reativa sem recarregamento forçado de página via `startTransition`.
