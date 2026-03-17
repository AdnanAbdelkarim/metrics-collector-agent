import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';

const AnomalyChart = ({ data, metricKey = 'cpu', label = 'CPU', color = '#ff9800' }) => {
  // Process data to get recent metrics and detect anomalies
  const processChartData = () => {
    if (!data || data.length === 0) return [];
    
    // Take last 30 metrics or all if less
    const recentData = data.slice(-30);
    
    // Calculate mean and standard deviation for anomaly detection
    const values = recentData.map(d => d[metricKey] || 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
    );
    
    // Create chart data with anomaly flag
    return recentData.map((item, index) => {
      const value = item[metricKey] || 0;
      const isAnomaly = Math.abs(value - mean) > (stdDev * 1.5);
      
      // Format timestamp to show time only
      let timeLabel = '';
      if (item.timestamp) {
        const date = new Date(item.timestamp);
        timeLabel = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
      } else {
        timeLabel = `T${index}`;
      }
      
      return {
        time: timeLabel,
        value: value,
        isAnomaly: isAnomaly,
        raw: value,
        timestamp: item.timestamp
      };
    });
  };

  const chartData = processChartData();

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontFamily: 'Arial, sans-serif'
      }}>
        No anomaly data available
      </div>
    );
  }

  // Find anomaly points for highlighting
  const anomalyPoints = chartData.filter(d => d.isAnomaly);

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      height: '400px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        color: '#333',
        fontSize: '16px',
        fontWeight: '500'
      }}>
        {label} Usage - Anomaly Detection
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            name={`${label} %`}
            dot={{ r: 3 }}
            activeDot={{ r: 8 }}
          />
          {/* Highlight anomalies with red dots */}
          {anomalyPoints.map((point, index) => (
            <ReferenceDot
              key={index}
              x={point.time}
              y={point.value}
              r={6}
              fill="red"
              stroke="none"
              label="⚠️"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <div style={{
        marginTop: '10px',
        textAlign: 'center',
        fontSize: '12px',
        color: '#666'
      }}>
        <span style={{ color: 'red' }}>●</span> Red dots indicate anomalies
      </div>
    </div>
  );
};

export default AnomalyChart;