import React, { useEffect, useRef, useMemo } from 'react';
import type { LogEntry } from '../hooks/useSerial';
import type { ChartConfiguration, Chart as ChartType } from 'chart.js';

interface Props {
  log: LogEntry[];
}

const OccupancyChart: React.FC<Props> = ({ log }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartType | null>(null);

  const chartData = useMemo(() =>
    log.map(entry => ({
      time: entry.timestamp.toLocaleTimeString('en-US', { hour12: false }),
      count: entry.count,
    })),
    [log]
  );

  const counts = chartData.map(d => d.count);
  const peak = counts.length ? Math.max(...counts) : 0;
  const avg = counts.length ? Math.round(counts.reduce((a, b) => a + b, 0) / counts.length) : 0;
  const current = counts.length ? counts[counts.length - 1] : 0;

  useEffect(() => {
    if (!canvasRef.current) return;

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const lineColor = '#378ADD';
    const fillColor = isDark ? 'rgba(55,138,221,0.12)' : 'rgba(55,138,221,0.08)';
    const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
    const tickColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: chartData.map(d => d.time),
        datasets: [{
          data: chartData.map(d => d.count),
          borderColor: lineColor,
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: lineColor,
          pointBorderColor: isDark ? '#1a1a1a' : '#ffffff',
          pointBorderWidth: 2,
          fill: true,
          backgroundColor: fillColor,
          tension: 0.4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: true } },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
            border: { display: false },
          },
          y: {
            min: 0,
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { size: 11 }, maxTicksLimit: 5 },
            border: { display: false },
          },
        },
      },
    };

    if (chartRef.current) {
      chartRef.current.data.labels = config.data.labels;
      chartRef.current.data.datasets[0].data = config.data.datasets[0].data;
      chartRef.current.update();
    } else {
      // Dynamic import avoids the need for window.Chart and keeps types clean
      import('chart.js').then(({ Chart, registerables }) => {
        Chart.register(...registerables);
        if (canvasRef.current) {
          chartRef.current = new Chart(canvasRef.current, config);
        }
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartData]);

  return (
    <div className="dash-card occupancy-chart" style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="dash-card-head" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>Occupancy over time</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{log.length} events</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
        {[
          { label: 'Current', value: current },
          { label: 'Peak',    value: peak    },
          { label: 'Average', value: avg     },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: 'var(--color-text-primary)' }}>{log.length ? value : '—'}</div>
          </div>
        ))}
      </div>

      {log.length === 0 ? (
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center', padding: '3rem 0' }}>
          No occupancy data yet
        </div>
      ) : (
        <div style={{ position: 'relative', width: '100%', height: 220 }}>
          <canvas ref={canvasRef} />
        </div>
      )}
    </div>
  );
};

export default OccupancyChart;