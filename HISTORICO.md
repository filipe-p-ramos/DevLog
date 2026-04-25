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
