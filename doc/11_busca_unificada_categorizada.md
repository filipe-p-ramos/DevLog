# Plano de Implementação: Busca Unificada e Categorizada ("Tarefas em andamento" e "Tarefas Concluídas")

## 1. Contexto e Motivação
A interface do **DevLog** possuía o campo de busca posicionado no canto extremo direito da barra de abas de status (`justify-between`), exigindo movimentos oculares e do cursor desnecessários em telas *widescreen*. Ademais, a busca anterior operava restrita ao status ativo (filtrando apenas tarefas da aba "Pendentes" ou da aba "Concluídas").

O objetivo deste incremento foi:
1. **Aproximação Espacial:** Trazer o campo de pesquisa para a esquerda, situando-o imediatamente ao lado das abas de navegação de status ("Pendentes" e "Concluídas").
2. **Busca Global Categorizada:** Permitir que, ao digitar qualquer termo na barra de busca, o sistema procure instantaneamente em todas as tarefas do projeto (ativas e finalizadas), agrupando o resultado visualmente em duas categorias:
   - **Tarefas em andamento**
   - **Tarefas Concluídas**

---

## 2. Arquitetura Técnica

### 2.1. Ajuste de Layout e Alinhamento
No componente `src/app/components/DashboardContent.tsx`, o container `.header-status-tabs` teve sua regra flexbox alterada:
- **Antes:** `justify-between` (empurrava o input para a extremidade oposta da tela).
- **Depois:** `justify-start gap-3 sm:gap-6 lg:gap-8` (alinha as abas e o input em sequência fluida e harmônica à esquerda).

### 2.2. Lógica Reativa e Memoização de Resultados
Para garantir máxima performance sem renderizações redundantes, foram criados hooks `useMemo`:
```typescript
const isSearching = searchQuery.trim().length > 0;

// Busca global no projeto atual
const searchMatchingTasks = useMemo(() => {
  if (!isSearching) return [];
  const query = searchQuery.toLowerCase().trim();
  return initialTasks.filter(t => {
    const matchesTag = !selectedTag || t.tags.some(tag => tag.trim().toUpperCase() === selectedTag.trim().toUpperCase());
    const matchesQuery = 
      t.title.toLowerCase().includes(query) ||
      (t.description || "").toLowerCase().includes(query) ||
      t.logs.some(l => l.content.toLowerCase().includes(query)) ||
      t.tags.some(tag => tag.toLowerCase().includes(query));

    return matchesTag && matchesQuery;
  });
}, [initialTasks, searchQuery, isSearching, selectedTag]);

// Separação em categorias
const inProgressSearchTasks = useMemo(() => {
  return searchMatchingTasks.filter(t => t.status !== "completed");
}, [searchMatchingTasks]);

const completedSearchTasks = useMemo(() => {
  return searchMatchingTasks.filter(t => t.status === "completed");
}, [searchMatchingTasks]);
```

### 2.3. Modularização da Renderização (`renderTaskCard`)
Para evitar a duplicação de dezenas de linhas de JSX entre a listagem tradicional e as duas listas de resultados categorizados, o bloco de renderização do card foi abstraído na função:
- `renderTaskCard(task: Task)`: Mantém todas as propriedades e capacidades operacionais (abertura de modal de detalhes, clique para concluir/reabrir, atalhos de edição rápida, exclusão e visualização de tags/anexos).

---

## 3. Experiência de Uso (UX)

- **Fluxo com Busca Ativa:**
  1. O usuário digita qualquer termo no campo "Buscar tarefas...".
  2. A coluna de tarefas se divide em duas seções com cabeçalhos dedicados e contadores numéricos estilizados:
     - **Tarefas em andamento** (ponto e badge com `var(--accent)`)
     - **Tarefas Concluídas** (ponto e badge com `var(--status-completed)`)
  3. Caso alguma categoria não possua itens correspondentes, uma mensagem discreta informa a ausência.
  4. Se nenhuma tarefa for encontrada em nenhuma categoria, um card elegante exibe o estado vazio com o botão "Limpar pesquisa".
- **Fluxo com Busca Limpa:**
  - O usuário clica no ícone "X" ou apaga o texto.
  - A interface retorna suavemente à visualização tradicional baseada na aba ativa selecionada ("Pendentes" ou "Concluídas").

---

## 4. Validação e Qualidade
- **TypeScript:** Verificação estática com `npx tsc --noEmit` concluída com sucesso (0 erros).
- **Consistência de Cores:** Compatibilidade total com os temas claro (sépia analógico) e escuro (deep dark).
