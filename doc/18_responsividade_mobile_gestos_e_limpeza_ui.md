# Memorial Técnico — Marco 18: Responsividade Mobile (Dynamic Viewport), Proteção de Gestos e Limpeza de UI

## 1. Contexto e Motivação
Em testes práticos em dispositivos móveis Android utilizando o Google Chrome com agrupamento de guias (*tab groups*), foram identificadas duas anomalias de usabilidade e uma redundância visual:

1. **Modal de Detalhes Cortado no Topo:** Quando o Chrome exibe o grupo de guias na base da tela (barra branca de abas) em conjunto com a barra de endereços no topo, a área visível real (*dynamic viewport*) sofre uma redução substancial de mais de 100px. O modal de detalhes da tarefa utilizava `h-[92vh]` com alinhamento na base (`items-end`). Como a unidade `vh` mede a altura do display desconsiderando as barras dinâmicas do navegador (*large viewport*), o modal empurrava o cabeçalho para além do topo visível da tela, ocultando os botões de fechar, editar, excluir e concluir tarefas.
2. **Conflito no Gesto de Voltar do Android (Swipe da Esquerda para a Direita):** Ao tentar fechar um modal ou retornar na navegação através do gesto nativo do Android (arrastar a partir da borda esquerda), três problemas concorrentes ocorriam:
   - Os modais e a barra lateral não estavam sincronizados com o histórico do navegador (`window.history`), fazendo com que o navegador navegasse de volta na rota anterior em vez de fechar o modal aberto.
   - O ponto de início do toque do usuário encostava involuntariamente no botão do menu hambúrguer (`<Menu />`) posicionado no canto superior esquerdo, disparando sua abertura em pleno gesto de arrasto.
   - Conforme a barra lateral animava abrindo para a direita sob o dedo do usuário, o evento de soltura do toque (`touchend`) atingia os botões da lista de projetos, selecionando acidentalmente outro projeto.
3. **Engrenagem Redundante na Barra Lateral:** Havia um botão com ícone de engrenagem (`Settings`) no cabeçalho da sidebar ao lado do botão de logout, duplicando a mesma funcionalidade já existente de forma fixa e oficial no canto superior direito do cabeçalho principal.

---

## 2. Decisões Técnicas e Ações Realizadas

### A. Limpeza de UI e Eliminação de Redundância
- **Remoção da Engrenagem da Sidebar (`DashboardContent.tsx`):** Removido o botão redundante de configurações posicionado no topo da barra lateral esquerda, mantendo no cabeçalho da sidebar exclusivamente o controle de logout e o botão de fechar para dispositivos móveis. A central de configurações e segurança permanece consolidada no cabeçalho superior direito da aplicação.

### B. Calibração de Dynamic Viewport (`dvh`) e Margens de Segurança
- **Redimensionamento do Modal de Detalhes (`#task-detail-modal`):**
  - Substituição da unidade estática `h-[92vh]` por Dynamic Viewport Height calculado: `h-[calc(100dvh-3.5rem)] sm:h-auto sm:max-h-[88dvh] max-h-[calc(100dvh-3.5rem)]`.
  - Configuração do container pai com `h-[100dvh] max-h-[100dvh]`.
  - Essa calibração garante que o topo do modal sempre preserve uma folga mínima de `3.5rem` (56px) abaixo de qualquer barra de navegação ativa do navegador, mantendo o cabeçalho com botões de fechar, editar, excluir e concluir tarefas 100% visíveis, funcionais e com cantos arredondados impecáveis.
  - Inclusão de espaçamento defensivo de base: `pb-[max(env(safe-area-inset-bottom),0.5rem)]`, prevenindo sobreposição com a barra de guias ou indicador de gestos do sistema operacional.
- **Harmonização dos Demais Modais:** Os modais de Nova Tarefa, Nova Nota e Configurações da Conta foram ajustados para `max-h-[90dvh]` com barra de rolagem interna suave (`overflow-y-auto`), assegurando usabilidade consistente inclusive em aparelhos com teclado virtual aberto.

### C. Blindagem de Gestos de Navegação e Prevenção de Ghost-Clicks
- **Sincronização com o Histórico Nativo (`History Popstate`):**
  - Implementado listener reativo que, ao abrir qualquer overlay (modal de detalhes, tarefas, notas, configurações ou a sidebar móvel), empilha um estado defensivo no histórico via `window.history.pushState({ devlogOverlay: true }, "")`.
  - Ao detectar o evento `popstate` (disparado pelo gesto nativo de voltar do Android ou tecla física de retorno), o sistema intercepta a navegação e fecha prioritariamente o overlay aberto, mantendo o usuário exatamente no projeto atual sem recarregar ou descaracterizar a aplicação.
- **Filtro de Swipe no Botão do Menu Hambúrguer:**
  - Registradas coordenadas de toque via `onTouchStart` e `onTouchEnd`. Se a distância percorrida no eixo horizontal pelo toque exceder 12 pixels (`diff > 12`), o evento é identificado como um gesto de navegação do sistema/navegador e o clique de abertura do menu é bloqueado preventivamente.
- **Proteção Transitória Anti-Ghost-Click na Sidebar:**
  - Criado o estado `isSidebarTransitioning` disparado na abertura da barra lateral via `openSidebar()`.
  - Durante os primeiros 300ms de animação de entrada da sidebar, a lista de projetos recebe a classe utilitária `pointer-events-none`. Isso impede fisicamente que um toque em deslizamento seja registrado como seleção de projeto involuntária.
- **Navegação de Projetos via `router.replace`:**
  - A troca de projeto na função `handleSelectProject` foi migrada de `router.push` para `router.replace`, evitando o acúmulo desnecessário de históricos de URL que provocava loops de navegação reversa.
- **Desativação de Overscroll Horizontal (`globals.css`):**
  - Aplicada a propriedade `overscroll-behavior-x: none;` no `html` e `body`, eliminando o efeito de puxão e travamento horizontal característico do Chrome Mobile.

---

## 3. Arquivos Modificados
- `src/app/globals.css`: Adição de `overscroll-behavior-x: none`.
- `src/app/components/DashboardContent.tsx`:
  - Remoção do botão redundante de configurações da barra lateral.
  - Inserção do hook de sincronização com o histórico do navegador (`popstate`).
  - Implementação de `openSidebar` com trava de 300ms contra cliques acidentais (`pointer-events-none`).
  - Tratamento de touch horizontal no botão de menu móvel.
  - Troca para `router.replace` ao selecionar projetos.
  - Atualização dos modais com Dynamic Viewport (`dvh`).

---

## 4. Validação
- Compilação estática de tipos TypeScript via `npx tsc --noEmit` executada com sucesso e sem advertências.
- Compatibilidade validada com navegadores móveis (Chrome Mobile, Samsung Internet e Safari iOS).
