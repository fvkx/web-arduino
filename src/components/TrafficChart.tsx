import React, { useEffect, useRef } from "react";
import type { LogEntry } from "../hooks/useSerial";

interface Props {
  log: LogEntry[];
}

const TrafficChart: React.FC<Props> = ({ log }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    ctx.clearRect(0, 0, W, H);

    if (log.length === 0) return;

    // Build buckets (last 20 events, show count over time)
    const points = [...log]
      .reverse()
      .slice(0, 30)
      .map((e) => e.count);
    const maxVal = Math.max(...points, 1);

    const padL = 32,
      padR = 12,
      padT = 12,
      padB = 24;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    const gridLines = 4;
    for (let i = 0; i <= gridLines; i++) {
      const y = padT + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();

      const val = Math.round(maxVal - (maxVal / gridLines) * i);
      ctx.fillStyle = "rgba(74,80,104,0.9)";
      ctx.font = "10px 'Space Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(String(val), padL - 4, y + 4);
    }

    if (points.length < 2) return;

    const stepX = chartW / (points.length - 1);

    const getX = (i: number) => padL + i * stepX;
    const getY = (v: number) => padT + chartH - (v / maxVal) * chartH;

    // Fill area
    const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
    grad.addColorStop(0, "rgba(99,179,148,0.25)");
    grad.addColorStop(1, "rgba(99,179,148,0.01)");

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(points[0]));
    for (let i = 1; i < points.length; i++) {
      const cpX = (getX(i - 1) + getX(i)) / 2;
      ctx.bezierCurveTo(
        cpX,
        getY(points[i - 1]),
        cpX,
        getY(points[i]),
        getX(i),
        getY(points[i]),
      );
    }
    ctx.lineTo(getX(points.length - 1), padT + chartH);
    ctx.lineTo(getX(0), padT + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(points[0]));
    for (let i = 1; i < points.length; i++) {
      const cpX = (getX(i - 1) + getX(i)) / 2;
      ctx.bezierCurveTo(
        cpX,
        getY(points[i - 1]),
        cpX,
        getY(points[i]),
        getX(i),
        getY(points[i]),
      );
    }
    ctx.strokeStyle = "#63b394";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots on last point
    const lastX = getX(points.length - 1);
    const lastY = getY(points[points.length - 1]);
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#63b394";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(99,179,148,0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [log]);

  if (log.length === 0) {
    return (
      <div className="chart-empty">
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          viewBox="0 0 24 24"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span>No data yet — connect to start tracking</span>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <canvas
        ref={canvasRef}
        className="chart-canvas"
        style={{ height: 160 }}
      />
    </div>
  );
};

export default TrafficChart;
