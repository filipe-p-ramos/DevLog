# DevLog - Project Notes Dashboard

O **DevLog** é uma aplicação web robusta projetada para o rastreio e acompanhamento de tarefas e anotações técnicas, focada em desenvolvedores que precisam documentar decisões arquiteturais, impedimentos e progressos.

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
- [HISTORICO.md](./HISTORICO.md) — Diário cronológico de arquitetura e entregas (Marcos 01 a 06).
- Pasta [doc/](./doc/) — Memoriais técnicos sequenciais e detalhados de cada marco.


