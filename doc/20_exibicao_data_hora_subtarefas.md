# Memorial Técnico — Marco 20: Exibição de Data e Hora nas Subtarefas e Ações Pendentes

## 1. Contexto e Motivação
No ecossistema de gestão de tarefas do DevLog, as subtarefas (ações pendentes de validação e testes) desempenham um papel crítico para o rastreamento minucioso do ciclo de vida de cada demanda. No entanto, embora o modelo relacional do PostgreSQL (Prisma) já registrasse nativamente o carimbo de data e hora de criação (`createdAt DateTime @default(now())`), essa informação não estava sendo renderizada visualmente no cartão da subtarefa dentro do modal de detalhes da tarefa.

Como resultado, o desenvolvedor não conseguia identificar instantaneamente quando uma ação ou pendência de teste foi aberta nem comparar sua criação com os andamentos gerais registrados na tarefa.

O objetivo deste marco foi viabilizar a **apresentação transparente, acessível e contextual de data e hora em todas as subtarefas**, abrangendo tanto a visualização em lista quanto o modo de edição e a indicação de conclusão.

---

## 2. Decisões Técnicas e Implementação

### A. Renderização na Lista de Subtarefas (`DashboardContent.tsx`)
- Logo abaixo do título da subtarefa, foi adicionada uma linha de metadados tipográfica com tamanho `text-[10px]`, peso `font-bold` e contraste calibrado (`text-[#777] dark:text-[#999]`).
- Formatação localizada via `new Date(subtask.createdAt).toLocaleString()`, com salvaguarda defensiva contra valores inválidos (`!isNaN(new Date(...).getTime())`).
- Caso a ação tenha sido concluída sem inclusão de nota de resolução explicativa, a data e hora de conclusão (`subtask.completedAt`) é exibida de forma complementar em verde esmeralda (`text-emerald-800 dark:text-emerald-400`), garantindo rastreabilidade integral.

### B. Integração no Modo de Edição
- No formulário inline de edição da subtarefa (`isEditing`), foi inserido o carimbo original de criação no rodapé do bloco (`Criada em DD/MM/AAAA, HH:MM:SS`), alinhado à esquerda e contraposto aos botões de ação ("Cancelar" e "Salvar Alterações"), garantindo que o usuário tenha o contexto temporal preservado durante revisões técnicas.

### C. Acessibilidade e Harmonização Cromática
- Alinhado rigorosamente aos padrões de acessibilidade (WCAG) já estabelecidos para os temas Claro (sépia/caderno) e Escuro da aplicação, mantendo a hierarquia visual limpa e sem poluição estética.

---

## 3. Arquivos Modificados
- `src/app/components/DashboardContent.tsx`:
  - Inclusão da exibição de `Criada em [data e hora]` abaixo do título da subtarefa.
  - Inclusão complementar de `• Concluída em [data e hora]` para subtarefas resolvidas sem nota.
  - Inclusão do carimbo de criação na barra de rodapé do modo de edição da subtarefa.

---

## 4. Validação
- **Checagem Estática:** `npx tsc --noEmit` executado com 0 erros de compilação.
- **Formatação e Fuso Horário:** Renderização de timestamps no fuso local do navegador do usuário.
