import React from "react";

interface Props {
  count: number;
  maxCapacity: number;
  onMaxChange: (v: number) => void;
}

const CapacityGauge: React.FC<Props> = ({
  count,
  maxCapacity,
  onMaxChange,
}) => {
  const pct = Math.min(100, Math.round((count / maxCapacity) * 100));

  const cx = 90,
    cy = 90,
    r = 70;
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const totalArc = endAngle - startAngle;
  const sweepAngle = (pct / 100) * totalArc;

  const polarToCart = (angle: number, radius: number) => ({
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  });

  const trackStart = polarToCart(startAngle, r);
  const trackEnd = polarToCart(endAngle, r);
  const fillEnd = polarToCart(startAngle + sweepAngle, r);

  const trackPath = `M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 1 1 ${trackEnd.x} ${trackEnd.y}`;
  const fillPath =
    pct === 0
      ? ""
      : `M ${trackStart.x} ${trackStart.y} A ${r} ${r} 0 ${sweepAngle > Math.PI ? 1 : 0} 1 ${fillEnd.x} ${fillEnd.y}`;

  const color = pct >= 100 ? "#c45c5c" : pct >= 80 ? "#d4a843" : "#63b394";

  return (
    <div className="gauge-wrapper">
      <div className="gauge-svg-wrap">
        <svg width="180" height="110" viewBox="0 0 180 110">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={color} stopOpacity="0.6" />
              <stop offset="100%" stopColor={color} />
            </linearGradient>
          </defs>
          {/* Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Fill */}
          {fillPath && (
            <path
              d={fillPath}
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="12"
              strokeLinecap="round"
            />
          )}
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const a = startAngle + (tick / 100) * totalArc;
            const inner = polarToCart(a, r - 10);
            const outer = polarToCart(a, r + 2);
            return (
              <line
                key={tick}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="1.5"
              />
            );
          })}
        </svg>
        <div className="gauge-label-center">
          <div className="gauge-pct" style={{ color }}>
            {pct}%
          </div>
          <div className="gauge-pct-label">Capacity</div>
        </div>
      </div>
      <div className="gauge-max-row">
        <span className="gauge-max-label">Max Capacity</span>
        <input
          className="capacity-input"
          type="number"
          min={1}
          max={9999}
          value={maxCapacity}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            if (!isNaN(v) && v > 0) onMaxChange(v);
          }}
        />
      </div>
    </div>
  );
};

export default CapacityGauge;
