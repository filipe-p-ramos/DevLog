# Memorial Técnico — 02: Adaptação de Responsividade Mobile (Touch-First UX)

## 1. Visão Geral
Esta atualização transformou o **Project Notes** em uma aplicação totalmente responsiva e ergonômica para dispositivos móveis (smartphones Android e iPhones/iOS), sem degradar ou alterar a experiência do usuário no desktop.

---

## 2. Problemas Identificados e Soluções Arquiteturais

### 2.1. Navegação de Conteúdo em Duas Colunas (Desktop vs. Mobile)
- **Cenário Anterior:** O dashboard dividia Tarefas (coluna esquerda) e Notas/Post-its (coluna direita) lado a lado em `xl:grid-cols-2`. Em telas menores, as colunas ficavam empilhadas verticalmente dentro de um container com `overflow-hidden`, tornando a coluna de notas invisível ou cortada.
- **Solução Implementada:** 
  - Introdução de um **Mobile View Switcher** (`mobileTab: 'tasks' | 'notes'`) exibido apenas em telas menores que `xl` (`xl:hidden`).
  - No mobile, o usuário pode alternar instantaneamente entre `[ 📋 Tarefas ]` e `[ 📝 Notas ]`, com contadores dinâmicos de itens.
  - Em telas de desktop (`xl:` e acima), ambas as colunas continuam sendo exibidas lado a lado simultaneamente (`xl:flex`).

### 2.2. Eliminação da Dependência de Hover (`group-hover`)
- **Cenário Anterior:** Botões de ação como "Editar Tarefa", "Excluir Tarefa", "Editar Nota", "Excluir Nota", "Editar Andamento", "Excluir Andamento" e "Reordenar Projetos" usavam `opacity-0 group-hover:opacity-100` ou `hidden group-hover:flex`. Em telas de toque (touchscreens), eventos de hover não existem de forma contínua, impossibilitando o gerenciamento pelo celular.
- **Solução Implementada:**
  - Aplicação da estratégia responsiva `opacity-100 lg:opacity-0 lg:group-hover:opacity-100`.
  - Na barra lateral (Sidebar), inclusão de menu de opções acionável por toque (`MoreVertical`) para cada projeto.
  - No modal de detalhes da tarefa, inclusão explícita do botão de exclusão de tarefa, antes inexistente fora dos cards.

### 2.3. Registro de Andamento (Logs) Touch-Friendly
- **Cenário Anterior:** O registro de andamento dependia exclusivamente de pressionar a tecla `Enter` física em um `<textarea>` não controlado. Em celulares, o teclado virtual apenas gerava quebras de linha e não havia botão de submissão na interface.
- **Solução Implementada:**
  - Transição para estado controlado `newLogContent`.
  - Implementação da função `handleCreateLog()`.
  - Adição de um botão primário com ícone `Send` ("Registrar Andamento"), com estado desabilitado inteligente e feedback visual. A tecla `Enter` física continua suportada no desktop.

### 2.4. Viewport e Prevenção do Zoom Automático no iOS
- **Cenário Anterior:** Falta de configuração explícita de `viewport` no `layout.tsx` e campos de entrada de texto com tamanhos menores que 16px (`text-xs` / `text-sm`), fazendo com que o Safari no iPhone desse zoom involuntário a cada toque no campo.
- **Solução Implementada:**
  - Exportação da constante `viewport: Viewport` no [`src/app/layout.tsx`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/layout.tsx) com `width: "device-width", initialScale: 1, maximumScale: 5`.
  - Adequação dos inputs e textareas para `text-base sm:text-sm` em todos os modais.
  - Adição de `-webkit-tap-highlight-color: transparent` e `touch-action: manipulation` no [`src/app/globals.css`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/globals.css) para respostas imediatas ao toque.

### 2.5. Modais e Efeitos Visuais
- **Cenário Anterior:** O modal de notas amarelas possuía rotação CSS (`-rotate-1`), espaçamento fixo de 40px no topo e `p-10`, cortando o conteúdo em telas estreitas de smartphones.
- **Solução Implementada:**
  - Modais com preenchimento adaptativo (`p-3 sm:p-4` externo e `p-5 sm:p-8` interno).
  - Rotações decorativas desativadas em telas mobile (`rotate-0 sm:-rotate-1`) e reativadas a partir de `sm`.
  - Modal de detalhes ajustado para comportamento bottom-sheet em telas pequenas (`h-[92vh] rounded-t-[28px] sm:rounded-[32px] sm:h-auto sm:max-h-[90vh]`).

### 2.6. Contenção de Overflow Horizontal e Resolução de Issues (React/Next.js)
- **Cenário Anterior:**
  - O Next.js exibia um badge vermelho com **"2 Issues"** no canto inferior esquerdo devido a acesso a variáveis de estado antes da sua declaração no evento `Escape` (`react-hooks/immutability`) e execução de `setState` síncrono no `useEffect` de sincronização de tarefas (`react-hooks/set-state-in-effect`).
  - No mobile, a tela cortava textos na borda direita e empurrava o switcher e botões para fora da área visível porque a tag flex `<main>` e elementos filhos não possuíam `min-w-0` (por padrão `min-width: auto` no flexbox expande para a largura intrínseca dos filhos).
- **Solução Implementada:**
  - **Zero Issues:** Todos os `useState` foram unificados no topo do componente, eliminando qualquer TDZ. O estado `selectedTaskForDetail` foi substituído por derivação pura reativa com `useMemo` através de `selectedTaskId`, eliminando o `useEffect` síncrono.
  - **Largura e Quebra de Texto Estritas:** Aplicação de `min-w-0 w-full max-w-full overflow-x-hidden` no `<main>`, header, colunas e cards de tarefas.
  - **Refatoração do Switcher Mobile:** Substituído `grid grid-cols-2` por container flex com `flex-1`, `truncate` e badges de tamanho compacto, garantindo alinhamento perfeito de `[ Tarefas ]` e `[ Notas ]` em qualquer largura de tela.
  - **Quebra de Palavras:** Títulos e descrições configurados com `[overflow-wrap:anywhere] break-words`, impedindo que textos longos forcem o alargamento do card.
  - **Correção de Hidratação (HTML Nesting):** O container do projeto na sidebar estava como `<button>` e abrigava o botão de opções mobile dentro dele (`<button> cannot be a descendant of <button>`). Foi refatorado para `<div>` contendo o botão de seleção e o botão de menu lado a lado como irmãos.

---

## 3. Arquivos Modificados
- [`src/app/layout.tsx`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/layout.tsx): Inclusão da diretiva `viewport`.
- [`src/app/globals.css`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/globals.css): Otimização de toques e tap-highlight.
- [`src/app/components/DashboardContent.tsx`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/components/DashboardContent.tsx): Refatoração completa de layout, header, colunas, switcher mobile, contenção de largura, eliminação de warnings de hooks e modais touch-friendly.
- [`HISTORICO.md`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/HISTORICO.md): Registro da evolução e arquitetura.
