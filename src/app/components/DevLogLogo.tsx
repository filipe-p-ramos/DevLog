"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
  gsap.config({ nullTargetWarn: false });
}

interface DevLogLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showAmbientGlow?: boolean;
  interactive?: boolean;
}

export default function DevLogLogo({
  size = "md",
  className,
  showAmbientGlow = true,
  interactive = true,
}: DevLogLogoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);

  // Mapeamento de dimensões para cada variante de tamanho
  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-16 h-16 rounded-2xl",
    xl: "w-20 h-20 sm:w-24 sm:h-24 rounded-[24px] sm:rounded-[32px]"
  };

  useGSAP(() => {
    if (!containerRef.current) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // 1. PRIMARY LAYER: Animação de Entrada Cinematográfica (Premium Tech Archetype)
    // Curva: back.out(1.4) com amortecimento refinado, duração 550ms
    gsap.fromTo(
      badgeRef.current,
      {
        scale: 0.78,
        rotation: -4,
        autoAlpha: 0,
        y: 6
      },
      {
        scale: 1,
        rotation: 0,
        autoAlpha: 1,
        y: 0,
        duration: 0.65,
        ease: "back.out(1.4)",
        clearProps: "transform,opacity,visibility"
      }
    );

    // 2. SECONDARY LAYER: Reflexo de Luz Especular (Sheen Sweep)
    if (sheenRef.current) {
      gsap.fromTo(
        sheenRef.current,
        { xPercent: -130, opacity: 0 },
        {
          xPercent: 150,
          opacity: 0.85,
          duration: 1.1,
          ease: "power2.inOut",
          delay: 0.35,
          clearProps: "transform,opacity"
        }
      );
    }

    // 3. AMBIENT LAYER: Respiração Contínua de Luz Atmosférica (Sine Breathing)
    if (showAmbientGlow && glowRef.current) {
      gsap.to(glowRef.current, {
        scale: 1.15,
        opacity: 0.75,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }
  }, { scope: containerRef, dependencies: [showAmbientGlow] });

  // Micro-interações táteis de Hover e Press via GSAP
  const handleMouseEnter = () => {
    if (!interactive) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Elevação suave com leve rotação tridimensional de foco
    gsap.to(badgeRef.current, {
      scale: 1.08,
      rotation: 1.5,
      y: -1.5,
      duration: 0.25,
      ease: "power2.out",
      boxShadow: "0 10px 25px -4px rgba(6,182,212,0.25), 0 8px 16px -6px rgba(245,158,11,0.2)"
    });

    if (glowRef.current) {
      gsap.to(glowRef.current, {
        scale: 1.35,
        opacity: 0.95,
        duration: 0.3,
        ease: "power2.out"
      });
    }

    // Dispara nova passagem de brilho especular no hover
    if (sheenRef.current) {
      gsap.fromTo(
        sheenRef.current,
        { xPercent: -130, opacity: 0 },
        {
          xPercent: 150,
          opacity: 0.75,
          duration: 0.65,
          ease: "power2.out"
        }
      );
    }
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Retorno suave à posição de repouso
    gsap.to(badgeRef.current, {
      scale: 1,
      rotation: 0,
      y: 0,
      duration: 0.35,
      ease: "power3.out",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      clearProps: "transform,boxShadow"
    });

    if (glowRef.current) {
      gsap.to(glowRef.current, {
        scale: 1,
        opacity: 0.45,
        duration: 0.4,
        ease: "power2.out"
      });
    }
  };

  const handleMouseDown = () => {
    if (!interactive) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Anticipation / Squash feedback físico ao pressionar
    gsap.to(badgeRef.current, {
      scale: 0.94,
      y: 1,
      duration: 0.1,
      ease: "power1.in"
    });
  };

  const handleMouseUp = () => {
    if (!interactive) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    // Elastic recoil
    gsap.to(badgeRef.current, {
      scale: 1.08,
      y: -1.5,
      duration: 0.2,
      ease: "back.out(2)"
    });
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-flex items-center justify-center select-none flex-shrink-0", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* CAMADA 1: AMBIENT GLOW (Halo ciano e âmbar difuso) */}
      {showAmbientGlow && (
        <div
          ref={glowRef}
          aria-hidden="true"
          className={cn(
            "absolute inset-0 -z-10 rounded-full blur-md sm:blur-lg opacity-40 pointer-events-none transition-opacity",
            "bg-gradient-to-tr from-cyan-500/40 via-sky-500/20 to-amber-500/40"
          )}
        />
      )}

      {/* CAMADA 2: PRIMARY EMBLEM (Container do Logo com Borda e Sombra) */}
      <div
        ref={badgeRef}
        className={cn(
          "relative overflow-hidden border border-[var(--border)] bg-[#111317]/80 backdrop-blur-md shadow-md flex items-center justify-center cursor-pointer transition-shadow",
          sizeClasses[size]
        )}
      >
        <img
          src="/logo-devlog.png"
          alt="Logo DevLog"
          className="w-full h-full object-cover pointer-events-none"
        />

        {/* CAMADA 3: SECONDARY SHEEN (Reflexo Especular de Vidro Fosco) */}
        <div
          ref={sheenRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/35 to-transparent -skew-x-12 pointer-events-none opacity-0"
        />
      </div>
    </div>
  );
}
