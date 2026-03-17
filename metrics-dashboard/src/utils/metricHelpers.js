export const getCpuStatus = (cpu) => {
  if (cpu < 60) return 'normal';
  if (cpu < 80) return 'warning';
  return 'critical';
};
  
export const getMemoryStatus = (memory) => {
  if (memory < 60) return 'normal';
  if (memory < 80) return 'warning';
  return 'critical';
};

export const getDiskStatus = (disk) => {
  if (disk < 60) return 'normal';
  if (disk < 80) return 'warning';
  return 'critical';
};

// Parse date string in format "Mon, 26 Jan 2026 10:33:00 GMT" to Date object
export const parseTimestamp = (timestamp) => {
  return new Date(timestamp);
};

export const mean = (arr) =>
  arr.reduce((a, b) => a + b, 0) / (arr.length || 1);

export const std = (arr) => {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length || 1));
};

export const detectAnomalies = (data, key, zThreshold = 2.0) => {
  const vals = data.map((d) => d[key]);
  const m = mean(vals);
  const s = std(vals);
  return data.map((d) => ({
    ...d,
    [`${key}_anomaly`]: s > 0 && Math.abs(d[key] - m) / s > zThreshold,
  }));
};

export const exportCSV = (data, filename = 'metrics') => {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [
    keys.join(','),
    ...data.map((r) =>
      keys.map((k) => JSON.stringify(r[k] ?? '')).join(',')
    ),
  ];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${Date.now()}.csv`;
  a.click();
};