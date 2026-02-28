import React, { useEffect, useRef } from "react";
import type { LogEntry } from "../hooks/useSerial";

interface Props {
  log: LogEntry[];
}

const LineChart: React.FC<Props> = ({ log }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width,
      H = rect.height;
    ctx.clearRect(0, 0, W, H);

    if (log.length < 2) return;

    const pts = [...log]
      .reverse()
      .slice(0, 40)
      .map((e) => e.count);
    const maxV = Math.max(...pts, 1);

    const pL = 30,
      pR = 10,
      pT = 10,
      pB = 22;
    const cW = W - pL - pR;
    const cH = H - pT - pB;
    const step = cW / (pts.length - 1);

    const x = (i: number) => pL + i * step;
    const y = (v: number) => pT + cH - (v / maxV) * cH;

    // Y-axis labels
    ctx.fillStyle = "rgba(160,158,151,0.9)";
    ctx.font = `10px 'DM Mono', monospace`;
    ctx.textAlign = "right";
    [0, Math.ceil(maxV / 2), maxV].forEach((v) => {
      ctx.fillText(String(v), pL - 4, y(v) + 4);
    });

    // Grid lines
    ctx.strokeStyle = "rgba(226,224,216,0.8)";
    ctx.lineWidth = 1;
    [0, Math.ceil(maxV / 2), maxV].forEach((v) => {
      ctx.beginPath();
      ctx.moveTo(pL, y(v));
      ctx.lineTo(W - pR, y(v));
      ctx.stroke();
    });

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pT, 0, pT + cH);
    grad.addColorStop(0, "rgba(61,107,158,0.15)");
    grad.addColorStop(1, "rgba(61,107,158,0)");
    ctx.beginPath();
    ctx.moveTo(x(0), y(pts[0]));
    for (let i = 1; i < pts.length; i++) {
      const mx = (x(i - 1) + x(i)) / 2;
      ctx.bezierCurveTo(mx, y(pts[i - 1]), mx, y(pts[i]), x(i), y(pts[i]));
    }
    ctx.lineTo(x(pts.length - 1), pT + cH);
    ctx.lineTo(x(0), pT + cH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(x(0), y(pts[0]));
    for (let i = 1; i < pts.length; i++) {
      const mx = (x(i - 1) + x(i)) / 2;
      ctx.bezierCurveTo(mx, y(pts[i - 1]), mx, y(pts[i]), x(i), y(pts[i]));
    }
    ctx.strokeStyle = "#3d6b9e";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Last point dot
    const lx = x(pts.length - 1),
      ly = y(pts[pts.length - 1]);
    ctx.beginPath();
    ctx.arc(lx, ly, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#3d6b9e";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lx, ly, 7, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(61,107,158,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // X-axis time labels (first / last)
    if (log.length >= 2) {
      const oldest = [...log].reverse()[0];
      const newest = log[0];
      const fmt = (d: Date) =>
        d.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      ctx.fillStyle = "rgba(160,158,151,0.9)";
      ctx.font = `10px 'DM Mono', monospace`;
      ctx.textAlign = "left";
      ctx.fillText(fmt(oldest.timestamp), pL, H - 4);
      ctx.textAlign = "right";
      ctx.fillText(fmt(newest.timestamp), W - pR, H - 4);
    }
  }, [log]);

  if (log.length < 2) {
    return (
      <div className="chart-empty">Connect device to see occupancy chart</div>
    );
  }

  return (
    <div className="chart-wrap">
      <canvas ref={ref} className="line-chart" style={{ height: 140 }} />
    </div>
  );
};

export default LineChart;
