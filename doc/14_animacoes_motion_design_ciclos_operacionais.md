# Plano de Implementação: Animações Motion Design nos 6 Ciclos Operacionais

## 1. Contexto e Objetivos
A experiência de uso do **DevLog** foi elevada ao padrão cinematográfico com a implementação de coreografias físicas e visuais para todos os eventos de ciclo de vida de dados (CRUD) da aplicação:
1. Criar uma nota
2. Criar uma tarefa
3. Editar uma tarefa ou nota
4. Excluir uma tarefa ou nota
5. Incluir um registro (andamento/log) numa tarefa
6. Concluir ou reabrir uma tarefa

Todas as animações foram criadas respeitando integralmente as diretrizes e tabelas da skill **`motion-design`** (Três Pilares, Três Camadas de Movimento, física crível de amortecimento e respeito a `prefers-reduced-motion`).

---

## 2. Tabela de Especificação Técnica de Movimento

| Evento / Ciclo | Camada Primária (*Primary Layer*) | Camada Secundária (*Secondary Layer*) | Curva de Easing | Duração |
|---|---|---|---|---|
| **1. Criar Nota** | Queda com balanço e assentamento elástico de post-it (`y: -80 -> 0`, rotação aleatória de 5° a 11°, `scale: 0.65 -> 1.0`) | Halo dourado expansivo de celebração + fixação elástica da fita adesiva (`scaleY/X` com `elastic.out(1.2, 0.4)`) | `back.out(2.2)` + `power2.out` | 600ms + 800ms |
| **2. Criar Tarefa** | Entrada vertical contundente (`y: -60 -> 0`, `scale: 0.78 -> 1.0`) com auto-scroll inteligente | Feixe luminoso radiante (*glow pulse*) expansivo ao redor de todo o card na cor tema do projeto | `back.out(1.8)` + `power2.out` | 550ms + 900ms |
| **3. Editar Tarefa / Nota** | "Bump" elástico com expansão perceptível (`scale: 1.05 -> 1.0`) | Halo âmbar cintilante de confirmação (`boxShadow: 0 0 0 4px rgba(245, 158, 11, 0.9)`) com amortecimento vibrante | `power2.out` -> `elastic.out(1.1, 0.4)` | 220ms + 550ms |
| **4. Excluir Tarefa / Nota** | Antecipação com recuo e halo vermelho de perigo (120ms), seguida de arremesso vigoroso para fora da tela com rotação (`x: -140`, `-9°`, `scale: 0.7`) | Recolhimento suave da altura (`height: 0`, margens zeradas) liberando o espaço de forma limpa | `power1.out` -> `power3.in` -> `power2.out` | 120ms + 280ms + 200ms |
| **5. Adicionar Andamento (Log)** | Revelação vertical ascendente com escala (`y: 50 -> 0`, `scale: 0.8 -> 1.0`) e scroll automático até o novo item | Pulso de iluminação da linha do tempo na cor de destaque do projeto | `back.out(2.0)` + `power2.out` | 500ms + 700ms |
| **6. Concluir / Reabrir Tarefa** | Checkmark pop gigante (`scale: 1.6`, rotação -45° a 0°) | Flash esmeralda radiante emitido por **todo o card da tarefa** (`boxShadow: 0 0 0 4px rgba(16, 185, 129, 0.9)`) | `back.out(3.0)` + `elastic.out(1.1, 0.4)` | 220ms + 650ms |

---

## 3. Módulo Centralizado (`src/lib/motion.ts`)

O módulo foi estruturado com funções tipadas e reutilizáveis, garantindo fidelidade cromática absoluta à cor do projeto ativo (ex: Laranja) e ao tema âmbar:
- `resolveColor(inputColor?: string, alpha: number)`: Conversor algorítmico seguro que trata valores hex e rgb com fallbacks estritos em laranja vibrante (`#f97316`) e âmbar (`#f59e0b`), eliminando completamente vazamentos de tons azuis (`#6366f1` / `#3b82f6`).
- `animateNoteEntrance(element: HTMLElement | null)`: Executa auto-scroll, queda física do post-it, rotação elástica e assentamento com halo dourado/âmbar.
- `animateTaskEntrance(element: HTMLElement | null, projectColor?: string)`: Entrada e onda luminosa expansiva ao redor do card estritamente na cor do projeto (ex: Laranja).
- `animateItemUpdate(element: HTMLElement | null, projectColor?: string)`: Flash de feedback de edição de alta visibilidade com bump tátil e halo na cor do projeto ou âmbar.
- `animateItemExit(element: HTMLElement | null, onComplete: () => void)`: Antecipação em alerta vermelho e arremesso de descarte acelerado antes de acionar o Server Action.
- `animateLogEntrance(element: HTMLElement | null, projectColor?: string)`: Entrada ascendente na timeline com foco visual e feixe luminoso na cor do projeto.
- `animateTaskToggle(cardElement: HTMLElement | null, buttonElement: HTMLElement | null, isCompleted: boolean, onComplete?: () => void)`: Dispara celebração visual com halo esmeralda em todo o card e pop gigante no botão de status.
- `isReducedMotion()`: Verificação automática de preferência de acessibilidade do sistema operacional (`prefers-reduced-motion: reduce`).

---

## 4. Integração nos Componentes

No arquivo [`src/app/components/DashboardContent.tsx`](../src/app/components/DashboardContent.tsx):
- **Passagem Dinâmica da Cor do Projeto:** O componente obtém `selectedProject?.color` e o injeta diretamente nos gatilhos de `animateTaskEntrance`, `animateLogEntrance` e `animateItemUpdate`.
- **Sincronização Reativa Precisa:** Utilização de `useRef<Set<string>>` para rastrear determinística e atomicamente a chegada de novos IDs de notas, tarefas e logs após o retorno das Server Actions, evitando erros de índice causados por reordenação ou filtros.
- **Saída Física Dramática:** `handleDeleteTask` e `handleDeleteNote` executam a antecipação vermelha e ejeção física antes de disparar o `startTransition`, garantindo que o usuário veja o descarte sem cortes abruptos.
- **Celebração em Tarefa Concluída:** Ao clicar em concluir tanto no quadro quanto dentro do modal de detalhes, a animação atua no card inteiro e no botão sem fechar bruscamente a interface, transmitindo satisfação tátil (*juice*).

