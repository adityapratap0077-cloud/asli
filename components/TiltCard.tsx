"use client";

import { useRef, useState } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  /** Max tilt in degrees. */
  max?: number;
}

/**
 * Mouse-tracked 3D tilt wrapper. Put `tilt-pop` / `tilt-pop-sm` on children
 * that should float above the card surface.
 */
export default function TiltCard({ children, className = "", max = 10 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg)");
  const [active, setActive] = useState(false);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTransform(
      `rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`
    );
  };

  return (
    <div className="tilt-scene">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={() => {
          setActive(false);
          setTransform("rotateX(0deg) rotateY(0deg)");
        }}
        className={`tilt-inner ${className}`}
        style={{
          transform,
          transition: active ? "transform 0.08s linear" : "transform 0.5s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
