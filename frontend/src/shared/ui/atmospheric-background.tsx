"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";

type FogLayer = {
  className: string;
  background: CSSProperties["background"];
  duration: number;
  x: number[];
  y: number[];
  scale: number[];
  opacity: number[];
};

const layers: FogLayer[] = [
  {
    className:
      "left-[-10rem] top-[-8rem] h-[34rem] w-[44rem] blur-2xl",
    background:
      "radial-gradient(ellipse at center, rgba(96, 113, 123, 0.34) 0%, rgba(148, 162, 170, 0.18) 38%, rgba(231, 234, 235, 0) 74%)",
    duration: 42,
    x: [0, 38, 16, 0],
    y: [0, 22, 46, 0],
    scale: [1, 1.04, 0.98, 1],
    opacity: [0.72, 0.92, 0.68, 0.72],
  },
  {
    className:
      "right-[-12rem] top-[-7rem] h-[34rem] w-[42rem] blur-2xl",
    background:
      "radial-gradient(ellipse at center, rgba(203, 210, 213, 0.62) 0%, rgba(117, 133, 142, 0.18) 42%, rgba(231, 234, 235, 0) 76%)",
    duration: 48,
    x: [0, -34, -12, 0],
    y: [0, 24, 10, 0],
    scale: [1, 0.97, 1.05, 1],
    opacity: [0.62, 0.78, 0.54, 0.62],
  },
  {
    className:
      "bottom-[-14rem] left-[-8rem] h-[36rem] w-[48rem] blur-2xl",
    background:
      "radial-gradient(ellipse at center, rgba(247, 248, 246, 0.86) 0%, rgba(188, 197, 201, 0.26) 42%, rgba(231, 234, 235, 0) 78%)",
    duration: 36,
    x: [0, 22, 38, 0],
    y: [0, -18, -36, 0],
    scale: [1, 1.06, 1.01, 1],
    opacity: [0.52, 0.68, 0.48, 0.52],
  },
  {
    className:
      "bottom-[-12rem] right-[-14rem] hidden h-[32rem] w-[42rem] blur-2xl md:block",
    background:
      "radial-gradient(ellipse at center, rgba(148, 162, 170, 0.3) 0%, rgba(220, 225, 227, 0.22) 40%, rgba(231, 234, 235, 0) 76%)",
    duration: 44,
    x: [0, -18, -42, 0],
    y: [0, -22, -10, 0],
    scale: [1, 1.03, 0.98, 1],
    opacity: [0.46, 0.62, 0.42, 0.46],
  },
];

export function AtmosphericBackground() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden max-sm:opacity-65"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_14%,rgba(247,248,246,0.72)_0%,rgba(231,234,235,0)_58%)]" />
      {layers.map((layer, index) => (
        <motion.div
          key={index}
          className={`absolute rounded-full will-change-transform ${layer.className}`}
          style={{ background: layer.background }}
          initial={false}
          animate={
            reduceMotion
              ? {
                  x: 0,
                  y: 0,
                  scale: 1,
                  opacity: layer.opacity[0] * 0.72,
                }
              : {
                  x: layer.x,
                  y: layer.y,
                  scale: layer.scale,
                  opacity: layer.opacity,
                }
          }
          transition={
            reduceMotion
              ? { duration: 0 }
              : {
                  duration: layer.duration,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </div>
  );
}
