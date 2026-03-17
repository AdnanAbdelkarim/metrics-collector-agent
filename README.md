# Metrics Collector Agent

A distributed system for collecting, storing, and visualizing virtual machine performance metrics in real time. The system comprises four components: a lightweight agent deployed on each monitored host, a Flask-based API server, a MySQL database layer, and a React frontend dashboard.

---

## Architecture Overview

```
[Agent (VM)]  --POST /api/metrics-->  [Flask Server]  -->  [MySQL Database]
                                                                  |
                                              [React Dashboard] <--GET /api/metrics--
```

- **Agent**: Runs on each target VM. Collects CPU, memory, and disk usage at a configurable interval and pushes data to the server.
- **Server**: Receives metric payloads, validates them, and persists them to the database. Also exposes query endpoints consumed by the dashboard.
- **Database**: MySQL backend with a metrics table. Connection credentials and table name are configurable.
- **Dashboard**: React (Vite) single-page application that polls the server API and renders metrics in a table view and a charts view (gauges, heatmaps, host comparison, anomaly detection).

---

## Repository Structure

```
.
├── agent/
│   ├── main.py
│   ├── requirements.txt
│   ├── collectors/
│   │   └── system_collector.py
│   ├── config/
│   │   └── agent_config.py          
│   └── sender/
│       └── metrics_sender.py
│
├── server/
│   ├── app.py
│   ├── requirements.txt
│   ├── config/
│   │   └── server_config.py         
│   ├── routes/
│   │   └── metrics.py
│   └── utils/
│       └── db.py
│
├── database/
│   ├── db_config.py                 
│   └── models.py
│
└── metrics-dashboard/
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── eslint.config.js
    ├── .gitignore
    ├── public/
    │   └── vite.svg
    └── src/
        ├── App.jsx                  
        ├── main.jsx
        ├── index.css
        ├── dashboard.css
        ├── assets/
        │   └── react.svg
        ├── utils/
        │   └── metricHelpers.js
        └── components/
            ├── AnomalyChart.jsx
            ├── CollapsibleSection.jsx
            ├── FilterPanel.jsx
            ├── Gauge.jsx
            ├── Heatmap.jsx
            └── HostComparison.jsx
```

---

## Configuration: IP Address and Credentials

Before running any component, replace all placeholder values in the following files.

### `agent/config/agent_config.py`

```python
SERVER_URL = "YOUR-IP-ADDRESS/api/metrics"
```

Replace `YOUR-IP-ADDRESS` with the IP address or hostname of the machine running the Flask server. Example:

```python
SERVER_URL = "http://192.168.1.100:5000/api/metrics"
```

### `server/config/server_config.py`

```python
HOST = "YOUR-IP-ADDRESS"
PORT = "PORT-NUMBER"
TABLE_NAME = "databse_table_name"
```

Replace `YOUR-IP-ADDRESS` with the server's network interface address (use `0.0.0.0` to bind to all interfaces), `PORT-NUMBER` with the desired port (e.g., `5000`), and `TABLE_NAME` with the name of the metrics table in your MySQL database.

### `database/db_config.py`

```python
DB_CONFIG = {
    'host': 'localhost',
    'database': 'database_name',
    'user': 'database_user',
    'password': 'database_password'
}
```

Replace each field with the appropriate MySQL connection credentials for your environment.

### `metrics-dashboard/src/App.jsx`

```javascript
const response = await axios.get("YOUR-IP-ADDRESS/api/metrics");
```

Replace `YOUR-IP-ADDRESS` with the full base URL of the Flask server. Example:

```javascript
const response = await axios.get("http://192.168.1.100:5000/api/metrics");
```

---

## Prerequisites

- Python 3.8 or later
- Node.js 18 or later and npm
- MySQL 8.0 or later
- A running MySQL instance with an accessible database and user account

---

## Database Setup

Create the metrics table in your MySQL database before starting the server. The schema expected by the application is:

```sql
CREATE TABLE your_table_name (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    timestamp   DATETIME        NOT NULL,
    host        VARCHAR(255)    NOT NULL,
    cpu         FLOAT           NOT NULL,
    memory      FLOAT           NOT NULL,
    disk        FLOAT           NOT NULL
);
```

Replace `your_table_name` with the value assigned to `TABLE_NAME` in `server/config/server_config.py`.

---

## Installation and Running

### 1. Server

```bash
cd server
pip install -r requirements.txt
python app.py
```

The server will start on the host and port defined in `server/config/server_config.py`.

### 2. Agent

Deploy the `agent/` directory to each VM to be monitored. Install dependencies and run:

```bash
cd agent
pip install -r requirements.txt
python main.py
```

The agent will begin collecting and transmitting metrics at the interval defined by `COLLECTION_INTERVAL` in `agent/config/agent_config.py` (default: 10 seconds).

### 3. Dashboard

```bash
cd metrics-dashboard
npm install
npm run dev
```

The development server will be available at `http://localhost:5173` by default. For a production build:

```bash
npm run build
npm run preview
```

---

## API Endpoints

All endpoints are served under the `/api` prefix.

| Method | Endpoint                    | Description                                              |
|--------|-----------------------------|----------------------------------------------------------|
| GET    | `/api/health`               | Health check. Returns server status and current timestamp. |
| POST   | `/api/metrics`              | Ingest a metrics payload from an agent.                  |
| GET    | `/api/metrics`              | Retrieve metrics. Supports optional query filters.       |
| GET    | `/api/metrics/latest`       | Retrieve the most recent metric reading per host.        |
| GET    | `/api/metrics/host/<host>`  | Retrieve metrics for a specific host.                    |
| GET    | `/api/hosts`                | Retrieve the list of all unique host identifiers.        |

### Query Parameters for `GET /api/metrics`

| Parameter    | Type   | Description                                            |
|--------------|--------|--------------------------------------------------------|
| `from_date`  | string | Filter records from this datetime (`YYYY-MM-DD HH:MM:SS`). |
| `to_date`    | string | Filter records up to this datetime (`YYYY-MM-DD HH:MM:SS`). |
| `cpu_min`    | float  | Minimum CPU usage threshold (0–100).                   |
| `memory_min` | float  | Minimum memory usage threshold (0–100).                |
| `disk_min`   | float  | Minimum disk usage threshold (0–100).                  |
| `hosts`      | string | Comma-separated list of host identifiers to include.   |
| `limit`      | int    | Maximum number of records to return (default: 1000).   |

---

## Dashboard Features

### Table View

- Paginated metrics table (20 records per page) displaying timestamp, host, CPU, memory, and disk usage.
- Color-coded status indicators per metric: normal (below 60%), warning (60–80%), critical (above 80%).
- Full-text search across host identifiers and timestamps.
- Host status filter: All Hosts, Warnings and Critical, or Critical Only.
- CSV export of the currently filtered dataset.

### Charts and Visuals View

- **Gauge charts**: Displays the latest CPU and memory readings per host.
- **Host Comparison**: Bar chart comparing average CPU, memory, and disk usage across all hosts.
- **Anomaly Detection**: Time-series charts for CPU and memory with z-score-based anomaly markers (default threshold: z = 2.0).
- **Heatmaps**: Hour-of-day by host heatmap for CPU and memory usage.

### Filter Panel

Applies client-side filtering across date range, per-metric minimum thresholds, and host selection.

---

## Agent Configuration Reference

| Parameter             | Location                          | Description                                                  |
|-----------------------|-----------------------------------|--------------------------------------------------------------|
| `SERVER_URL`          | `agent/config/agent_config.py`    | Full URL of the server ingestion endpoint.                   |
| `COLLECTION_INTERVAL` | `agent/config/agent_config.py`    | Seconds between metric collection cycles (default: 10).      |
| `AGENT_ID`            | `agent/config/agent_config.py`    | Auto-generated UUID per agent instance.                      |
| `HOSTNAME`            | `agent/config/agent_config.py`    | Auto-resolved from the host OS at runtime.                   |

---

## Metrics Collected

Each agent payload contains the following fields:

| Field       | Type    | Description                                 |
|-------------|---------|---------------------------------------------|
| `agent_id`  | string  | UUID uniquely identifying the agent instance. |
| `hostname`  | string  | Hostname of the monitored VM.               |
| `os`        | string  | Operating system identifier (`linux` or `windows`). |
| `timestamp` | integer | Unix epoch timestamp of the collection event. |
| `cpu`       | float   | CPU usage percentage at the time of collection. |
| `memory`    | float   | Virtual memory usage percentage.            |
| `disk`      | float   | Disk usage percentage for the root partition (`/`). |

---

## Dependencies

### Agent (`agent/requirements.txt`)

| Package   | Purpose                                  |
|-----------|------------------------------------------|
| `psutil`  | System metrics collection (CPU, memory, disk). |
| `requests`| HTTP client for posting metrics to the server. |

### Server (`server/requirements.txt`)

| Package      | Purpose                                         |
|--------------|-------------------------------------------------|
| `Flask`      | Web framework for the API server.               |
| `flask-cors` | Cross-Origin Resource Sharing support for the dashboard. |
| `mysql-connector-python` | MySQL database connectivity (install separately). |

### Dashboard (`metrics-dashboard/package.json`)

| Package     | Purpose                                              |
|-------------|------------------------------------------------------|
| `react`     | UI component library.                                |
| `react-dom` | DOM rendering for React.                             |
| `axios`     | HTTP client for API requests.                        |
| `recharts`  | Chart library for heatmaps, bar charts, and line charts. |
| `vite`      | Development server and build tool.                   |

---

## Notes

- The `DEBUG` flag in `server/config/server_config.py` is set to `True` by default. Set it to `False` in any production deployment.
- CORS is enabled for all origins in `server/app.py`. Restrict allowed origins appropriately before deploying to a production environment.
- The agent collects disk usage for the root partition (`/`) only. Modification of `system_collector.py` is required for Windows deployments or non-root partition monitoring.
- The dashboard reads all metrics into client memory on load. For high-volume deployments, consider reducing the default `limit` parameter or implementing server-side pagination.
