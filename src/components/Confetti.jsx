import { useEffect, useRef } from "react";

const COLORS = ["#e2b714", "#ef4444", "#22c55e", "#a855f7", "#06b6d4", "#f59e0b", "#ec4899", "#3b82f6"];

// Props: { trigger } — re-fires burst whenever trigger value changes
export default function Confetti({ trigger }) {
  const canvasRef = useRef();
  const animRef = useRef();
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Resize canvas to full window
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Spawn 90 particles from center-top area
    particlesRef.current = Array.from({ length: 90 }, () => ({
      x: canvas.width * (0.3 + Math.random() * 0.4),
      y: canvas.height * 0.2,
      vx: (Math.random() - 0.5) * 10,
      vy: -(4 + Math.random() * 6),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: 6 + Math.random() * 6,
      h: 10 + Math.random() * 8,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.2,
      alpha: 1,
    }));

    const startTime = Date.now();
    const DURATION = 4000;

    const tick = () => {
      if (Date.now() - startTime > DURATION) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cancelAnimationFrame(animRef.current);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = false;
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.99; // air resistance
        p.rot += p.rotV;
        p.alpha = Math.max(0, p.alpha - 0.008);

        if (p.alpha > 0 && p.y < canvas.height) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }

      if (alive) animRef.current = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animRef.current);
  }, [trigger]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", inset: 0,
        pointerEvents: "none",
        zIndex: 999,
        width: "100vw", height: "100vh",
      }}
    />
  );
}
