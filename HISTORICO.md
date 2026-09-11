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
## Histórico de Evolução - Project Notes

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


