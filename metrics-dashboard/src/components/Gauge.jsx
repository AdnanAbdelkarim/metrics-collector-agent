import React from 'react';

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

const Gauge = ({ value, label, color = '#3b82f6' }) => {
  // Auto-detect if value is decimal (0-1) or percentage (0-100)
  let pct;
  if (value <= 1 && value >= 0) {
    // Assume it's a decimal (0.2 means 20%)
    pct = value * 100;
  } else {
    // Assume it's already a percentage
    pct = clamp(value ?? 0, 0, 100);
  }
  
  const cx = 90, cy = 75, r = 65;

  const toXY = (deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const arcPath = (from, to) => {
    const start = toXY(from);
    const end = toXY(to);
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
  };

  const endAngle = -220 + (pct / 100) * 260;
  const needlePt = toXY(endAngle);
  const trackColor = pct > 80 ? '#ef4444' : pct > 60 ? '#f59e0b' : color;

  return (
    <svg viewBox="0 0 180 150" className="w-full max-w-xs mx-auto">
      <path d={arcPath(-220, 40)} fill="none" stroke="#334155" strokeWidth="14" strokeLinecap="round" />
      {pct > 0 && (
        <path d={arcPath(-220, endAngle)} fill="none" stroke={trackColor} strokeWidth="14" strokeLinecap="round" />
      )}
      <line x1={cx} y1={cy} x2={needlePt.x} y2={needlePt.y} stroke="#e2e8f0" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="5" fill="#e2e8f0" />
      <text x={cx} y={cy + 28} textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">
        {pct.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 44} textAnchor="middle" fill="#94a3b8" fontSize="10">
        {label}
      </text>
      <text x={cx - r - 4} y={cy + 14} textAnchor="end" fill="#64748b" fontSize="9">0</text>
      <text x={cx + r + 4} y={cy + 14} textAnchor="start" fill="#64748b" fontSize="9">100</text>
    </svg>
  );
};

export default Gauge;