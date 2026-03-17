import { useState, useEffect } from "react";
import axios from "axios";

export default function FilterPanel({ onApply }) {
  const [hosts, setHosts] = useState([]);
  const [filters, setFilters] = useState({
    from_date: "",
    to_date: "",
    cpu_min: "",
    memory_min: "",
    disk_min: "",
    hosts: []
  });

  useEffect(() => {
    // Fetch available hosts from the API
    axios.get("YOUR-IP-ADDRESS/api/hosts")  
      .then(res => setHosts(res.data))
      .catch(err => console.error("Error fetching hosts:", err));
  }, []);

  const toggleHost = (host) => {
    setFilters(prev => ({
      ...prev,
      hosts: prev.hosts.includes(host)
        ? prev.hosts.filter(h => h !== host)
        : [...prev.hosts, host]
    }));
  };

  const handleApply = () => {
    onApply(filters);
  };

  const handleReset = () => {
    const resetFilters = {
      from_date: "",
      to_date: "",
      cpu_min: "",
      memory_min: "",
      disk_min: "",
      hosts: []
    };
    setFilters(resetFilters);
    onApply(resetFilters); // Apply empty filters to show all data
  };

  return (
    <div className="filter-panel">
      <h2>Filters</h2>
      
      <form onSubmit={(e) => { e.preventDefault(); handleApply(); }}>
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="from_date">From:</label>
            <input
              type="datetime-local"
              id="from_date"
              name="from_date"
              value={filters.from_date}
              onChange={e => setFilters({ ...filters, from_date: e.target.value })}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="to_date">To:</label>
            <input
              type="datetime-local"
              id="to_date"
              name="to_date"
              value={filters.to_date}
              onChange={e => setFilters({ ...filters, to_date: e.target.value })}
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="cpu_min">CPU ≥ %</label>
            <input
              type="number"
              id="cpu_min"
              name="cpu_min"
              value={filters.cpu_min}
              onChange={e => setFilters({ ...filters, cpu_min: e.target.value })}
              placeholder="0-100"
              min="0"
              max="100"
            />
          </div>
        </div>
        
        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="memory_min">Memory ≥ %</label>
            <input
              type="number"
              id="memory_min"
              name="memory_min"
              value={filters.memory_min}
              onChange={e => setFilters({ ...filters, memory_min: e.target.value })}
              placeholder="0-100"
              min="0"
              max="100"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="disk_min">Disk ≥ %</label>
            <input
              type="number"
              id="disk_min"
              name="disk_min"
              value={filters.disk_min}
              onChange={e => setFilters({ ...filters, disk_min: e.target.value })}
              placeholder="0-100"
              min="0"
              max="100"
            />
          </div>
        </div>
        
        {hosts.length > 0 && (
          <div className="filter-group" style={{ marginTop: "15px" }}>
            <label><strong>Hosts:</strong></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px" }}>
              {hosts.map(h => (
                <label key={h} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <input
                    type="checkbox"
                    checked={filters.hosts.includes(h)}
                    onChange={() => toggleHost(h)}
                  />
                  <span>{h}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        <div className="filter-actions">
          <button type="button" className="btn-secondary" onClick={handleReset}>
            Reset
          </button>
          <button type="submit" className="btn-primary">
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
}