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

## [2026-05-29] - Nova Identidade Visual e Favicon Dinâmico (DevLog)
- **Status:** Concluído (Incremento Estável).
- **Ações:**
    - **Criação de Logo Proprietário (Tech/Dev Theme):** Gerado um logotipo sob medida focado em desenvolvimento e rastreamento de tarefas (símbolos de chaves de código e checklist minimalista) em tons de azul escuro, ciano e cinza grafite.
    - **Estruturação de Pastas & Assets:**
        - Criado o diretório estático `public/` (inexistente no boilerplate inicial) para hospedar `logo-devlog.png` ($1024 \times 1024$px com zoom máximo e apenas 5% de margem útil para máxima visibilidade e legibilidade).
        - Copiado o asset para `src/app/icon.png` habilitando o roteador de favicons automáticos do Next.js App Router.
    - **Integração Visual Estrita:**
        - **Sidebar Header** (`DashboardContent.tsx`): Integrada a imagem do novo logotipo em um container arredondado de bordas finas com transição suave de escala em `hover` ao lado do título principal "Project Notes".
        - **Tela de Login** (`login/page.tsx`): Substituído o ícone de cadeado genérico (`LockKeyhole`) pelo logotipo oficial centralizado na tela de acesso, trazendo consistência visual desde o primeiro instante de acesso.
    - **Documentação de Arquitetura:** Criado o plano detalhado e manual de identidade em `doc/icone-identidade-visual.md`.
- **Benefício:** Padronização estética profissional e eliminação de designs secos sem ícones, proporcionando a experiência premium exigida pelo padrão visual moderno.



