import gsap from "gsap";

/**
 * Utilitários de Motion Design para os ciclos operacionais do DevLog
 * Animações táteis, expressivas e perceptíveis com física de amortecimento (bounce / elastic)
 * e fidelidade cromática absoluta à cor do projeto ativo (Laranja / Âmbar).
 */

function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Determina a cor base para os efeitos visuais e halos luminosos:
 * No tema Âmbar (theme-light / papel caderno), força o Laranja/Âmbar (#ea580c)
 * combinando 100% com os botões e elementos da interface.
 */
function getResolvedThemeColor(inputColor?: string): string {
  if (typeof window !== "undefined") {
    const isThemeLight = document.documentElement.classList.contains("theme-light");
    if (isThemeLight) {
      return "#ea580c"; // Laranja/Âmbar oficial do tema caderno
    }
  }
  return (inputColor && inputColor.trim() && !inputColor.includes("undefined") && inputColor !== "")
    ? inputColor.trim()
    : "#3b82f6";
}

/**
 * Converte qualquer formato de cor (hex, rgb, ou fallback) em RGBA seguro
 * com fallback dinâmico: âmbar no tema claro e azul no tema escuro (#3b82f6).
 */
function resolveColor(inputColor?: string, alpha: number = 1): string {
  const resolved = getResolvedThemeColor(inputColor);

  if (resolved.startsWith("#")) {
    let clean = resolved.slice(1);
    if (clean.length === 3) {
      clean = clean.split("").map(c => c + c).join("");
    }
    if (clean.length === 6) {
      const num = parseInt(clean, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }

  if (resolved.startsWith("rgb")) {
    if (resolved.startsWith("rgba")) {
      return resolved.replace(/[\d\.]+\)$/, `${alpha})`);
    }
    return resolved.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  }

  return resolved;
}

/**
 * 1. CRIAR NOTA (Post-it Drop & Bounce)
 * Queda física expressiva com rotação acentuada, sombra profunda e assentamento elástico vibrante em âmbar/dourado
 */
export function animateNoteEntrance(element: HTMLElement | null) {
  if (!element || isReducedMotion()) return;

  element.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const randomAngle = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 6);
  const tl = gsap.timeline();

  tl.fromTo(
    element,
    {
      y: -80,
      rotation: randomAngle,
      scale: 0.65,
      autoAlpha: 0,
      boxShadow: "0 30px 60px -12px rgba(0,0,0,0.65), 0 0 40px rgba(234, 179, 8, 0.7)"
    },
    {
      y: 0,
      rotation: 0,
      scale: 1,
      autoAlpha: 1,
      duration: 0.6,
      ease: "back.out(2.2)",
      clearProps: "transform,opacity,visibility"
    }
  );

  // Pulso dourado/âmbar de celebração ao redor da nota
  tl.fromTo(
    element,
    {
      boxShadow: "0 0 0 4px rgba(234, 179, 8, 0.8), 0 20px 40px rgba(0,0,0,0.4)"
    },
    {
      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
      duration: 0.8,
      ease: "power2.out",
      clearProps: "boxShadow"
    },
    "-=0.3"
  );

  // Animação secundária da fita adesiva
  const tape = element.querySelector<HTMLElement>(".absolute.-top-3\\.5, .absolute.-top-4, [class*='-top-']");
  if (tape) {
    gsap.fromTo(
      tape,
      { scaleY: 0, scaleX: 1.5, opacity: 0, y: -10 },
      {
        scaleY: 1,
        scaleX: 1,
        opacity: 1,
        y: 0,
        duration: 0.35,
        delay: 0.25,
        ease: "elastic.out(1.2, 0.4)",
        clearProps: "transform,opacity"
      }
    );
  }
}

/**
 * 2. CRIAR TAREFA (Hero Expand & Project Glow)
 * Entrada vertical contundente com escala elástica e feixe luminoso expansivo na cor do projeto (Laranja)
 */
export function animateTaskEntrance(element: HTMLElement | null, projectColor?: string) {
  if (!element || isReducedMotion()) return;

  element.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const mainColor = getResolvedThemeColor(projectColor);
  const glowBorder = resolveColor(mainColor, 0.9);
  const glowSpread = resolveColor(mainColor, 0.45);
  const waveColor = resolveColor(mainColor, 0.7);

  const tl = gsap.timeline();

  tl.fromTo(
    element,
    {
      y: -60,
      scale: 0.78,
      autoAlpha: 0,
      boxShadow: `0 0 0 4px ${glowBorder}, 0 20px 50px ${glowSpread}`
    },
    {
      y: 0,
      scale: 1,
      autoAlpha: 1,
      duration: 0.55,
      ease: "back.out(1.8)",
      clearProps: "transform,opacity,visibility"
    }
  );

  // Onda de iluminação pulsante na cor do projeto (Laranja)
  tl.fromTo(
    element,
    {
      boxShadow: `0 0 45px 8px ${waveColor}, 0 0 0 3px ${glowBorder}`
    },
    {
      boxShadow: "0 0 0 0 transparent",
      duration: 0.9,
      ease: "power2.out",
      clearProps: "boxShadow"
    },
    "-=0.2"
  );
}

/**
 * 3. EDITAR TAREFA OU NOTA (High-Impact State Flash)
 * "Bump" tátil com expansão perceptível e halo na cor do projeto ou âmbar radiante
 */
export function animateItemUpdate(element: HTMLElement | null, projectColor?: string) {
  if (!element || isReducedMotion()) return;

  element.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const mainColor = getResolvedThemeColor(projectColor);
  const glowBorder = resolveColor(mainColor, 0.9);
  const glowSpread = resolveColor(mainColor, 0.5);

  const tl = gsap.timeline();

  tl.fromTo(
    element,
    {
      scale: 1,
      boxShadow: "none"
    },
    {
      scale: 1.05,
      boxShadow: `0 0 0 4px ${glowBorder}, 0 15px 45px ${glowSpread}`,
      duration: 0.22,
      ease: "power2.out"
    }
  )
  .to(element, {
    scale: 1,
    boxShadow: "0 0 0 0 rgba(0,0,0,0)",
    duration: 0.55,
    ease: "elastic.out(1.1, 0.4)",
    clearProps: "transform,boxShadow"
  });
}

/**
 * 4. EXCLUIR TAREFA OU NOTA (Dramatic Discard Animation)
 * Alerta em vermelho de descarte, recuo de antecipação e ejeção rápida
 */
export function animateItemExit(element: HTMLElement | null, onComplete: () => void) {
  if (!element || isReducedMotion()) {
    onComplete();
    return;
  }

  const tl = gsap.timeline({ onComplete });

  // 1. Antecipação: recuo com contorno vermelho de perigo (120ms)
  tl.to(element, {
    scale: 0.94,
    x: 10,
    boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.85), 0 10px 30px rgba(239, 68, 68, 0.4)",
    duration: 0.12,
    ease: "power1.out"
  })
  // 2. Ejeção: arremesso vigoroso para fora da tela com inclinação
  .to(element, {
    x: -140,
    rotation: -9,
    scale: 0.7,
    opacity: 0,
    duration: 0.28,
    ease: "power3.in"
  })
  // 3. Recolhimento do espaço ocupado
  .to(
    element,
    {
      height: 0,
      marginBottom: 0,
      paddingTop: 0,
      paddingBottom: 0,
      overflow: "hidden",
      duration: 0.2,
      ease: "power2.out"
    },
    "-=0.1"
  );
}

/**
 * 5. ADICIONAR REGISTRO / ANDAMENTO (Cinematic Timeline Reveal)
 * Elevação vertical na timeline com pulso luminoso na cor do projeto (Laranja)
 */
export function animateLogEntrance(element: HTMLElement | null, projectColor?: string) {
  if (!element || isReducedMotion()) return;

  element.scrollIntoView({ behavior: "smooth", block: "nearest" });

  const mainColor = getResolvedThemeColor(projectColor);
  const glowBorder = resolveColor(mainColor, 0.9);
  const glowSpread = resolveColor(mainColor, 0.45);

  const tl = gsap.timeline();

  tl.fromTo(
    element,
    {
      y: 50,
      scale: 0.8,
      autoAlpha: 0,
      boxShadow: `0 0 0 3px ${glowBorder}, 0 15px 35px ${glowSpread}`
    },
    {
      y: 0,
      scale: 1,
      autoAlpha: 1,
      duration: 0.5,
      ease: "back.out(2.0)",
      clearProps: "transform,opacity,visibility,boxShadow"
    }
  );

  tl.to(element, {
    boxShadow: "0 0 0 0 transparent",
    duration: 0.7,
    ease: "power2.out",
    clearProps: "boxShadow"
  }, "-=0.2");
}

/**
 * 6. CONCLUIR / REABRIR TAREFA (Victory Elastic Pop & Card Radiance)
 * Quando concluída: flash esmeralda radiante em TODO o card + pop gigante no checkmark
 */
export function animateTaskToggle(
  cardElement: HTMLElement | null,
  buttonElement: HTMLElement | null,
  isCompleted: boolean,
  onComplete?: () => void
) {
  if (isReducedMotion()) {
    onComplete?.();
    return;
  }

  const tl = gsap.timeline({ onComplete });

  if (isCompleted) {
    // 1. Checkmark pop gigante
    if (buttonElement) {
      tl.fromTo(
        buttonElement,
        { scale: 0.5, rotation: -45 },
        {
          scale: 1.6,
          rotation: 0,
          duration: 0.22,
          ease: "back.out(3.0)"
        }
      ).to(buttonElement, {
        scale: 1,
        duration: 0.18,
        ease: "power2.out",
        clearProps: "transform"
      });
    }

    // 2. Card inteiro: halo esmeralda vibrante e assentamento tátil
    if (cardElement) {
      tl.fromTo(
        cardElement,
        {
          scale: 1,
          boxShadow: "none"
        },
        {
          scale: 1.025,
          boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.9), 0 15px 45px rgba(16, 185, 129, 0.45)",
          duration: 0.22,
          ease: "power2.out"
        },
        0
      ).to(
        cardElement,
        {
          scale: 1,
          boxShadow: "0 0 0 0 transparent",
          duration: 0.65,
          ease: "elastic.out(1.1, 0.4)",
          clearProps: "transform,boxShadow"
        }
      );
    }
  } else {
    // Reabertura rápida e responsiva
    if (buttonElement) {
      tl.fromTo(
        buttonElement,
        { scale: 0.7 },
        {
          scale: 1.25,
          duration: 0.15,
          ease: "back.out(2)"
        }
      ).to(buttonElement, {
        scale: 1,
        duration: 0.15,
        clearProps: "transform"
      });
    }
  }
}

/**
 * 7. FECHAR MODAL DE DETALHES COM ANIMAÇÃO FÍSICA (Dismissal Ejection)
 * Coreografia inspirada no descarte expressivo de notas:
 * 1. Antecipação tátil com pop no botão e halo de celebração (esmeralda para concluída, acento para reaberta)
 * 2. Ejeção física da janela com inclinação (-6deg), aceleração lateral (x: -140, y: -30) e escala suave
 * 3. Fade-out simultâneo do backdrop
 */
export function animateModalCompleteExit(
  modalElement: HTMLElement | null,
  backdropElement: HTMLElement | null,
  isCompleted: boolean,
  onComplete?: () => void,
  buttonElement?: HTMLElement | null
) {
  if (isReducedMotion()) {
    onComplete?.();
    return;
  }

  if (!modalElement) {
    onComplete?.();
    return;
  }

  const tl = gsap.timeline({ onComplete });

  const glowColor = isCompleted
    ? "rgba(16, 185, 129, 0.9)"
    : "rgba(59, 130, 246, 0.9)";
  const shadowSpread = isCompleted
    ? "rgba(16, 185, 129, 0.45)"
    : "rgba(59, 130, 246, 0.45)";

  // 1. Antecipação tátil e halo radiante de celebração (130ms)
  tl.to(modalElement, {
    scale: 0.97,
    x: 8,
    y: 2,
    boxShadow: `0 0 0 3px ${glowColor}, 0 20px 50px ${shadowSpread}`,
    duration: 0.13,
    ease: "power1.out"
  });

  if (buttonElement) {
    tl.to(
      buttonElement,
      {
        scale: 1.18,
        duration: 0.13,
        ease: "back.out(2.5)"
      },
      0
    );
  }

  // 2. Ejeção física arremessada para fora da tela com inclinação estilo nota (280ms)
  tl.to(modalElement, {
    x: -140,
    y: -30,
    rotation: -6,
    scale: 0.8,
    opacity: 0,
    duration: 0.28,
    ease: "power3.in"
  });

  // 3. Fade-out suave do backdrop em paralelo
  if (backdropElement) {
    tl.to(
      backdropElement,
      {
        opacity: 0,
        duration: 0.26,
        ease: "power2.inOut"
      },
      0.08
    );
  }
}

