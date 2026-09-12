# Memorial Técnico: Marco 10 — Animações Profissionais com GSAP (Hero & Header Reveal)

**Data:** 11/09/2026  
**Status:** Concluído (Incremento Estável)  
**Escopo:** Frontend / UX / Animações de Alta Fidelidade  
**Arquivos Impactados:**  
- `package.json`
- `src/app/components/DashboardContent.tsx`
- `src/app/login/page.tsx`
- `HISTORICO.md`

---

## 1. Motivação e Objetivos

O **DevLog** foi concebido com foco em alta densidade de informação e ergonomia para o desenvolvedor. Para proporcionar uma experiência de uso extremamente fluida, moderna e com estética *state-of-the-art*, integrou-se a suíte oficial de animações **GSAP (GreenSock Animation Platform)** com o pacote oficial `@gsap/react`.

O objetivo primário desta intervenção foi implementar:
1. **Hero & Welcome Screen Reveal:** Transição de entrada suave e cinematográfica na tela inicial de boas-vindas (quando nenhum projeto está selecionado).
2. **Project Header & Toolbar Reveal:** Revelação sequencial do cabeçalho do projeto ativo, incluindo indicador visual, filtros contextuais de tags e abas de status.
3. **Board Stagger & Transitions:** Entrada suave dos cards de tarefas e notas adesivas ao alternar entre projetos ou filtros de status.
4. **Login Screen Reveal:** Recepção cinematográfica na tela de autenticação (`/login`), animando logo e formulário de acesso restrito.

---

## 2. Decisões Arquiteturais e Padrões das Skills GSAP

Seguindo as diretrizes oficiais das skills instaladas (`gsap-react`, `gsap-core`, `gsap-timeline`):

### 2.1. Uso Obrigatório do Hook `useGSAP()`
Em aplicações modernas React 19 e Next.js (App Router), o uso desavisado de `useEffect()` para animações frequentemente resulta em:
- **Memory Leaks (Vazamentos de Memória):** Tweens, timelines e *listeners* continuam ativos no background após a desmontagem do componente.
- **Hydration & SSR Mismatch:** Falhas de sincronia entre o HTML pré-renderizado pelo servidor e os nós manipulados no cliente.
- **Conflito de Escopo:** Seletores CSS genéricos acidentalmente capturando elementos fora do componente renderizado.

Com o `useGSAP({ scope: containerRef })`:
- Todas as timelines criadas são automaticamente vinculadas ao nó raiz (`scope`).
- O ciclo de vida do GSAP invoca automaticamente `ctx.revert()` na desmontagem ou re-renderização, restaurando propriedades e limpando timers.

### 2.2. Aceleração de Hardware e `autoAlpha`
- **Substituição de Layout Shifts por Transforms:** Em vez de propriedades custosas de recálculo de layout (*reflow*) como `top`, `left` ou `margin`, foram utilizadas estritamente propriedades compostas na GPU (`y`, `x`, `scale`).
- **`autoAlpha`:** Combinação atômica de `opacity` e `visibility`. Evita que elementos transparentes permaneçam clicáveis ou bloqueiem a interação do usuário enquanto invisíveis.
- **`clearProps: "all"` / `clearProps: "transform"`:** Limpeza dos estilos *inline* injetados pelo GSAP ao término da animação, permitindo que classes utilitárias CSS e efeitos nativos de `:hover` reassumam o controle total sem conflito de especificidade.

### 2.3. Acessibilidade (`prefers-reduced-motion`)
Todas as timelines verificam a diretiva de acessibilidade:
```ts
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (prefersReducedMotion) return;
```
Garantindo conforto e segurança para usuários com sensibilidade vestibular.

### 2.4. Estabilidade do Turbopack e Next.js (`transpilePackages`)
Configurado no `next.config.ts` o parâmetro `transpilePackages: ["gsap", "@gsap/react"]`. Isso instrui o compilador nativo do Turbopack a transpilar adequadamente os módulos ESM/CJS do GreenSock, evitando erros de empacotamento em tempo de desenvolvimento. Para a tela de login (`/login`), optou-se por transições puras via CSS nativo (`animate-in fade-in`), eliminando qualquer risco de concorrência ou pânico no SSR durante o ciclo de autenticação.

---

## 3. Implementações Específicas

### 3.1. Tela de Boas-Vindas (`welcomeRef`)
- **Badge do Logotipo:** Efeito de elasticidade suave com `ease: "back.out(1.7)"` (`scale: 0.75 -> 1`, `duration: 0.65s`).
- **Textos de Boas-Vindas:** Deslizamento vertical com `ease: "power3.out"`.
- **Cards de Atalho Rápido ("Novo Projeto" e "Ver Projetos"):** Entrada sequencial escalonada (`stagger: 0.1s`).
- **Botão CTA ("Começar Agora"):** Revelação elástica com `back.out(1.5)`.

### 3.2. Header do Projeto Selecionado (`headerRef`)
- **Identificação do Projeto:** Título, status e badge deslizam suavemente da esquerda (`x: -16 -> 0`).
- **Controles e Alternadores:** Botões de layout (Card/Lista), tema (Claro/Escuro) e configurações entram em contrapartida (`x: 16 -> 0`).
- **Pílulas de Tags Contextuais:** Efeito cascata (`stagger: 0.03s`, `y: 8 -> 0`).
- **Abas de Status (Pendentes / Concluídas):** Revelação suave com `autoAlpha`.

### 3.3. Grade de Tarefas e Notas Post-it (`boardRef`)
- Reatividade a mudanças em `[selectedProjectId, statusFilter, selectedTag]`.
- As tarefas entram com `y: 12 -> 0` e `stagger: 0.035s`.
- **Correção da Cor dos Post-its:** Substituído `clearProps: "all"` por `clearProps: "transform,opacity,visibility"`, preservando integralmente o estilo `backgroundColor` inline dos blocos de notas.
- **Restauração da Identidade Visual:** Cores amarelas pastéis suaves e equilibradas (`#fef3c7` amarelo suave e `#fde68a` âmbar claro), borda adesiva superior sutil (`border-amber-200/60`), tipografia de alto contraste (`text-amber-950`) e fita adesiva fosca translúcida (`bg-white/45`).
- **Alinhamento em Grade Limpa:** Remoção de rotações desiguais (`-rotate-2`, `rotate-1`), garantindo perfeita simetria e legibilidade em grid de 2 colunas.
- **Reordenação por Arraste (Drag-and-Drop):** Implementação de eventos nativos HTML5 (`onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`) com persistência da ordem no `localStorage` por projeto (`devlog_notes_order_{projectId}`).
- **Eliminação de Avisos de Console:** Supressão de `GSAP target not found` com `gsap.config({ nullTargetWarn: false })` e checagem de nós antes de animar.

### 3.4. Tela de Autenticação (`/login`)
- Logotipo e formulário estilizados com animação nativa suave via CSS Tailwind (`animate-in fade-in`), garantindo arranque instantâneo e estabilidade no SSR do Turbopack.

### 3.5. Modal de Detalhes da Tarefa e Acessibilidade Visual
- **Backdrop Global Unificado (`z-[80]`):** Elevação da camada do modal de tarefa para cobrir completamente tanto o painel principal quanto a barra lateral de projetos (`<aside>` em `z-[70]`), promovendo foco total sobre a tarefa aberta com desfoque de fundo (`backdrop-blur-md`).
- **Botão Excluir Otimizado:** Aplicação de `text-red-700 dark:text-red-400` com borda e preenchimento calibrados, eliminando a perda de contraste no tema sépia claro.

---

## 4. Validação Técnica
- **Compilação de Tipos:** `npx tsc --noEmit` validado sem erros (Código de saída: 0).
- **Build de Produção:** `npm run build` gerou artefatos estáticos e dinâmicos sob Turbopack sem falhas ou regressões.
