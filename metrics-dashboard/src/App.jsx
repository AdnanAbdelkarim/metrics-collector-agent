import React, { useState, useEffect } from 'react';
import axios from "axios";
import './dashboard.css';
import FilterPanel from "./components/FilterPanel";
import CollapsibleSection from './components/CollapsibleSection';
import Gauge from "./components/Gauge";
import Heatmap from "./components/Heatmap";
import HostComparison from "./components/HostComparison";
import AnomalyChart from "./components/AnomalyChart";
import { getCpuStatus, getMemoryStatus, getDiskStatus, exportCSV } from "./utils/metricHelpers";

// Main Dashboard Component
const MetricsDashboard = () => {
  const [allMetrics, setAllMetrics] = useState([]);
  const [filteredMetrics, setFilteredMetrics] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [hostFilter, setHostFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('table');
  const itemsPerPage = 20;
  console.log("filteredMetrics length:", filteredMetrics.length);
  console.log(filteredMetrics);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);

        const response = await axios.get(
          "YOUR-IP-ADDRESS/api/metrics"
        );

        setAllMetrics(response.data);
        setFilteredMetrics(response.data);
      } catch (err) {
        console.error("Failed to fetch metrics:", err);
        setError("Failed to load metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-card">
          <div className="spinner" />
          <p className="loading-text">Loading metrics...</p>
        </div>
      </div>
    );
  }
  
  

  const applyFilters = (filters) => {
    console.log('Applying filters:', filters);
    
    let filtered = [...allMetrics];

    // Filter by date range
    if (filters.from_date) {
      const fromDate = new Date(filters.from_date);
      filtered = filtered.filter(metric => {
        const metricDate = parseTimestamp(metric.timestamp);
        return metricDate >= fromDate;
      });
    }

    if (filters.to_date) {
      const toDate = new Date(filters.to_date);
      filtered = filtered.filter(metric => {
        const metricDate = parseTimestamp(metric.timestamp);
        return metricDate <= toDate;
      });
    }

    // Filter by CPU threshold
    if (filters.cpu_min !== '' && filters.cpu_min !== null) {
      const cpuMin = parseFloat(filters.cpu_min);
      filtered = filtered.filter(metric => metric.cpu >= cpuMin);
    }

    // Filter by Memory threshold
    if (filters.memory_min !== '' && filters.memory_min !== null) {
      const memoryMin = parseFloat(filters.memory_min);
      filtered = filtered.filter(metric => metric.memory >= memoryMin);
    }

    // Filter by Disk threshold
    if (filters.disk_min !== '' && filters.disk_min !== null) {
      const diskMin = parseFloat(filters.disk_min);
      filtered = filtered.filter(metric => metric.disk >= diskMin);
    }

    // Filter by selected hosts
    if (filters.hosts && filters.hosts.length > 0) {
      filtered = filtered.filter(metric => filters.hosts.includes(metric.host));
    }

    setFilteredMetrics(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Apply search term filtering
  const searchFilteredMetrics = filteredMetrics.filter(metric => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      metric.host.toLowerCase().includes(searchLower) ||
      metric.timestamp.toLowerCase().includes(searchLower)
    );
  });

  // Apply host filter (critical/warning)
  const finalFilteredMetrics = searchFilteredMetrics.filter(metric => {
    if (hostFilter === 'all') return true;
    if (hostFilter === 'critical') {
      return (
        getCpuStatus(metric.cpu) === 'critical' ||
        getMemoryStatus(metric.memory) === 'critical' ||
        getDiskStatus(metric.disk) === 'critical'
      );
    }
    if (hostFilter === 'warning') {
      return (
        getCpuStatus(metric.cpu) !== 'normal' ||
        getMemoryStatus(metric.memory) !== 'normal' ||
        getDiskStatus(metric.disk) !== 'normal'
      );
    }
    return true;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMetrics = finalFilteredMetrics.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(finalFilteredMetrics.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="dashboard-container">
      <h1>Metrics Dashboard</h1>
      {/* Export Button */}
      <div className="dashboard-actions">
        <button
          className="export-btn"
          onClick={() => exportCSV(filteredMetrics, 'vm_metrics')}
        >
          ⬇ Export CSV
        </button>
      </div>
      <FilterPanel onApply={applyFilters} />

      {/* Tab switcher */}
      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          📋 Table
        </button>
        <button
          className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          📊 Charts & Visuals
        </button>
      </div>

      {/* Charts tab content */}
      {activeTab === 'charts' && (
        <div className="charts-grid">
          <div style={{ background: '#1e293b', padding: '10px', margin: '10px', borderRadius: '5px' }}>
            <h3>Debug Info:</h3>
            <p>Total metrics: {filteredMetrics.length}</p>
            <p>Unique hosts: {[...new Set(filteredMetrics.map(m => m.host))].join(', ')}</p>
            <p>Sample data: {JSON.stringify(filteredMetrics[0])}</p>
          </div>
          {/* Gauges — latest reading per host */}
          <div className="gauges-row">
            {[...new Set(filteredMetrics.map(m => m.host))].map(host => {
              const latest = filteredMetrics.find(m => m.host === host);
              return latest ? (
                <div key={host} className="gauge-card">
                  <h4 className="gauge-host-label">{host}</h4>
                  <Gauge value={latest.cpu}    label="CPU"    color="#3b82f6" />
                  <Gauge value={latest.memory} label="Memory" color="#10b981" />
                </div>
              ) : null;
            })}
          </div>

          <CollapsibleSection title="Host Comparison (Averages)" defaultOpen={true}>
            <HostComparison data={filteredMetrics} />
          </CollapsibleSection>
          
          <CollapsibleSection title="CPU Anomaly Detection">
            <AnomalyChart data={filteredMetrics} metricKey="cpu"    label="CPU"    color="#3b82f6" />
          </CollapsibleSection>
          
          <CollapsibleSection title="Memory Anomaly Detection">
            <AnomalyChart data={filteredMetrics} metricKey="memory" label="Memory" color="#10b981" />
          </CollapsibleSection>
          
          <CollapsibleSection title="CPU Usage Heatmap">
            <Heatmap data={filteredMetrics} metricKey="cpu"/>
          </CollapsibleSection>

          <CollapsibleSection title="Memory Usage Heatmap">
            <Heatmap data={filteredMetrics} metricKey="memory"/>
          </CollapsibleSection>
        </div>
      )}

      {/* Wrap existing table in a conditional */}
      {activeTab === 'table' && (
        <div className="metrics-table-container">
          <div className="metrics-table-header">
            <h2 className="metrics-title">System Metrics</h2>
            <div className="table-controls">
              <input 
                type="search" 
                placeholder="Search metrics..." 
                className="table-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select 
                className="table-filter"
                value={hostFilter}
                onChange={(e) => setHostFilter(e.target.value)}
              >
                <option value="all">All Hosts</option>
                <option value="critical">Critical Only</option>
                <option value="warning">Warnings & Critical</option>
              </select>
            </div>
          </div>
          
          <div className="table-wrapper">
            <table className="metrics-table">
              <thead>
                <tr>
                  <th className="sortable">
                    Timestamp
                    <span className="sort-icon">▼</span>
                  </th>
                  <th className="sortable">
                    Host
                    <span className="sort-icon">▼</span>
                  </th>
                  <th className="sortable">
                    CPU Usage
                    <span className="sort-icon">▼</span>
                  </th>
                  <th className="sortable">
                    Memory Usage
                    <span className="sort-icon">▼</span>
                  </th>
                  <th className="sortable">
                    Disk Usage
                    <span className="sort-icon">▼</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentMetrics.length > 0 ? (
                  currentMetrics.map((row, i) => (
                    <tr key={i}>
                      <td className="timestamp-cell">{row.timestamp}</td>
                      <td>
                        <div className="host-cell">
                          <div className="host-icon">
                            {row.host.charAt(0).toUpperCase()}
                          </div>
                          <span>{row.host}</span>
                        </div>
                      </td>
                      <td>
                        <div className="metric-cell">
                          <span className="metric-value">
                            {row.cpu}%
                            <span className={`metric-indicator ${getCpuStatus(row.cpu)}`}></span>
                          </span>
                          <div className="metric-bar-container">
                            <div 
                              className="metric-bar cpu" 
                              style={{ width: `${Math.min(row.cpu, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="metric-cell">
                          <span className="metric-value">
                            {row.memory}%
                            <span className={`metric-indicator ${getMemoryStatus(row.memory)}`}></span>
                          </span>
                          <div className="metric-bar-container">
                            <div 
                              className="metric-bar memory" 
                              style={{ width: `${Math.min(row.memory, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="metric-cell">
                          <span className="metric-value">
                            {row.disk}%
                            <span className={`metric-indicator ${getDiskStatus(row.disk)}`}></span>
                          </span>
                          <div className="metric-bar-container">
                            <div 
                              className="metric-bar disk" 
                              style={{ width: `${Math.min(row.disk, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <div className="empty-state">
                        <div className="empty-state-icon">📊</div>
                        <h3 className="empty-state-title">No metrics available</h3>
                        <p>No metrics match your current filters. Try adjusting your search criteria.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {finalFilteredMetrics.length > 0 && (
            <div className="table-pagination">
              <div className="pagination-info">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, finalFilteredMetrics.length)} of {finalFilteredMetrics.length} metrics
              </div>
              <div className="pagination-controls">
                <button 
                  className="pagination-button" 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNumber}
                      className={`pagination-button ${currentPage === pageNumber ? 'active' : ''}`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                <button 
                  className="pagination-button" 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        
        </div>
      )}
    </div>
  );
};

export default MetricsDashboard;