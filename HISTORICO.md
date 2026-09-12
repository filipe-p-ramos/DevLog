# DevLog - Arquitetura e Histórico

## Arquitetura do Sistema

O **DevLog** foi projetado como uma aplicação web robusta, voltada para rastreio e acompanhamento de tarefas e anotações técnicas, implementada na stack **Next.js (App Router)** e hospedada na **Vercel**, consumindo **Supabase** via **Prisma ORM**.

### Stack Tecnológica
- **Framework Frontend/Backend:** Next.js (App Router)
- **Hospedagem:** Vercel (Edge/Serverless)
- **Banco de Dados:** PostgreSQL (Supabase)
- **Autenticação:** Supabase Auth
- **ORM:** Prisma (Modo Transaction para Serverless)
- **Estilização:** Tailwind CSS

### Decisões Arquiteturais e Padrões (Security & Performance)
1. **Server Components (RSC):** O padrão principal no Next.js App Router para renderizar páginas do lado do servidor e reduzir a carga de JS no cliente (brutalidade em performance).
2. **Server Actions:** Todas as mutações (criar projeto, criar tarefa, adicionar anotação) ocorrerão via Server Actions rodando exclusivamente em backend protegido.
3. **Padrão de Autenticação RLS (Row Level Security):** Mesmo operando via ORM (Prisma), recomendaremos RLS ativada nas tabelas do Supabase em nível de banco de dados para evitar vazamentos laterais.
4. **Sanitização de Dados:** Integração do fluxo Server Action em Try/Catch evitando bloqueios da thread e garantindo respostas com tipagem padronizada (Schema).

## Esquema do Banco de Dados (PostgreSQL)
A base de dados será orquestrada via schema prisma:
- **`projects`**: Controle de projetos do usuário.
- **`tasks`**: Demandas/Kanban ligadas ao projeto.
- **`logs`**: Histórico detalhado por tarefa (`note`, `blocker`, `decision`, `done`).

---
## Etapas do Projeto

- [x] Criação do boilerplate Next.js
- [x] Instalação e configuração inicial Prisma ORM
- [x] Rascunho inicial do esquema do Banco de Dados
- [x] Configuração do Supabase (Database/Auth)
- [x] Implementação de Estrutura de Componentes Base (Sidebar, Listas, LogCards)
- [x] Criação de Actions e Fluxos de CRUD
- [x] Implementação de Busca por Palavras-Chave (Título, Descrição e Logs)

---
## Histórico de Evolução - DevLog

## [2026-04-25] - Correção de Build (Vercel)
- **Correção de Tipagem (TypeScript):** Resolvido erro de compilação no Vercel onde a propriedade `title` estava sendo passada diretamente para o componente `Plus` da Lucide React.
  - *Causa:* Componentes Lucide não aceitam `title` nativamente em suas props.
  - *Solução:* O ícone foi envolvido em um elemento `<span>` com o atributo `title`, preservando o tooltip de acessibilidade sem violar as regras de tipagem.
- **Auditoria de Build:** Verificado o restante do arquivo `DashboardContent.tsx` e `page.tsx` para garantir que outros `title` estejam aplicados apenas a elementos HTML nativos (`button`, `input`).

## [2026-04-25] - Sistema de Reordenamento e Initial State Modos de Visualização
- **Funcionalidade:** Adicionado campo de busca inteligente e alternador de visualização (Modo Card vs. Modo Lista).
- **Técnica:** 
    - Filtragem no lado do cliente para busca instantânea.
    - Estado de UI para alternar entre componentes de renderização de tarefas (Card/Lista).
- **Design:** 
    - Modo Lista: Compacto, otimizado para alta densidade de informação (estilo Windows Explorer).
    - Modo Card: Visual rico com foco em mídia e logs detalhados.
    - Controles integrados no header com ícones `lucide-react`.

## [2026-04-28] - Automação e Início de Ambiente
- **Automação:** Criado o script `iniciar.bat` na raiz do projeto para facilitar o arranque do ambiente (verificação de `node_modules` e execução do servidor).
- **Execução:** Servidor de desenvolvimento Next.js iniciado com sucesso.

## [2026-04-28] - Ajuste de Ordenação por Atividade Recente
- **Funcionalidade:** Implementada a ordenação dinâmica de tarefas e notas por `updatedAt` (data de atualização).
- **Lógica de Backend:**
    - Modificado `getTasks` e `getNotes` para utilizar `orderBy: { updatedAt: "desc" }`.
    - Atualizadas as actions de `Log` (`createLog`, `updateLog`, `deleteLog`) para forçar a atualização do campo `updatedAt` na tarefa pai via Prisma, garantindo que qualquer interação com andamentos mova a tarefa para o topo da lista.

---

### [2026-05-29] - Marco 01: Nova Identidade Visual e Favicon Dinâmico (DevLog)
- **Status / Objetivo / Motivação:** Concluído (Incremento Estável). Padronização estética profissional e eliminação de designs secos sem ícones, proporcionando a experiência premium exigida pelo padrão visual moderno.
- **Decisões Técnicas / Ações Realizadas:**
  - **Criação de Logo Proprietário (Tech/Dev Theme):** Gerado um logotipo sob medida focado em desenvolvimento e rastreamento de tarefas (símbolos de chaves de código e checklist minimalista) em tons de azul escuro, ciano e cinza grafite.
  - **Estruturação de Pastas & Assets:**
    - Criado o diretório estático `public/` (inexistente no boilerplate inicial) para hospedar `logo-devlog.png` ($1024 \times 1024$px com zoom máximo e apenas 5% de margem útil para máxima visibilidade e legibilidade).
    - Copiado o asset para `src/app/icon.png` habilitando o roteador de favicons automáticos do Next.js App Router.
  - **Integração Visual Estrita:**
    - **Sidebar Header** (`DashboardContent.tsx`): Integrada a imagem do novo logotipo em um container arredondado de bordas finas com transição suave de escala em `hover` ao lado do título principal "Project Notes".
    - **Tela de Login** (`login/page.tsx`): Substituído o ícone de cadeado genérico (`LockKeyhole`) pelo logotipo oficial centralizado na tela de acesso, trazendo consistência visual desde o primeiro instante de acesso.
- **Documentação Relacionada:** [doc/01_icone_identidade_visual.md](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/doc/01_icone_identidade_visual.md)

---

### [2026-06-03] - Marco 02: Adaptação Completa para Responsividade Mobile (Touch-First UX)
- **Status / Objetivo / Motivação:** Concluído (Incremento Estável). Acesso 100% funcional, fluído e confortável a partir de qualquer smartphone Android ou iPhone sem comprometer o layout desktop.
- **Decisões Técnicas / Ações Realizadas:**
  - **Navegação Adaptativa (Mobile Switcher):** Implementado controle em abas (`xl:hidden`) para alternar fluidamente entre `[ 📋 Tarefas ]` e `[ 📝 Notas ]` no mobile, mantendo a visão de duas colunas intacta no desktop (`xl:flex`).
  - **Eliminação de Dependência de Hover:** Botões de ação (editar, excluir, reordenar) tornados visíveis e acessíveis em dispositivos de toque (`opacity-100 lg:opacity-0 lg:group-hover:opacity-100`), com menu touch (`MoreVertical`) para projetos na sidebar.
  - **Envio de Andamento Ergonômico:** Campo de andamentos refatorado com estado controlado e botão primário com ícone `Send` para submissão imediata por toque no smartphone, mantendo suporte ao `Enter` físico no desktop.
  - **Ajuste de Viewport e Zoom iOS:** Adicionada diretiva `viewport` com escala controlada no `layout.tsx`, inputs padronizados para evitar o auto-zoom do Safari mobile e uso de `100dvh` para prevenção de quebras por barras de navegação do browser.
  - **Otimização de Modais:** Modais de projeto, tarefa e notas reconfigurados com paddings responsivos (`p-3/p-5`), rotação de post-its desativada em telas estreitas e modal de detalhes em formato bottom-sheet móvel.
  - **Contenção Estrita de Largura e Quebra de Texto:** Inclusão de `min-w-0 w-full max-w-full overflow-x-hidden` e eliminação de warnings de renderização no React/Next.js.
- **Documentação Relacionada:** [doc/02_responsividade_mobile.md](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/doc/02_responsividade_mobile.md)

---

### [2026-09-11] - Marco 03: Autenticação Segura com Senhas Individuais e Purga de Dados
- **Status / Objetivo / Motivação:** Concluído com sucesso. Eliminação da autenticação vulnerável baseada em senha global estática no `.env` (`APP_PASSWORD`) e fallback hardcoded `"123"`. Implementação de senhas individuais por usuário com hash criptográfico `bcrypt`, mantendo a aplicação estritamente privada (projeto pessoal fechado, sem telas de cadastro público) e realizando a purga definitiva de dados obsoletos.
- **Decisões Técnicas / Ações Realizadas:**
  - **Cibersegurança (Bcrypt & Salt):** Integração de `bcryptjs` para geração e comparação de hashes com salt rounds de fator 10.
  - **OWASP Compliance:** Server Action `loginWithPassword` padronizada com retorno de erro uniforme `"Credenciais inválidas"` para mitigar enumeração de contas (*User Enumeration*).
  - **Banco de Dados (Prisma & Supabase):** Adicionado campo `password` ao model `User` e configuração de `onDelete: Cascade` nas relações `User -> Project` e `User -> TagConfig`.
  - **Purga de Dados:** Remoção completa e irreversível do usuário `raphael` e todos os seus registros atrelados (1 projeto, 3 tarefas, 2 notas, tags), além do usuário residual `user@projectnotes.local`.
  - **Preservação de Dados:** Dados do usuário `filipe` preservados com 100% de integridade (6 projetos, 71 tarefas, notas e tags intactas).
  - **Operação & CLI:** Criação do script administrativo `node scripts/set-password.js <usuario> <senha>` e atalho `npm run user:password`.
  - **Variáveis de Ambiente:** Remoção da variável vulnerável `APP_PASSWORD` de `.env` e `config.env`.
- **Documentação Relacionada:** [doc/03_autenticacao_senhas_individuais.md](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/doc/03_autenticacao_senhas_individuais.md)

---

### [2026-09-11] - Marco 04: Padronização e Unificação de Tags em Caixa Alta (UPPERCASE)
- **Status / Objetivo / Motivação:** Concluído com sucesso (Incremento Estável). Eliminação da fragmentação na barra de filtros e no agrupamento de tarefas originada por variações de capitalização (ex: `URGENTE` e `Urgente`, `BUG` e `Bug`). Padronização compulsória de todas as tags em maiúsculas tanto na interface quanto no backend e banco de dados.
- **Decisões Técnicas / Ações Realizadas:**
  - **Migração e Sanitização de Banco de Dados:** Executado o script idempotente `scripts/migrate_tags_uppercase.js`, atualizando 58 tarefas para converter todas as tags para caixa alta (`.toUpperCase()`) e deduplicar arrays no PostgreSQL, além de padronizar as configurações de cores na tabela `TagConfig`.
  - **Proteção no Backend (Server Actions):** Implementada a função utilitária `sanitizeTags` em `src/app/actions/tasks.ts`, sanitizando e deduplicando tags em `createTask` e `updateTask`. Normalização em maiúsculas aplicada em `updateTagColor` (`src/app/actions/tags.ts`).
  - **Interface & Experiência de Usuário (Frontend):** Atualizado `DashboardContent.tsx` com input de tags em `uppercase` e feedback em tempo real (`onChange`), deduplicação e ordenação em `allUniqueTags`, filtro resiliente de tarefas (`matchesTag`) e busca case-insensitive.
  - **Estabilidade do Ambiente Local e Autenticação:** Script `"dev": "next dev --webpack"` configurado no `package.json` para contornar o bug do Turbopack no Windows ao lidar com caminhos contendo espaço (`Google Antigravity`). Resolvida incompatibilidade de parâmetros de Server Action com `useActionState` no React 19 e corrigido erro 500 de modificação de cookies em Server Components.
- **Documentação Relacionada:** [doc/04_padronizacao_maiusculas_unificacao_tags.md](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/doc/04_padronizacao_maiusculas_unificacao_tags.md)

---

### [2026-09-11] - Marco 05: Migração para Proxy Next.js 16, Saneamento de Logs e Resolução de Hydration Loop
- **Status / Objetivo / Motivação:** Concluído com sucesso (Incremento Estável). Resolução definitiva do erro em tela no navegador (`Runtime Error: Element type is invalid. Received a promise that resolves to: undefined`) e do loop de hidratação surgido no Marco 04. Eliminação do aviso amarelo de depreciação do Next.js 16 (`middleware` $\rightarrow$ `proxy`) e saneamento de logs do Prisma no terminal.
- **Decisões Técnicas / Ações Realizadas:**
  - **Reversão para Motor Nativo Turbopack:** No `package.json`, restaurado `"dev": "next dev"`, removendo a flag `--webpack` inserida no Marco 04. Identificou-se que o Webpack no Next.js 16/React 19 sofria um erro de escape de caminhos no Windows com espaços (`Google Antigravity`), fazendo com que o Client Component `DashboardContent` não fosse resolvido pelo chunk loader do browser (gerando `undefined` e o loop em tela).
  - **Purga de Cache `.next`:** Removidos todos os artefatos de cache defasados (`stale`) do compilador Webpack.
  - **Migração para Convenção `proxy.ts` (Next.js 16):** Criado `src/proxy.ts` e exportada a função `proxy()` em conformidade com a nova arquitetura Node.js do Next.js 16, removendo `src/middleware.ts`.
  - **Saneamento de Logs do Prisma Client (`src/lib/db.ts`):** Ajustado o nível de log padrão de `log: ["query"]` para `["error", "warn"]`, eliminando a colisão de buffers ANSI no terminal.
  - **Verificação Completa:** Build de produção validado em 1.7s e chunks do cliente carregados com status HTTP 200 OK sem qualquer loop.
- **Documentação Relacionada:** [doc/05_migracao_proxy_next16_saneamento_logs.md](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/doc/05_migracao_proxy_next16_saneamento_logs.md)

---

### [2026-09-11] - Marco 06: Expulgo de Tags Órfãs, Filtro Contextual e Gerenciamento de Tags
- **Status / Objetivo / Motivação:** Concluído com sucesso (Incremento Estável). Resolução da queixa de tags vazias sem tarefas gerando telas em branco ("Nenhuma tarefa encontrada neste filtro."). Unificação da tag duplicada `MELHORIAS DE UX` $\rightarrow$ `MELHORIA DE UX`, implementação de filtro contextual dinâmico por status com contadores numéricos e inclusão de rotinas automáticas de *Garbage Collection* para eliminar registros órfãos na tabela `TagConfig`.
- **Decisões Técnicas / Ações Realizadas:**
  - **Unificação no PostgreSQL:** Desenvolvido e executado o script idempotente `scripts/unify_ux_tags.js`, migrando a única tarefa com a tag no plural para a tag canônica `MELHORIA DE UX` e extinguindo a variante incorreta.
  - **Rotina de Garbage Collection (`cleanupOrphanTagConfigs`):** Criada rotina em `src/app/actions/tags.ts` que inspeciona todas as tarefas dos projetos do usuário e purga automaticamente da tabela `TagConfig` qualquer registro de cor cuja tag não esteja mais presente em nenhuma tarefa ativa.
  - **Ação de Exclusão Direta (`deleteTag`):** Implementada Server Action para desvincular uma tag de todas as tarefas de um projeto em lote, acionando em seguida a limpeza em `TagConfig` e a revalidação de cache.
  - **Auto-Cleanup em Mutação de Tarefas:** Integrada a chamada de `cleanupOrphanTagConfigs` em `updateTask` e `deleteTask` (`src/app/actions/tasks.ts`), garantindo saneamento contínuo do banco.
  - **Filtro Contextual e Contadores Dinâmicos (Frontend):** Atualizado `DashboardContent.tsx` para derivar as tags exibidas a partir das tarefas do status atualmente ativo (`pending` vs `completed`). Tags com 0 tarefas no status ativo não são exibidas. Cada botão exibe agora um badge com a contagem exata de tarefas (ex: `MELHORIA DE UX (4)`). Adicionado botão de remoção rápida com confirmação no hover de cada tag e auto-reset da seleção ao alternar de aba.
- **Documentação Relacionada:** [doc/06_expulgo_tags_orfas_filtro_contextual.md](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/doc/06_expulgo_tags_orfas_filtro_contextual.md)

---

### [2026-09-11] - Marco 07: Ajuste de Contraste no Tema Claro e Módulo de Troca de Senha
- **Status / Objetivo / Motivação:** Concluído com sucesso (Incremento Estável). Correção do contraste insatisfatório da aba "Concluídas" no tema claro sépia (onde o verde fluorescente apresentava legibilidade insuficiente) e implementação de módulo de configurações para troca de senha segura pelo usuário logado.
- **Decisões Técnicas / Ações Realizadas:**
  - **Design Tokens Semânticos no CSS:** Introduzidos tokens adaptativos `--status-completed` e `--status-completed-bg` em `src/app/globals.css`. No tema claro sépia, adotado o tom verde floresta profundo (`#14532d`), garantindo alto contraste e conformidade com os padrões WCAG AAA. No tema escuro, preservado o verde esmeralda vibrante com brilho neon suave.
  - **Cibersegurança e Hashing (Server Action):** Desenvolvida a ação `changePassword` em `src/app/actions/auth.ts`, exigindo e validando a senha atual com `bcrypt.compare` (mitigação contra timing attacks e sequestro de sessão), validação de tamanho mínimo e geração de novo hash com salt fator 10.
  - **Pontos de Acesso na Interface (UX):** Adicionado botão de engrenagem (`Settings`) no Header principal (ao lado do alternador de tema) e na Sidebar (ao lado do botão de logout), proporcionando acesso intuitivo tanto no desktop quanto em dispositivos móveis.
  - **Modal de Configurações da Conta:** Implementado modal moderno com alternador de visibilidade de senha (`Eye` / `EyeOff`), validações reativas e feedback claro de erro e sucesso.
- **Documentação Relacionada:** [doc/07_ajuste_contraste_tema_claro_e_troca_de_senha.md](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/doc/07_ajuste_contraste_tema_claro_e_troca_de_senha.md)

---

### [2026-09-11] - Marco 08: Harmonização Cromática dos Projetos no Tema Claro
- **Status / Objetivo / Motivação:** Concluído com sucesso (Incremento Estável). Eliminação de marcadores, bordas ativas e luzes azuis elétricas na barra lateral e no cabeçalho do projeto quando no tema claro sépia/caderno, unificando a identidade visual sob a paleta clássica e terrosa de cera e pergaminho.
- **Decisões Técnicas / Ações Realizadas:**
  - **Adaptação Dinâmica na Sidebar:** No componente `DashboardContent.tsx`, o ponto circular (`backgroundColor`), a borda esquerda do item ativo (`borderLeft`) e a sombra (`boxShadow`) foram condicionados para utilizar `var(--accent)` (tom âmbar quente/caramelo `#b45309`) e sombra suave analógica quando `theme === 'light'`, preservando o azul elétrico `#3b82f6` e seu efeito neon glow exclusivamente no tema escuro.
  - **Adaptação do Cabeçalho Principal:** O marcador circular ao lado do título do projeto ativo no header agora também herda dinamicamente `var(--accent)` no modo claro.
  - **Gradiente de Hover nos Cards:** O brilho radial de hover nas tarefas foi harmonizado para utilizar `var(--accent)` no tema claro.
- **Documentação Relacionada:** [doc/08_harmonizacao_cores_projetos_tema_claro.md](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/doc/08_harmonizacao_cores_projetos_tema_claro.md)

---

### [2026-09-11] - Marco 09: Renomeação e Unificação Definitiva de Branding para DevLog
- **Status / Objetivo / Motivação:** Concluído com sucesso (Incremento Estável). Eliminação de referências ao antigo nome de trabalho (*Project Notes*) em favor do nome oficial e consolidado **DevLog**, unificando a identidade da aplicação nos metadados globais, cabeçalhos, formulários de autenticação, telas de boas-vindas e automações de inicialização.
- **Decisões Técnicas / Ações Realizadas:**
  - **Metadados e SEO (`layout.tsx`):** O `title` da aba do navegador foi atualizado para `"DevLog - Seus projetos em foco"`, com descrição técnica alinhada ao propósito da plataforma.
  - **Página de Login (`login/page.tsx`):** O cabeçalho `<h1>` principal foi atualizado para `DevLog` acima do formulário de acesso restrito.
  - **Componente Principal (`DashboardContent.tsx`):** Unificado o título para `DevLog` no cabeçalho da barra lateral (Sidebar), no header de dispositivos móveis em estado vazio e no card central de boas-vindas do workspace.
  - **Identificador de Página (`page.tsx`):** O componente assíncrono raiz foi renomeado de `ProjectNotesPage` para `DevLogPage`.
  - **Script de Inicialização (`iniciar.bat`):** Janela do console e mensagem de boot atualizadas para `DevLog`.
  - **Documentação do Repositório (`README.md`):** Incorporada seção formal "Sobre o Projeto" destacando a proposta de valor técnica e stack moderna.
- **Documentação Relacionada:** [doc/09_renomeacao_unificacao_branding_devlog.md](./doc/09_renomeacao_unificacao_branding_devlog.md)

---

### [2026-09-11] - Marco 10: Animações Cinematográficas com GSAP (Hero & Header Reveal)
- **Status / Objetivo / Motivação:** Concluído com sucesso (Incremento Estável). Implementação de transições visuais fluidas de alta fidelidade e ergonomia utilizando **GSAP** e o hook oficial `@gsap/react` (`useGSAP`), seguindo as diretrizes oficiais de animação em React 19 / Next.js.
- **Decisões Técnicas / Ações Realizadas:**
  - **Instalação Oficial:** Adicionados `gsap` e `@gsap/react` como dependências de produção do projeto.
  - **Gerenciamento de Ciclo de Vida (`useGSAP` com `scope`):** Utilização de `useRef` como escopo isolado para o Welcome Hero, Header do projeto e Board de tarefas/notas, garantindo reversão automática (`ctx.revert()`) ao desmontar componentes e impedindo **Memory Leaks** (vazamento de memória).
  - **Hero & Welcome Screen Reveal:** Transição sequencial com elasticidade suave (`back.out(1.7)`) para o badge/logo, entrada vertical fluida para títulos e stagger progressivo para os cards de atalho ("Novo Projeto" e "Ver Projetos").
  - **Project Header & Toolbar Reveal:** Deslizamento suave da identificação do projeto e controles de visualização, associado ao efeito cascata (*stagger*) nas pílulas de filtros contextuais de tags.
  - **Correção de Cores das Notas & `clearProps`:** Ajustado o parâmetro de finalização do GSAP para `clearProps: "transform,opacity,visibility"` (em vez de `"all"`), impedindo que o motor de animação removesse a cor de fundo inline dos post-its. Aplicados tons pastéis e harmoniosos de amarelo suave (`#fef3c7`) e âmbar claro (`#fde68a`), confortáveis visualmente e com fita adesiva fosca translúcida.
  - **Alinhamento e Ergonomia dos Post-its:** Remoção de rotações desiguais em favor de um alinhamento limpo e simétrico em grade (`grid-cols-2`), com elevação sutil no hover.
  - **Reordenação Dinâmica por Arraste (Drag-and-Drop):** Implementado suporte a arrastar e soltar notas adesivas (`HTML5 Drag and Drop`) com feedback visual (opacidade, anel de realce) e persistência de ordenação no `localStorage` por projeto.
  - **Eliminação de Avisos de Console (`GSAP target not found`):** Adicionada a diretiva `gsap.config({ nullTargetWarn: false })` e condicionamento estrito por verificação de presença de nós DOM antes da invocação dos tweens.
  - **Backdrop Unificado do Modal de Tarefa:** Elevado o índice de empilhamento (`z-index`) do modal de detalhes da tarefa de `z-[60]` para `z-[80]`, garantindo que o backdrop escuro com desfoque cubra 100% da tela (incluindo o menu lateral esquerdo `z-[70]`).
  - **Harmonização do Botão Excluir:** Calibrado o fundo para um escuro moderado e não agressivo (`bg-black/20 hover:bg-black/30 text-red-700` no tema claro e `bg-red-950/40 hover:bg-red-950/60 text-red-400` no tema escuro), eliminando o preto sólido chapado em favor de uma integração fluida com o tema sépia.
- **Documentação Relacionada:** [doc/10_animacoes_gsap_hero_header.md](./doc/10_animacoes_gsap_hero_header.md)

---

### [2026-09-11] - Marco 11: Reorganização da Busca e Categorização Unificada ("Tarefas em andamento" e "Tarefas Concluídas")
- **Status / Objetivo / Motivação:** Concluído com sucesso (Incremento Estável). Atendimento ao feedback de usabilidade para aproximar a barra de pesquisa das abas de navegação de status ("Pendentes" / "Concluídas") e permitir que a busca opere em nível global no projeto, particionando os resultados instantaneamente em duas seções categorizadas: *"Tarefas em andamento"* e *"Tarefas Concluídas"*.
- **Decisões Técnicas / Ações Realizadas:**
  - **Reposicionamento Espacial da Busca (Layout UX):** Substituída a distribuição extrema `justify-between` por alinhamento harmônico à esquerda (`justify-start gap-3 sm:gap-6 lg:gap-8`), trazendo o campo de busca para próximo das abas de status.
  - **Mecanismo de Busca Abrangente e Reativo:** Implementada lógica via `useMemo` que avalia termos no título, descrição, tags e logs de histórico, mantendo compatibilidade com filtros de tags selecionadas.
  - **Particionamento Categorizado de Resultados:** Quando `isSearching` é ativo, a listagem do quadro se subdivide automaticamente em:
    - *Tarefas em andamento*: com indicador âmbar e badge de contagem de itens pendentes encontrados.
    - *Tarefas Concluídas*: com indicador verde e badge de contagem de itens finalizados encontrados.
  - **Componentização Limpa (`renderTaskCard`):** Modularizada a renderização dos cards de tarefas para evitar duplicidade de JSX e garantir manutenção centralizada de interações (edição, exclusão, toggle de status e logs).
  - **Feedback para Ausência de Resultados:** Tratamento de empty states com botão contextual de limpeza de busca e preservação do fluxo convencional quando o campo de pesquisa está vazio.
---

### [2026-09-11] - Marco 12: Nova Identidade Visual e Novo Logotipo do DevLog
- **Status / Objetivo / Motivação:** Concluído com sucesso (Incremento Estável). Atualização do logotipo oficial do DevLog para uma identidade visual moderna, com chaves de código `{ }` em degradê neon (ciano e âmbar) envolvendo o checkmark central sobre vidro escuro fosco (*frosted glass squircle*).
- **Decisões Técnicas / Ações Realizadas:**
  - **Geração e Curadoria:** Exploração de múltiplos conceitos via IA generativa e seleção da evolução refinada das chaves de código com checkmark.
  - **Tratamento de Fundo e Transparência (Alpha Channel):** Processamento gráfico automatizado via `.NET System.Drawing` para recortar o squircle central em resolução 512x512 e aplicar máscara com cantos suaves 100% transparentes (`Alpha = 0`), eliminando o fundo preto exterior indesejado.
  - **Padronização dos Arquivos do Sistema:** Atualizados `public/logo-devlog.png` (usado na barra lateral e tela de autenticação) e `src/app/icon.png` (favicon oficial dos metadados).
---

### [2026-09-11] - Marco 13: Animação do Logotipo com a Skill Motion Design (Three Layers & Micro-Interactions)
- **Status / Objetivo / Motivação:** Concluído com sucesso (Incremento Estável). Implementação de coreografia visual de alta fidelidade para o logotipo do DevLog baseada nos princípios oficiais da skill `motion-design` (Três Camadas: Primária, Secundária e Ambiente, arquétipo *Premium Tech*, física crível e acessibilidade com `prefers-reduced-motion`).
- **Decisões Técnicas / Ações Realizadas:**
  - **Componentização Modular (`DevLogLogo.tsx`):** Criação de componente reutilizável com suporte a quatro escalas (`sm`, `md`, `lg`, `xl`) e ciclo de vida seguro via `useGSAP` com escopo isolado e liberação de memória automática.
  - **Camada Ambiente (Ambient Layer):** Halo de luz difuso ciano e âmbar com respiração senoidal contínua (`sine.inOut`, período 2.8s) criando uma assinatura visual de sistema ativo.
  - **Camada Primária (Primary Layer):** Entrada triunfal com overshoot sutil (`back.out(1.4)`, 650ms), rotação elástica de -4deg para 0deg e escala proporcional.
  - **Camada Secundária (Secondary Layer):** Varredura de feixe especular de vidro fosco (*sheen sweep*) que percorre diagonalmente a superfície do emblema na entrada e durante a interação.
  - **Micro-interações Táteis (Hover & Press):** Reação física instantânea no hover (`scale: 1.08`, leve inclinação 3D de 1.5deg e aumento do glow) e feedback tátil de clique (*anticipation squash* para 0.94 e recuperação elástica).
  - **Integração no Ecossistema:** Aplicado na Barra Lateral (Sidebar), no Hero da tela inicial (Welcome Badge), no cabeçalho mobile e na tela de Autenticação (Login).
- **Documentação Relacionada:** [doc/13_animacao_logo_motion_design.md](./doc/13_animacao_logo_motion_design.md)

---

### [2026-09-11] - Marco 14: Animações de Motion Design nos 6 Ciclos Operacionais do DevLog
- **Status / Objetivo / Motivação:** Concluído com sucesso (Incremento Estável). Implementação completa, calibragem de alto impacto tátil/visual e **fidelidade cromática absoluta à cor do projeto (Laranja / Âmbar)** para o ciclo de vida das entidades do DevLog (Notas, Tarefas e Logs) baseada na skill `motion-design`.
- **Decisões Técnicas / Ações Realizadas:**
  - **Módulo Centralizado de Motion (`src/lib/motion.ts`):** Abstração desacoplada de animações GSAP de alta performance com respeito nativo a `prefers-reduced-motion`.
  - **Correção Cromática no Banco de Dados:** Identificado que o projeto "Carreira Livre" estava persistido com o código azul legado (`#3b82f6`). Atualizado via Prisma para `#f97316` (Laranja vibrante oficial).
  - **Blindagem do Tema Âmbar (`getResolvedThemeColor` & `activeAccentColor`):** Quando a classe `.theme-light` (tema caderno/sépia) está ativa, o sistema força dinamicamente o uso de `#ea580c` / `#f97316`, garantindo que nenhuma animação exiba azul e sincronizando 100% com os botões e detalhes do painel.
  - **1. Criar Nota:** Queda expressiva de post-it com rotação elástica acentuada (5 a 11 graus, `back.out(2.2)`), halo dourado/âmbar expansivo ao redor da nota e animação secundária elástica na fita adesiva.
  - **2. Criar Tarefa:** Entrada vertical contundente (`y: -60`, `scale: 0.78 -> 1`, `back.out(1.8)`), feixe luminoso radiante (`boxShadow`) estritamente em Laranja e auto-scroll suave.
  - **3. Editar Tarefa / Nota:** Feedback tátil evidente de "Bump" elástico com expansão perceptível (`scale: 1.05`), acompanhado de halo cintilante em Laranja/Âmbar e amortecimento vibrante.
  - **4. Excluir Tarefa / Nota:** Antecipação nítida em vermelho de perigo (120ms), seguida de ejeção física arremessada para a esquerda com inclinação (`x: -140`, `rotation: -9deg`, `scale: 0.7`) e recolhimento limpo de espaço antes do Server Action.
  - **5. Adicionar Andamento (Log):** Revelação cinematográfica de baixo para cima (`y: 50`, `scale: 0.8`), feixe luminoso sincronizado em Laranja/Âmbar e assentamento tátil na linha do tempo com foco automático.
  - **6. Concluir / Reabrir Tarefa:** Vitória comemorativa sincronizada — pop gigante no botão de checkmark (`scale: 1.6`, `back.out(3.0)`) em paralelo com um halo esmeralda radiante (`boxShadow: 0 0 0 4px rgba(16, 185, 129, 0.9)`) disparado em todo o card da tarefa.
  - **Sincronização Reativa Precisa:** Rastreamento determinístico de novos itens via `useRef<Set<string>>` no `DashboardContent.tsx`, passando dinamicamente `activeAccentColor` para todas as chamadas visuais.
- **Documentação Relacionada:** [doc/14_animacoes_motion_design_ciclos_operacionais.md](./doc/14_animacoes_motion_design_ciclos_operacionais.md)














