import React from 'react';
import { mean } from '../utils/metricHelpers';

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const VISIBLE_HOURS = HOURS.filter((_, i) => i % 3 === 0);

const cellColor = (v) => {
  if (v === null) return '#1e293b';
  if (v > 80) return '#ef4444';
  if (v > 60) return '#f59e0b';
  if (v > 40) return '#3b82f6';
  return '#1d4ed8';
};

const Heatmap = ({ data, metricKey, title }) => {
  const grid = {};
  DAYS.forEach((d) => {
    grid[d] = {};
    HOURS.forEach((h) => { grid[d][h] = []; });
  });

  data.forEach((m) => {
    const dt = new Date(m.timestamp);
    const day = DAYS[dt.getDay()];
    const hour = `${String(dt.getHours()).padStart(2, '0')}:00`;
    if (grid[day]?.[hour] !== undefined) {
      grid[day][hour].push(parseFloat(m[metricKey]));
    }
  });

  const cellVal = (d, h) => {
    const arr = grid[d][h];
    return arr.length ? mean(arr) : null;
  };

  return (
    <div className="heatmap-container">
      <h3 className="heatmap-title">{title}</h3>
      <div className="heatmap-grid" style={{
        display: 'grid',
        gridTemplateColumns: `40px repeat(${VISIBLE_HOURS.length}, 1fr)`,
        gap: 3
      }}>
        <div />
        {VISIBLE_HOURS.map((h) => (
          <div key={h} className="heatmap-hour-label">{h}</div>
        ))}
        {DAYS.map((day) => (
          <React.Fragment key={day}>
            <div className="heatmap-day-label">{day}</div>
            {VISIBLE_HOURS.map((h) => {
              const v = cellVal(day, h);
              return (
                <div
                  key={day + h}
                  title={v !== null ? `${day} ${h}: ${v.toFixed(1)}%` : 'No data'}
                  style={{ backgroundColor: cellColor(v), height: 22, borderRadius: 4 }}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Low</span>
        {['#1d4ed8', '#3b82f6', '#f59e0b', '#ef4444'].map((c) => (
          <div key={c} style={{ width: 20, height: 10, backgroundColor: c, borderRadius: 2 }} />
        ))}
        <span>High</span>
      </div>
    </div>
  );
};

export default Heatmap;