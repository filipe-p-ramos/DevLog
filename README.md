# DevLog — Diário de Bordo & Gestão de Projetos

> Plataforma de rastreio de tarefas, notas técnicas e diário de bordo para desenvolvedores.

## 📌 Sobre o Projeto

O **DevLog** foi concebido para centralizar o fluxo de trabalho de engenharia de software em um único lugar: acompanhamento de tarefas (*issues/kanban*), registro de decisões arquiteturais (*Architecture Decision Records - ADRs*), bloqueios técnicos e documentação contínua de evolução.

Diferente de gerenciadores de tarefas genéricos, o foco é a **alta densidade de informação e ergonomia para o desenvolvedor**, permitindo alternar fluidamente entre modos de exibição (Card detalhado vs. Lista compacta), filtragem contextual por tags e auditoria de alterações.

## 🚀 Como Iniciar

### Windows (Recomendado)
Basta dar um duplo clique no arquivo:
- `iniciar.bat`

Este script irá verificar se as dependências estão instaladas e iniciará o servidor automaticamente.

### Manualmente
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🛠 Stack Tecnológica
- **Framework:** Next.js (App Router)
- **Banco de Dados:** PostgreSQL (Supabase) via Prisma ORM
- **Estilização:** Tailwind CSS & Lucide Icons
- **Segurança:** RBAC e Row Level Security (RLS)

## 📄 Documentação
Para detalhes sobre decisões técnicas, arquitetura e evolução do projeto, consulte:
- [HISTORICO.md](./HISTORICO.md) — Diário cronológico de arquitetura e entregas (Marcos 01 a 09).
- Pasta [doc/](./doc/) — Memoriais técnicos sequenciais e detalhados de cada marco.


