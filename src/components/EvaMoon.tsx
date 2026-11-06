import { useEffect, useRef } from "react";

/**
 * A procedural AT-field moon: a pale, icy sphere with a slow-turning
 * red lattice and star-shaped nodes. No external artwork is used.
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

      const R = Math.min(w, h) * 0.405;
      const cx = w * 0.5;
      const cy = h * 0.5;
      const tilt = 0.16;
      // the globe is not upright: its spin axis leans about 18° on screen
      const axialTilt = 0.38;
      const ca = Math.cos(axialTilt);
      const sa = Math.sin(axialTilt);
      const rot = reduced ? 0.4 : time * 0.05;

      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      const projectPoint = (x: number, y: number, z: number) => {
        // spin around the local vertical axis
        const sx = x * cosR + z * sinR;
        const sz = -x * sinR + z * cosR;
        const sy = y;
        // lean that axis on screen
        const ax = sx * ca - sy * sa;
        const ay = sx * sa + sy * ca;
        // mild camera elevation
        const vy = ay * Math.cos(tilt) - sz * Math.sin(tilt);
        const vz = ay * Math.sin(tilt) + sz * Math.cos(tilt);
        return { x: cx + R * ax, y: cy - R * vy, z: vz };
      };

      const project = (lat: number, lon: number) => {
        const phi = (lat * Math.PI) / 180;
        const lambda = (lon * Math.PI) / 180;
        return projectPoint(
          Math.cos(phi) * Math.cos(lambda),
          Math.sin(phi),
          Math.cos(phi) * Math.sin(lambda)
        );
      };

      // cold atmospheric halo
      const halo = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 1.55);
      halo.addColorStop(0, "rgba(158, 232, 255, 0.16)");
      halo.addColorStop(0.42, "rgba(82, 177, 255, 0.1)");
      halo.addColorStop(0.74, "rgba(101, 108, 255, 0.055)");
      halo.addColorStop(1, "rgba(80, 117, 255, 0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // the moon itself
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      const body = ctx.createRadialGradient(
        cx - R * 0.35,
        cy - R * 0.42,
        R * 0.03,
        cx,
        cy,
        R * 1.12
      );
      body.addColorStop(0, "rgba(255, 255, 255, 1)");
      body.addColorStop(0.2, "rgba(252, 255, 255, 1)");
      body.addColorStop(0.43, "rgba(238, 253, 255, 0.99)");
      body.addColorStop(0.62, "rgba(205, 245, 255, 0.97)");
      body.addColorStop(0.8, "rgba(151, 226, 255, 0.94)");
      body.addColorStop(0.93, "rgba(72, 152, 216, 0.9)");
      body.addColorStop(1, "rgba(8, 24, 57, 0.9)");
      ctx.fillStyle = body;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      // broad icy patches, fixed to the rotating surface
      for (let i = 0; i < 72; i++) {
        const lat = -78 + seeded(i + 3) * 156;
        const lon = seeded(i * 2 + 17) * 360;
        const p = project(lat, lon);
        if (p.z <= 0.06) continue;
        const size = R * (0.025 + seeded(i + 31) * 0.095) * (0.45 + p.z * 0.55);
        const cloud = ctx.createRadialGradient(
          p.x - size * 0.2,
          p.y - size * 0.2,
          size * 0.04,
          p.x,
          p.y,
          size
        );
        cloud.addColorStop(0, `rgba(255,255,255,${0.44 + seeded(i + 5) * 0.34})`);
        cloud.addColorStop(0.48, `rgba(226,251,255,${0.2 + seeded(i + 9) * 0.22})`);
        cloud.addColorStop(1, "rgba(140, 220, 255, 0)");
        ctx.fillStyle = cloud;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // large irregular ice patches, like the bright maria in the reference
      for (let i = 0; i < 24; i++) {
        const lat = -68 + seeded(i + 211) * 136;
        const lon = seeded(i * 5 + 53) * 360;
        const p = project(lat, lon);
        if (p.z <= 0.13) continue;
        const size = R * (0.045 + seeded(i + 17) * 0.075) * (0.55 + p.z * 0.45);
        for (let j = 0; j < 4; j++) {
          const ox = (seeded(i * 7 + j + 91) - 0.5) * size * 0.7;
          const oy = (seeded(i * 11 + j + 37) - 0.5) * size * 0.7;
          const rr = size * (0.42 + seeded(i + j + 19) * 0.45);
          const ice = ctx.createRadialGradient(
            p.x + ox - rr * 0.2,
            p.y + oy - rr * 0.25,
            0,
            p.x + ox,
            p.y + oy,
            rr
          );
          ice.addColorStop(0, "rgba(255, 255, 255, 0.9)");
          ice.addColorStop(0.38, "rgba(245, 255, 255, 0.62)");
          ice.addColorStop(0.7, "rgba(213, 247, 255, 0.24)");
          ice.addColorStop(1, "rgba(181, 235, 255, 0)");
          ctx.fillStyle = ice;
          ctx.beginPath();
          ctx.arc(p.x + ox, p.y + oy, rr, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // a few brighter craters with a cool rim
      for (let i = 0; i < 18; i++) {
        const lat = -65 + seeded(i + 101) * 130;
        const lon = seeded(i * 3 + 41) * 360;
        const p = project(lat, lon);
        if (p.z <= 0.12) continue;
        const size = R * (0.022 + seeded(i + 13) * 0.055) * (0.55 + p.z * 0.45);
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(43, 116, 179, 0.1)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x - size * 0.2, p.y - size * 0.24, size * 0.82, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, Math.PI * 0.92, Math.PI * 1.82);
        ctx.strokeStyle = "rgba(235, 253, 255, 0.22)";
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }

      // central white flare and fine ice-grain
      const flareX = cx - R * 0.13;
      const flareY = cy - R * 0.2;
      const flare = ctx.createRadialGradient(flareX, flareY, 0, flareX, flareY, R * 0.34);
      flare.addColorStop(0, "rgba(255, 255, 255, 0.92)");
      flare.addColorStop(0.14, "rgba(255, 255, 255, 0.6)");
      flare.addColorStop(0.45, "rgba(211, 247, 255, 0.16)");
      flare.addColorStop(1, "rgba(155, 230, 255, 0)");
      ctx.fillStyle = flare;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      for (let i = 0; i < 900; i++) {
        const a = seeded(i + 301) * Math.PI * 2;
        const rr = Math.sqrt(seeded(i + 71)) * R * 0.97;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        const size = i % 11 === 0 ? 1.6 : 0.8;
        ctx.fillStyle =
          i % 3 === 0
            ? "rgba(255,255,255,0.2)"
            : i % 5 === 0
              ? "rgba(68,148,214,0.2)"
              : "rgba(178,230,255,0.11)";
        ctx.fillRect(x, y, size, size);
      }

      // a few icy scratches
      for (let i = 0; i < 26; i++) {
        const a = seeded(i + 451) * Math.PI * 2;
        const rr = Math.sqrt(seeded(i + 61)) * R * 0.78;
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        const len = R * (0.025 + seeded(i + 27) * 0.06);
        const dir = seeded(i + 111) * Math.PI;
        ctx.strokeStyle = `rgba(255,255,255,${0.04 + seeded(i + 23) * 0.08})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
          x + Math.cos(dir + 0.4) * len * 0.5,
          y + Math.sin(dir + 0.4) * len * 0.5,
          x + Math.cos(dir) * len,
          y + Math.sin(dir) * len
        );
        ctx.stroke();
      }

      // A hand-drawn spherical lattice, deliberately a little loose.
      const gridPoint = (lat: number, lon: number) => {
        const p = project(lat, lon);
        const jx = Math.sin((lon + 37) * 0.12 + lat * 0.63) * 0.35;
        const jy = Math.cos((lon - 11) * 0.15 + lat * 0.71) * 0.28;
        return { x: p.x + jx, y: p.y + jy, z: p.z };
      };

      const drawGrid = (points: { x: number; y: number; z: number }[]) => {
        const path = new Path2D();
        let started = false;
        for (const p of points) {
          if (p.z > 0) {
            if (!started) { path.moveTo(p.x, p.y); started = true; }
            else path.lineTo(p.x, p.y);
          } else started = false;
        }
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = "rgba(100, 0, 20, 0.22)";
        ctx.shadowBlur = 2;
        ctx.strokeStyle = "rgba(112, 0, 25, 0.8)";
        ctx.lineWidth = 4.8;
        ctx.stroke(path);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(206, 32, 52, 0.96)";
        ctx.lineWidth = 2.2;
        ctx.stroke(path);
        ctx.strokeStyle = "rgba(255, 135, 145, 0.24)";
        ctx.lineWidth = 0.55;
        ctx.stroke(path);
        ctx.restore();
      };

      for (let lat = -60; lat <= 60; lat += 30) {
        drawGrid(
          Array.from({ length: 145 }, (_, i) => gridPoint(lat, -180 + i * 2.5))
        );
      }
      for (let lon = -180; lon < 180; lon += 360 / 14) {
        drawGrid(
          Array.from({ length: 83 }, (_, i) => gridPoint(-82 + i * 2, lon))
        );
      }

      const node = (x: number, y: number, alpha: number) => {
        const outer = 7.6 + alpha * 5.6;
        const inner = outer * 0.2;
        ctx.save();
        ctx.globalAlpha = 0.68 + alpha * 0.32;
        ctx.shadowColor = "rgba(112, 0, 22, 0.28)";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "rgba(200, 30, 48, 0.98)";
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
          const a = -Math.PI / 2 + (k * Math.PI) / 4;
          const r = k % 2 === 0 ? outer : inner;
          const px = x + Math.cos(a) * r;
          const py = y + Math.sin(a) * r;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(123, 0, 23, 0.8)";
        ctx.lineWidth = 1.2;
        for (let k = 0; k < 4; k++) {
          const a = Math.PI / 4 + (k * Math.PI) / 2;
          ctx.beginPath();
          ctx.moveTo(x + Math.cos(a) * outer * 0.18, y + Math.sin(a) * outer * 0.18);
          ctx.lineTo(x + Math.cos(a) * outer * 1.55, y + Math.sin(a) * outer * 1.55);
          ctx.stroke();
        }
        ctx.restore();
      };

      for (let lat = -60; lat <= 60; lat += 30) {
        for (let lon = -180; lon < 180; lon += 360 / 14) {
          const p = gridPoint(lat, lon);
          if (p.z > 0.12) node(p.x, p.y, p.z);
        }
      }

      // shadowed limb and hot rim
      const limb = ctx.createRadialGradient(cx, cy, R * 0.76, cx, cy, R);
      limb.addColorStop(0, "rgba(3, 10, 25, 0)");
      limb.addColorStop(0.82, "rgba(6, 20, 48, 0.08)");
      limb.addColorStop(1, "rgba(2, 7, 18, 0.48)");
      ctx.fillStyle = limb;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

      ctx.strokeStyle = "rgba(186, 245, 255, 0.55)";
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255, 35, 50, 0.55)";
      ctx.lineWidth = 1.7;
      ctx.shadowColor = "rgba(255, 25, 40, 0.7)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(cx, cy, R - 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // sparse cold stars
      ctx.fillStyle = "rgba(225, 245, 255, 0.65)";
      for (let i = 0; i < 22; i++) {
        const a = seeded(i + 80) * Math.PI * 2;
        const rr = R * (1.12 + seeded(i + 91) * 0.38);
        const x = cx + Math.cos(a) * rr;
        const y = cy + Math.sin(a) * rr;
        if (x < 0 || y < 0 || x > w || y > h) continue;
        ctx.globalAlpha = 0.1 + seeded(i + 70) * 0.32;
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
