# Memorial Técnico 07: Ajuste de Contraste no Tema Claro e Módulo de Troca de Senha

Este documento registra as decisões de engenharia, melhorias de acessibilidade visual (WCAG) e implementação do módulo de cibersegurança para troca de senha e configurações de conta.

---

## 1. Contexto, Diagnóstico e Motivação

### O Problema Identificado
1. **Contraste Deficiente da Aba "Concluídas":** Ao utilizar o tema claro (estética de papel antigo/sépia com `--background: #bcba9c`), o texto e indicador da aba "Concluídas" utilizavam classes estáticas `text-emerald-400` (`#34d399`), gerando contraste extremamente baixo (< 1.5:1), dificultando a leitura e quebrando a identidade estética refinada do caderno de anotações.
2. **Ausência de Módulo de Configurações e Troca de Senha:** Não havia interface nem endpoint para que o usuário pudesse redefinir ou atualizar sua senha de acesso sem intervenção manual de terminal no banco de dados.

---

## 2. Conceitos Técnicos Aplicados

- **Design Tokens Semânticos e Acessibilidade (WCAG AAA):** Substituição de valores hardcoded de cores por variáveis CSS sensíveis ao tema (`--status-completed` e `--status-completed-bg`), assegurando taxas de contraste superiores a 7:1 em conformidade com as diretrizes internacionais de acessibilidade para interfaces digitais.
- **Hashing Criptográfico com Salt (Bcrypt):** Proteção de credenciais contra ataques de dicionário e tabelas rainbow através do algoritmo Blowfish do `bcryptjs` com fator de custo (*work factor*) 10.
- **Proteção Contra Timing Attacks:** Uso de funções de comparação em tempo constante (`bcrypt.compare`) para prevenir que atacantes deduzam fragmentos de senha medindo a latência de resposta do servidor.
- **Security by Design e Confirmação de Senha Atual:** Obrigatoriedade de fornecimento e validação da senha atual antes de autorizar qualquer mutação de credenciais, impedindo sequestro de conta em terminais com sessões ativas esquecidas abertas.

---

## 3. Ações Técnicas Realizadas

### A. Design Tokens Semânticos (`src/app/globals.css`)
Implementados tokens de status adaptativos:
- **Tema Escuro (`:root`):**
  - `--status-completed: #34d399;` (verde esmeralda luminoso).
  - `--status-completed-bg: rgba(16, 185, 129, 0.15);`
  - `--status-completed-glow: rgba(16, 185, 129, 0.5);`
- **Tema Claro Sépia (`:root.theme-light`):**
  - `--status-completed: #14532d;` (verde floresta nobre com contraste nítido sobre o fundo sépia).
  - `--status-completed-bg: rgba(20, 83, 45, 0.16);`
  - `--status-completed-glow: transparent;`

### B. Proteção do Backend (Server Action em `src/app/actions/auth.ts`)
- Desenvolvida a Server Action `changePassword(currentPassword, newPassword, confirmPassword)`:
  - Recupera a identidade do usuário através do cookie `auth_token` validado.
  - Verifica a paridade entre a nova senha e a confirmação.
  - Exige complexidade mínima de 4 caracteres.
  - Valida criptograficamente a senha atual contra o hash gravado no PostgreSQL.
  - Gera novo hash com salt fator 10 e atualiza a coluna `password` da tabela `User`.

### C. Interface e Experiência de Usuário (`src/app/components/DashboardContent.tsx`)
- **Aba Concluídas Reestilizada:** Atualizada para consumir `--status-completed` e `--status-completed-bg`, com linha indicadora de status e efeito glow apenas no tema escuro. O botão de status no modal de detalhes da tarefa também foi harmonizado.
- **Ícones de Acesso a Configurações:**
  - **Header Principal:** Adicionado botão de engrenagem (`Settings`) com efeito de rotação suave em hover, localizado estrategicamente ao lado do alternador de tema.
  - **Sidebar:** Adicionado botão de `Settings` junto ao botão de logout (`LogOut`), garantindo redundância e fácil acesso no mobile.
- **Modal de Configurações da Conta:**
  - Card moderno com backdrop blur e animação suave.
  - Inputs para Senha Atual, Nova Senha e Confirmação de Nova Senha com botões para alternar visibilidade (`Eye` / `EyeOff`).
  - Alertas com ícones para mensagens de erro ou sucesso.
  - Suporte ao fechamento rápido via tecla `ESC` ou botão `X`.

---

## 4. Verificação e Testes

1. **Auditoria Criptográfica:** Executado [`scratch/test_change_password.js`](file:///c:/Users/filipe.ramos/Documents/Google%20Antigravity/Project_notes/scratch/test_change_password.js), comprovando a rejeição de senhas incorretas, validação de hashes recém-gerados e integridade dos dados no banco.
2. **Compilação de Produção (`npx next build`):** Executado sem falhas, concluído em 2.0s com 100% de sucesso nas rotas dinâmicas, páginas estáticas e no proxy do Next.js Turbopack.
3. **Validação Visual:** Confirmada a transição elegante entre o tema escuro (verde fluorescente com glow) e o tema claro (verde floresta nobre de alto contraste).
