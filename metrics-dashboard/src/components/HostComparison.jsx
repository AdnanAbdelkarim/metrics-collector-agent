import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HostComparison = ({ data }) => {
  // Process metrics to get average CPU per host
  const processHostData = () => {
    if (!data || data.length === 0) return [];
    
    // Get date range
    const dates = data.map(d => new Date(d.timestamp));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Group metrics by host and calculate average CPU
    const hostMap = new Map();
    
    data.forEach(metric => {
      if (!hostMap.has(metric.host)) {
        hostMap.set(metric.host, {
          host: metric.host,
          cpu: 0,
          memory: 0,
          disk: 0,
          count: 0
        });
      }
      const hostData = hostMap.get(metric.host);
      hostData.cpu += metric.cpu || 0;
      hostData.memory += metric.memory || 0;
      hostData.disk += metric.disk || 0;
      hostData.count += 1;
    });
    
    // Convert to array with averages
    const hostData = Array.from(hostMap.values()).map(host => ({
      host: host.host,
      cpu: Math.round((host.cpu / host.count) * 10) / 10,
      memory: Math.round((host.memory / host.count) * 10) / 10,
      disk: Math.round((host.disk / host.count) * 10) / 10
    })).sort((a, b) => b.cpu - a.cpu);
    
    return {
      data: hostData,
      dateRange: {
        start: minDate,
        end: maxDate
      }
    };
  };

  const { data: hostData, dateRange } = processHostData();

  if (!hostData || hostData.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        height: '450px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#666',
        fontFamily: 'Arial, sans-serif'
      }}>
        No host comparison data available
      </div>
    );
  }

  // Format date range
  const startDate = dateRange?.start ? dateRange.start.toLocaleDateString() : 'N/A';
  const endDate = dateRange?.end ? dateRange.end.toLocaleDateString() : 'N/A';
  const timeRange = startDate === endDate ? startDate : `${startDate} - ${endDate}`;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      height: '450px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{
          margin: 0,
          color: '#333',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          Host Comparison (Average %)
        </h3>
        <div style={{
          fontSize: '13px',
          color: '#666',
          backgroundColor: '#f5f5f5',
          padding: '4px 10px',
          borderRadius: '4px'
        }}>
          📅 {timeRange}
        </div>
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart
          data={hostData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="host" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          <Bar dataKey="cpu" fill="#2196f3" name="CPU %" />
          <Bar dataKey="memory" fill="#10b981" name="Memory %" />
          <Bar dataKey="disk" fill="#f59e0b" name="Disk %" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default HostComparison;