"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

/** Número que cuenta desde 0 (o desde el valor anterior) hasta `value`. */
export function CountUp({ value, duration = 1.2, className, format }: { value: number; duration?: number; className?: string; format?: (n: number) => string }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, duration]);
  return <span className={className}>{format ? format(display) : display.toLocaleString("es-CO")}</span>;
}
