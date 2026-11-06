import { useEffect, useRef } from "react";

/**
 * A procedural AT-field moon: a slow-turning blue sphere with a
 * latitude/longitude lattice and red nodes. No external artwork is used.
 */
export function EvaMoon() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let raf = 0;

    const seeded = (n: number) => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    const draw = (time: number) => {
      const w = width;
      const h = height;
      if (w <= 0 || h <= 0) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const R = Math.min(w, h) * 0.365;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const tilt = 0.17;
      const rot = reduced ? 0.4 : time * 0.05;

      // atmospheric halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.72, cx, cy, R * 1.62);
      halo.addColorStop(0, "rgba(87, 230, 255, 0.13)");
      halo.addColorStop(0.52, "rgba(104, 151, 255, 0.07)");
      halo.addColorStop(1, "rgba(87, 230, 255, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.62, 0, Math.PI * 2);
      ctx.fill();

      const project = (lat: number, lon: number) => {
        const phi = (lat * Math.PI) / 180;
        const lambda = (lon * Math.PI) / 180 + rot;
        const x = Math.cos(phi) * Math.cos(lambda);
        const y = Math.sin(phi);
        const z = Math.cos(phi) * Math.sin(lambda);
        const yy = y * Math.cos(tilt) - z * Math.sin(tilt);
        const zz = y * Math.sin(tilt) + z * Math.cos(tilt);
        return { x: cx + R * x, y: cy - R * yy, z: zz };
      };

      // the sphere
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      const body = ctx.createRadialGradient(
        cx - R * 0.38,
        cy - R * 0.42,
        R * 0.08,
        cx,
        cy,
        R * 1.15
      );
      body.addColorStop(0, "rgba(236, 252, 255, 0.97)");
      body.addColorStop(0.34, "rgba(190, 232, 255, 0.88)");
      body.addColorStop(0.66, "rgba(92, 153, 218, 0.68)");
      body.addColorStop(0.88, "rgba(23, 48, 102, 0.54)");
      body.addColorStop(1, "rgba(4, 9, 24, 0.72)");
      ctx.fillStyle = body;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // faint surface mottling and craters, fixed to the rotating sphere
      for (let i = 0; i < 34; i++) {
        const lat = -70 + seeded(i + 3) * 140;
        const lon = seeded(i * 2 + 17) * 360;
        const p = project(lat, lon);
        if (p.z <= 0.1) continue;
        const cr = R * (0.015 + seeded(i + 31) * 0.065) * (0.55 + p.z * 0.45);
        ctx.beginPath();
        ctx.arc(p.x, p.y, cr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(31, 94, 164, ${0.035 + seeded(i + 9) * 0.06})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x - cr * 0.25, p.y - cr * 0.28, cr * 0.72, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(235, 250, 255, ${0.05 + seeded(i + 21) * 0.08})`;
        ctx.fill();
      }

      // the lattice
      ctx.lineCap = "round";
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = "rgba(225, 248, 255, 0.27)";
      for (let lat = -60; lat <= 60; lat += 20) {
        let started = false;
        ctx.beginPath();
        for (let lon = -180; lon <= 180; lon += 4) {
          const p = project(lat, lon);
          if (p.z > 0) {
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }
      for (let lon = -180; lon < 180; lon += 30) {
        let started = false;
        ctx.beginPath();
        for (let lat = -80; lat <= 80; lat += 3) {
          const p = project(lat, lon);
          if (p.z > 0) {
            if (!started) {
              ctx.moveTo(p.x, p.y);
              started = true;
            } else {
              ctx.lineTo(p.x, p.y);
            }
          } else {
            started = false;
          }
        }
        ctx.stroke();
      }

      // red AT-field nodes at the visible intersections
      ctx.shadowColor = "rgba(255, 32, 32, 0.9)";
      ctx.shadowBlur = 8;
      for (let lat = -60; lat <= 60; lat += 20) {
        for (let lon = -180; lon < 180; lon += 30) {
          const p = project(lat, lon);
          if (p.z <= 0.13) continue;
          const fade = Math.min(1, p.z * 1.8);
          ctx.globalAlpha = fade;
          ctx.strokeStyle = "rgba(255, 39, 39, 0.95)";
          ctx.lineWidth = 1.1;
          const s = 3.5 + p.z * 2.2;
          ctx.beginPath();
          ctx.moveTo(p.x - s, p.y);
          ctx.lineTo(p.x + s, p.y);
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x, p.y + s);
          ctx.stroke();
          ctx.fillStyle = "rgba(255, 52, 52, 0.9)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.15, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // dark limb and red rim
      const limb = ctx.createRadialGradient(cx, cy, R * 0.78, cx, cy, R);
      limb.addColorStop(0, "rgba(2, 7, 18, 0)");
      limb.addColorStop(1, "rgba(2, 7, 18, 0.44)");
      ctx.fillStyle = limb;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.strokeStyle = "rgba(255, 46, 46, 0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // a few cold stars around the halo
      ctx.fillStyle = "rgba(225, 245, 255, 0.5)";
      for (let i = 0; i < 18; i++) {
        const a = seeded(i + 80) * Math.PI * 2;
        const rr = R * (1.15 + seeded(i + 91) * 0.48);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (x < 0 || y < 0 || x > w || y > h) continue;
        ctx.globalAlpha = 0.12 + seeded(i + 70) * 0.35;
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      draw(0);
    };

    const loop = (now: number) => {
      draw(now / 1000);
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    if (!reduced) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className="eva-moon" aria-hidden="true" />;
}
