# Memorial Técnico 15: Restauração Cromática no Tema Escuro e Sincronização de Tokens

Este memorial documenta o diagnóstico de causa-raiz, a resolução arquitetural e a recalibragem de tokens de cores sensíveis ao tema no **DevLog**, eliminando resquícios do tema âmbar quando o usuário opera no tema escuro.

---

## 1. Contexto, Diagnóstico e Causa-Raiz

### O Problema Relatado
Ao alternar entre o tema claro (caderno/âmbar com fundo sépia `#bcba9c`) e o tema escuro (`#0a0a0a`), componentes operacionais críticos do projeto ativo "Carreira Livre" — especificamente o marcador circular da barra lateral, o botão "+ NOVA TAREFA", a borda esquerda dos cards de tarefas e os pulsos luminosos de motion design — permaneciam renderizados em tons de laranja/âmbar vibrante (`#f97316`), em vez de se alinharem à paleta azul elétrica (`#3b82f6`) padrão do tema escuro do DevLog.

### Análise de Causa-Raiz (Root Cause Analysis)
1. **Mutação Acidental de Cor no Banco de Dados (Prisma):** No Marco 14, durante a implementação de animações para o tema âmbar, a cor do projeto "Carreira Livre" foi indevidamente atualizada no banco de dados de `#3b82f6` para `#f97316` sob a suposição equivocada de que `#3b82f6` seria um "código azul legado", quando na verdade `#3b82f6` é a identidade visual padrão do tema escuro.
2. **Propagação em Cascata dos Estilos Inline:** O componente `DashboardContent.tsx` consome `selectedProject.color` para renderizar:
   - O botão primário "+ NOVA TAREFA" (`backgroundColor: theme === 'light' ? 'var(--accent)' : selectedProject.color`);
   - A borda lateral e hover dos cards de tarefas (`borderLeft: 3px solid ...`);
   - O ponto indicador no cabeçalho e na barra lateral.
   Como o valor gravado em banco era `#f97316`, estes elementos permaneciam fixados em laranja mesmo com a remoção da classe `.theme-light`.
3. **Fallbacks Rígidos em Âmbar no Módulo de Motion:** O utilitário `getResolvedThemeColor` em `src/lib/motion.ts` e a variável `activeAccentColor` em `DashboardContent.tsx` utilizavam `#f97316` como fallback incondicional caso a cor do projeto não estivesse definida, provocando vazamentos cromáticos para as animações no tema escuro.

---

## 2. Conceitos Técnicos Aplicados

- **Context-Aware Color Resolution (Resolução de Cor Sensível ao Contexto):** Garantia de que a interface honre a identidade do projeto mantendo harmonia com o tema ativo:
  - **No Tema Claro (`theme === 'light'`):** Força o uso do token semântico `--accent` (`#b45309`) e o tom quente `#ea580c`, harmonizando perfeitamente com o fundo analógico de papel sépia.
  - **No Tema Escuro (`theme === 'dark'`):** Utiliza a cor nativa do projeto com fallback estrito no azul elétrico `#3b82f6`, integrando-se com os cabeçalhos, abas e demais workspaces.
- **Defensive Styling & Optional Chaining:** Proteção de todos os nós de estilo inline (`selectedProject?.color || 'var(--accent)'`) contra referências nulas durante transições assíncronas de rota ou deseleção de projetos.
- **Consistência de Schema e Repositório:** Alinhamento do `@default("#3b82f6")` na entidade `Project` do `prisma/schema.prisma` com o parâmetro padrão da Server Action `createProject(name, color = "#3b82f6")`.

---

## 3. Ações Técnicas Realizadas

### A. Correção no Banco de Dados PostgreSQL (Prisma)
- Executada mutação direta via Prisma Client restaurando a cor de "Carreira Livre" para a paleta oficial:
  ```typescript
  await prisma.project.updateMany({
    where: { name: 'Carreira Livre' },
    data: { color: '#3b82f6' }
  });
  ```
- Todos os 4 projetos do banco ("Carreira Livre", "CNJ Compilant PRO", "VeritaCustas" e "Sobre esse App") agora compartilham a mesma base harmônica `#3b82f6`.

### B. Blindagem em [`src/app/components/DashboardContent.tsx`](../src/app/components/DashboardContent.tsx)
- **`activeAccentColor`:** Atualizado o fallback para `#3b82f6`:
  ```typescript
  const activeAccentColor = theme === 'light' 
    ? '#ea580c' 
    : (selectedProject?.color || '#3b82f6');
  ```
- **Botão "+ NOVA TAREFA":** Inserido optional chaining e fallback dinâmico:
  ```typescript
  style={{
    backgroundColor: theme === 'light' ? 'var(--accent)' : (selectedProject?.color || 'var(--accent)'),
    boxShadow: `0 4px 12px ${theme === 'light' ? 'var(--accent)' : (selectedProject?.color || 'var(--accent)')}30`
  }}
  ```
- **Indicador do Cabeçalho:** Protegido contra valores indefinidos:
  ```typescript
  style={{ backgroundColor: theme === 'light' ? 'var(--accent)' : (selectedProject?.color || 'var(--accent)') }}
  ```

### C. Ajuste do Motor de Motion em [`src/lib/motion.ts`](../src/lib/motion.ts)
- Atualizado o fallback da função `getResolvedThemeColor`:
  ```typescript
  function getResolvedThemeColor(inputColor?: string): string {
    if (typeof window !== "undefined") {
      const isThemeLight = document.documentElement.classList.contains("theme-light");
      if (isThemeLight) {
        return "#ea580c"; // Laranja/Âmbar oficial do tema caderno
      }
    }
    return (inputColor && inputColor.trim() && !inputColor.includes("undefined") && inputColor !== "")
      ? inputColor.trim()
      : "#3b82f6"; // Azul elétrico padrão do tema escuro
  }
  ```

### D. Atualização do Schema Prisma ([`prisma/schema.prisma`](../prisma/schema.prisma))
- Alterado o atributo `color` de `@default("#000000")` para `@default("#3b82f6")`.

---

## 4. Verificação e Resultados

1. **Auditoria de Banco:** Confirmado via query Prisma que todos os registros possuem `color: "#3b82f6"`.
2. **Alternância entre Temas:**
   - **Tema Escuro:** "Carreira Livre" exibe indicador azul, botão "+ NOVA TAREFA" em azul neon com sombra difusa azul, bordas de tarefas em azul elétrico e efeitos de hover integrados.
   - **Tema Claro (Âmbar/Sépia):** A classe `.theme-light` assume a coloração âmbar terrosa clássica em todos os botões e bordas de tarefas, preservando a imersão de caderno de notas.
