# Memorial Técnico 16: Animação de Fechamento Físico do Modal na Conclusão de Tarefas

Este memorial documenta a especificação, arquitetura de animação física e integração da coreografia de saída do modal de "Detalhes da Tarefa" ao concluir ou reabrir uma tarefa no **DevLog**, inspirada na mecânica de descarte físico de notas.

---

## 1. Contexto, Diagnóstico e Motivação

### O Problema Identificado
Ao clicar no botão de ação rápida "Concluir" dentro da janela flutuante de detalhes da tarefa (`selectedTaskForDetail`), o estado interno da tarefa era alterado e o botão se transformava para "Reabrir", mas o modal permanecia estático e aberto sobre o painel.
Isso frustrava o fluxo de trabalho natural do usuário: após concluir uma atividade, a expectativa tátil e operacional é que a janela se recolha automaticamente, permitindo visualizar o quadro geral de tarefas atualizado.

### Requisito Solicitado
Implementar o fechamento automático da janela de detalhes mediante uma animação física de saída (*dismissal ejection*), com dinâmica similar à animação de descarte/exclusão de post-its, mantendo a experiência fluida, responsiva e agradável.

---

## 2. Conceitos Técnicos Aplicados

- **Micro-Interação Tátil com Antecipação (Disney Principles in UI):** O fechamento não ocorre de maneira seca nem abrupta. O modal realiza um recuo sutil de compressão física (*anticipation squash* em `scale: 0.97`, `x: 8`, `y: 2`), gerando um halo luminoso de vitória (esmeralda para conclusão e azul elétrico para reabertura).
- **Physical Dismissal / Ejection (Arremesso com Inclinação):** O elemento é projetado suavemente com rotação angular (`rotation: -6deg`), aceleração lateral e vertical (`x: -140`, `y: -30`) e redução progressiva de escala (`scale: 0.8`), simulando o descarte de uma folha física.
- **Backdrop Concurrency:** O overlay escuro de fundo (`backdrop-blur`) esvanece suavemente em sincronia (`opacity: 0`), garantindo transição transparente de volta para o dashboard.
- **Acessibilidade e Fallback (Prefers-Reduced-Motion):** Se o usuário tiver preferências de acessibilidade para redução de movimento ativadas no sistema operacional, os efeitos de deslocamento e rotação são ignorados, executando diretamente o encerramento seguro da janela.

---

## 3. Ações Técnicas Realizadas

### A. Módulo de Motion Design ([`src/lib/motion.ts`](../src/lib/motion.ts))
Criada e exportada a função `animateModalCompleteExit`:
```typescript
export function animateModalCompleteExit(
  modalElement: HTMLElement | null,
  backdropElement: HTMLElement | null,
  isCompleted: boolean,
  onComplete?: () => void,
  buttonElement?: HTMLElement | null
)
```
- **Fase 1: Antecipação Tátil (130ms):**
  - Botão de ação realiza expansão momentânea (`scale: 1.18`, `back.out(2.5)`).
  - Modal emite halo radiante (`boxShadow: 0 0 0 3px rgba(16, 185, 129, 0.9), 0 20px 50px rgba(16, 185, 129, 0.45)` para conclusão).
- **Fase 2: Ejeção Física e Descarte (280ms):**
  - Ejeção com inclinação acelerada (`x: -140`, `y: -30`, `rotation: -6deg`, `scale: 0.8`, `opacity: 0`, curva `power3.in`).
  - Backdrop fade-out (`opacity: 0`, 260ms, curva `power2.inOut`).
- **Fase 3: Finalização:**
  - Execução de `onComplete()`, que remove o ID da tarefa selecionada e aciona a mutação assíncrona do servidor.

### B. Integração no Componente Principal ([`src/app/components/DashboardContent.tsx`](../src/app/components/DashboardContent.tsx))
- **Assinatura de `handleToggleTask` Expandida:** Adicionado o parâmetro booleano opcional `closeDetailModal: boolean = false`.
  - Quando disparado a partir do quadro de tarefas, mantém o comportamento padrão de animação no card sem interferir em modais.
  - Quando disparado a partir do modal de detalhes (`closeDetailModal: true`), captura os elementos `#task-detail-modal` e `#task-detail-backdrop`, executa `animateModalCompleteExit` e só então fecha a janela e persiste o novo status.
- **Botão de Exclusão do Modal Reforçado:** A exclusão de tarefas de dentro do modal também recebeu `animateItemExit(modalEl)`, garantindo coerência em todas as saídas de tela.

---

## 4. Verificação e Resultados

1. **Compilação de Produção:** Executado `npx next build` com Turbopack e TypeScript, compilado com 100% de sucesso sem qualquer erro de tipagem ou lint.
2. **Validação da Interação:**
   - Ao abrir uma tarefa pendente e clicar em **"Concluir"**: o botão dá um pop tátil, a janela emite o halo verde esmeralda de vitória, é arremessada lateralmente com leve inclinação física e se fecha suavemente, revelando o quadro de tarefas com o item concluído.
   - Ao clicar em **"Excluir"**: a janela realiza a antecipação em vermelho e descarte físico limpo.
