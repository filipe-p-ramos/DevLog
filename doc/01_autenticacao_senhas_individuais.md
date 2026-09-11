# Memorial Técnico — 01: Autenticação Segura com Senhas Individuais e Purga de Dados

## 1. Motivação e Contexto Operacional
Anteriormente, o sistema de autenticação operava sob um modelo de **Segredo Compartilhado (*Shared Secret*)**:
- A senha era lida da variável de ambiente `process.env.APP_PASSWORD` com fallback vulnerável hardcoded `"123"`.
- Todos os usuários compartilhavam obrigatoriamente a mesma senha.
- Se a variável não estivesse definida, qualquer pessoa poderia autenticar com `"123"`.
- O banco de dados continha registros de usuários antigos/não utilizados (`raphael` e `user@projectnotes.local`).

Por se tratar de um **projeto pessoal estritamente privado**, o objetivo desta atualização foi implementar o modelo **Security by Design** sem expor rotas públicas de cadastro (*sign-up*), garantindo credenciais individuais armazenadas em hash seguro e eliminando o resíduo de dados.

---

## 2. Decisões Arquiteturais e de Cibersegurança

### A. Hash Criptográfico com Bcrypt
- Adicionada a biblioteca `bcryptjs` (implementação pura em JavaScript de alto desempenho, eliminando problemas de compilação C++ em deploys serverless/Vercel).
- Custo de salt (*work factor*) padronizado em `10`, oferecendo resistência comprovada a ataques de dicionário e força bruta (*brute-force*), além de mitigar ataques de temporização (*timing attacks*).
- A coluna `password` foi adicionada na tabela `User` do PostgreSQL via Prisma ORM.

### B. Projeto Fechado (Zero Public Sign-Up)
- Não foram criadas rotas ou interfaces de auto-cadastro na web (`/register`, `/signup`).
- O gerenciamento de credenciais e criação de novos usuários é restrito ao administrador do sistema via terminal local com o script dedicado:
  ```bash
  npm run user:password <usuario> <nova_senha>
  # ou diretamente:
  node scripts/set-password.js <usuario> <nova_senha>
  ```

### C. Proteção Contra Enumeração de Contas (OWASP Top 10)
- Na Server Action `loginWithPassword` ([`src/app/actions/auth.ts`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/actions/auth.ts)), mensagens de erro diferenciadas (como *"Usuário não encontrado"* vs *"Senha incorreta"*) foram eliminadas.
- Qualquer falha na validação (usuário inexistente, senha divergente, usuário sem hash) retorna a mensagem uniforme `"Credenciais inválidas"`.

### D. Purga de Dados e Integridade Referencial
- Removido o usuário `raphael` e toda a sua árvore de dependências (`projects`, `tasks`, `logs`, `notes`, `tagConfigs`).
- Removido o usuário residual `user@projectnotes.local`.
- Preservação estrita dos 6 projetos, 71 tarefas, notas e 9 tags do usuário `filipe`.
- Atualizado o schema do Prisma para configurar `onDelete: Cascade` nas relações `User -> Project` e `User -> TagConfig`.

---

## 3. Arquivos Alterados e Criados

| Arquivo | Ação | Descrição |
| :--- | :---: | :--- |
| [`prisma/schema.prisma`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/prisma/schema.prisma) | Modificado | Adicionado campo `password` em `User` e `onDelete: Cascade`. |
| [`src/app/actions/auth.ts`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/src/app/actions/auth.ts) | Modificado | Validação com `bcrypt.compare` e remoção total de `APP_PASSWORD`. |
| [`.env`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/.env) | Modificado | Removida a chave estática `APP_PASSWORD`. |
| [`config.env`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/config.env) | Modificado | Removida a chave estática `APP_PASSWORD`. |
| [`package.json`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/package.json) | Modificado | Adicionadas dependências `bcryptjs`, `@types/bcryptjs` e script `user:password`. |
| [`scripts/set-password.js`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/scripts/set-password.js) | Novo | Utilitário CLI seguro para definição e alteração de senhas. |
| [`scripts/cleanup-and-migrate-auth.js`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/scripts/cleanup-and-migrate-auth.js) | Novo | Script de purga segura de dados antigos e migração inicial. |
| [`scratch/test_auth.js`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/scratch/test_auth.js) | Novo | Bateria de testes de verificação do fluxo de autenticação. |

---

## 4. Manual Operacional do Administrador

Para trocar a senha do seu usuário a qualquer momento, execute no terminal na raiz do projeto:
```bash
npm run user:password filipe NOVA_SENHA_AQUI
```
O script gerará automaticamente o novo hash com salt rounds seguro e atualizará o banco de dados instantaneamente.
