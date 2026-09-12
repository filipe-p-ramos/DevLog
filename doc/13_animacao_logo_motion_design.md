# Plano de Implementação: Animação do Logotipo Oficial com a Skill Motion Design

## 1. Contexto e Objetivos
Com a nova marca oficial do **DevLog** consolidada (chaves de código `{ ✓ }` em ciano e âmbar sobre squircle de vidro fosco), aplicamos os princípios e padrões técnicos da skill **`motion-design`** para dar vida ao logotipo com elegância cinematográfica, fluidez física e micro-interações responsivas.

---

## 2. Princípios de Motion Design Aplicados

Conforme a especificação do guia `motion-design`, toda animação de alta fidelidade deve satisfazer os **Três Pilares** e estruturar-se em **Três Camadas de Movimento**:

### 2.1. Os Três Pilares
- **Intenção Emocional (Emotional Intent):** Transmitir precisão de engenharia, foco e sofisticação tecnológica (*arquétipo Premium Tech*).
- **Narrativa Visual (Visual Narrative):** O sistema acorda: o emblema emerge no espaço, um feixe de luz reflete sobre o vidro e um halo ambiente pulsa suavemente no fundo.
- **Física e Artesania (Motion Craft):** Acelerações naturais, curvas de amortecimento (*easing* não linear) e interações táteis de pressão (*anticipation* e *follow-through*).

### 2.2. As Três Camadas de Movimento (Three Motion Layers)
1. **Camada Primária (Primary Layer - O Emblema):**
   - **Revelação de Entrada:** Transição de escala (de `0.78` para `1.0`), rotação sutil (de `-4deg` para `0deg`) e deslocamento vertical com overshoot calibrado (`back.out(1.4)`, duração de `650ms`).
   - **Micro-interação de Hover:** Elevação responsiva para `scale: 1.08` com leve rotação 3D de `1.5deg` e sombra projetada em `250ms` (`power2.out`).
   - **Feedback de Clique (Squash & Stretch):** Efeito de compressão física para `scale: 0.94` em `100ms`, retornando com recoil elástico para `1.08` em `200ms`.
2. **Camada Secundária (Secondary Layer - Sheen / Reflexo de Vidro):**
   - Um feixe de luz especular diagonal (`sheen sweep` com gradiente translúcido e `-skew-x-12`) desliza de ponta a ponta na entrada do app e é reativado no hover do usuário.
3. **Camada Ambiente (Ambient Layer - Halo de Luz Orgânica):**
   - Halo difuso ciano e âmbar posicionado na camada `-z-10`, oscilando suavemente em escala e opacidade via curva senoidal infinita (`sine.inOut`, período `2.8s`, `yoyo: true`), comunicando que a aplicação está ativa e pronta para registrar fluxos.

---

## 3. Arquitetura e Engenharia de Componente (`DevLogLogo.tsx`)

O componente foi projetado com isolamento de escopo para máxima performance e acessibilidade:
- **`useGSAP` com `scope: containerRef`:** Garante limpeza automática de tweens e timelines na desmontagem, prevenindo **Memory Leaks**.
- **Acessibilidade Universal (`prefers-reduced-motion`):** Detecção nativa do sistema operacional; se o usuário optar por redução de movimento, as oscilações contínuas e rotações são suprimidas.
- **Variantes de Escala Parametrizadas:**
  - `sm` (`w-8 h-8`): Ideal para headers mobile compactos.
  - `md` (`w-10 h-10`): Padrão na barra lateral (Sidebar).
  - `lg` (`w-16 h-16`): Destaque na tela de login e autenticação.
  - `xl` (`w-20 h-20` / `w-24 h-24`): Hero central na tela de boas-vindas.

---

## 4. Pontos de Integração no Sistema
1. **Barra Lateral do Dashboard:** [`src/app/components/DashboardContent.tsx`](../src/app/components/DashboardContent.tsx)
2. **Hero da Tela Inicial (Welcome Screen):** [`src/app/components/DashboardContent.tsx`](../src/app/components/DashboardContent.tsx)
3. **Cabeçalho em Dispositivos Móveis:** [`src/app/components/DashboardContent.tsx`](../src/app/components/DashboardContent.tsx)
4. **Página de Login do Sistema:** [`src/app/login/page.tsx`](../src/app/login/page.tsx)
