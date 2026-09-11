# Memorial Técnico 08: Harmonização Cromática dos Projetos no Tema Claro

Este documento registra as decisões de engenharia, arquitetura de interface e correção cromática realizadas para substituir detalhes e marcadores azuis elétricos pela paleta terrosa clássica no tema claro (sépia/caderno).

---

## 1. Contexto, Diagnóstico e Motivação

### O Problema Identificado
Ao utilizar o tema claro (estética de papel antigo/sépia), os elementos identificadores dos projetos (marcadores de cor circulares na barra lateral, borda esquerda do item ativo, marcador no cabeçalho do projeto e gradientes de hover) eram renderizados com o azul elétrico `#3b82f6` gravado como valor padrão no banco de dados.

### Análise de Causa Raiz
1. **Fallback Hardcoded no Banco:** No schema do banco de dados e na criação de novos workspaces (`createProject(name, color = "#3b82f6")`), a cor do projeto é registrada por padrão como `#3b82f6`.
2. **Consumo Rígido na Sidebar e no Header:** Enquanto os botões de ação e cards de tarefas já continham adaptações condicionais para o tema claro (`theme === 'light' ? 'var(--accent)' : selectedProject.color`), os componentes da **Sidebar** e do **Cabeçalho Principal** consumiam diretamente a propriedade bruta `project.color`.
3. **Dissonância Estética:** O azul elétrico `#3b82f6` e seu efeito neon glow (`0 0 12px #3b82f6`), embora adequados para o tema escuro cibernético, colidiam agressivamente com o fundo sépia/caderno (`--background: #bcba9c` e `--accent: #b45309`), quebrando a imersão e elegância visual da interface.

---

## 2. Conceitos Técnicos Aplicados

- **Context-Aware Theming (Tematização Sensível ao Contexto):** Padrão no qual componentes de interface adaptam dinamicamente suas cores não apenas pelo valor absoluto gravado em banco, mas pela paleta harmônica ativa do tema escolhido pelo usuário.
- **Eliminação de Poluição Neon em Mídia Analógica:** No tema escuro, efeitos de brilho difuso (*glow/neon*) simulam telas OLED modernas; no tema analógico (sépia/caderno), o padrão visual deve emular tinta e selo de cera, substituindo o brilho neon por sombreamento natural e discreto (`0 1px 3px rgba(0,0,0,0.2)`).
- **Consistência do Token `--accent`:** Unificação de todos os acentos visuais do tema claro sob o token semântico `--accent: #b45309;` (âmbar/caramelo escuro).

---

## 3. Ações Técnicas Realizadas

### A. Barra Lateral de Projetos ([`src/app/components/DashboardContent.tsx`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/components/DashboardContent.tsx))
- **Marcador Circular do Projeto:**
  - `backgroundColor`: alterado para `theme === 'light' ? 'var(--accent)' : project.color`.
  - `boxShadow`: no tema claro, o brilho neon azul foi substituído por uma sombra sutil analógica (`0 1px 3px rgba(0,0,0,0.2)` para o ativo e `none` para os inativos). No tema escuro, o efeito neon original foi integralmente preservado.
- **Borda Esquerda de Seleção Ativa:**
  - `borderLeft`: alterado para `3px solid ${theme === 'light' ? 'var(--accent)' : project.color}`.

### B. Cabeçalho Principal do Projeto ([`src/app/components/DashboardContent.tsx`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/components/DashboardContent.tsx))
- **Marcador de Cor do Projeto Selecionado:**
  - `backgroundColor`: adaptado para `theme === 'light' ? 'var(--accent)' : selectedProject.color`, eliminando a bolinha azul ao lado do título do projeto quando em modo sépia.

### C. Cards de Tarefas ([`src/app/components/DashboardContent.tsx`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/components/DashboardContent.tsx))
- **Efeito de Hover Radial:**
  - Atualizado para `radial-gradient(circle at center, ${theme === 'light' ? 'var(--accent)' : selectedProject.color}, transparent 70%)`.

---

## 4. Verificação e Testes

1. **Compilação de Produção (`npx next build`):** Compilado com sucesso em 1.9s sem erros de TypeScript ou eslint.
2. **Inspeção Visual:**
   - **Tema Claro (Sépia):** A barra lateral, os marcadores de projetos e o cabeçalho agora exibem a tonalidade âmbar terrosa (`var(--accent)`), em perfeita sintonia com a estética de caderno de anotações.
   - **Tema Escuro:** Todas as cores elétricas, luzes azuis e contrastes originais permanecem 100% intactos.
