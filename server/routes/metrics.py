from flask import Blueprint, request, jsonify
from server.utils.db import insert_metrics
from server.config.server_config import ServerConfig
from database.models import MetricsModel
from datetime import datetime

metrics_bp = Blueprint('metrics', __name__, url_prefix='/api')


@metrics_bp.route("/metrics", methods=["POST"])
def ingest_metrics():
    data = request.json
    if not data or "agent_id" not in data:
        return jsonify({"error": "invalid payload"}), 400

    # Insert metrics into DB
    insert_metrics(data)
    print(f"Data Inserted to Database", ServerConfig.TABLE_NAME)
    return jsonify({"status": "ok"}), 200




def format_metric(metric):
    """Format a metric dict for JSON response"""
    return {
        'timestamp': metric['timestamp'].strftime('%a, %d %b %Y %H:%M:%S GMT') 
                     if isinstance(metric['timestamp'], datetime) 
                     else str(metric['timestamp']),
        'host': metric['host'],
        'cpu': float(metric.get('cpu', 0)),
        'memory': float(metric.get('memory', 0)),
        'disk': float(metric.get('disk', 0))
    }

@metrics_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy', 
        'timestamp': datetime.now().isoformat()
    })

@metrics_bp.route('/hosts', methods=['GET'])
def get_hosts():
    """Get list of all unique hosts"""
    try:
        hosts = MetricsModel.get_unique_hosts()
        return jsonify(hosts)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@metrics_bp.route('/metrics', methods=['GET'])
def get_metrics():
    """Get metrics with optional filters
    
    Query Parameters:
        from_date: Filter from date (format: YYYY-MM-DD HH:MM:SS)
        to_date: Filter to date (format: YYYY-MM-DD HH:MM:SS)
        cpu_min: Minimum CPU percentage (0-100)
        memory_min: Minimum memory percentage (0-100)
        disk_min: Minimum disk percentage (0-100)
        hosts: Comma-separated list of hosts
        limit: Maximum number of records (default: 1000)
    """
    try:
        # Get query parameters
        from_date = request.args.get('from_date')
        to_date = request.args.get('to_date')
        cpu_min = request.args.get('cpu_min')
        memory_min = request.args.get('memory_min')
        disk_min = request.args.get('disk_min')
        hosts_param = request.args.get('hosts')
        limit = request.args.get('limit', 1000, type=int)
        
        # Parse hosts if provided
        hosts = hosts_param.split(',') if hosts_param else None
        
        # Convert numeric filters
        cpu_min = float(cpu_min) if cpu_min else None
        memory_min = float(memory_min) if memory_min else None
        disk_min = float(disk_min) if disk_min else None
        
        # Check if we're using the new table structure with metric_type column
        # If so, we need to get latest metrics grouped by host
        if any([from_date, to_date, cpu_min, memory_min, disk_min, hosts]):
            # Use filtered query
            metrics = MetricsModel.get_with_filters(
                from_date=from_date,
                to_date=to_date,
                cpu_min=cpu_min,
                memory_min=memory_min,
                disk_min=disk_min,
                hosts=hosts,
                limit=limit
            )
        else:
            # No filters - check if we should use grouped query
            try:
                # Try to get latest metrics grouped by host
                metrics = MetricsModel.get_latest_by_host_and_type()
            except:
                # Fallback to get_all if method doesn't exist or fails
                metrics = MetricsModel.get_all(limit)
        
        # Format metrics for JSON
        formatted_metrics = [format_metric(m) for m in metrics]
        
        return jsonify(formatted_metrics)
    
    except Exception as e:
        print(f"Error in get_metrics: {e}")  # Debug logging
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@metrics_bp.route('/metrics/host/<host>', methods=['GET'])
def get_metrics_by_host(host):
    """Get metrics for a specific host
    
    Query Parameters:
        limit: Maximum number of records (default: 100)
    """
    try:
        limit = request.args.get('limit', 100, type=int)
        metrics = MetricsModel.get_by_host(host, limit)
        formatted_metrics = [format_metric(m) for m in metrics]
        return jsonify(formatted_metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@metrics_bp.route('/metrics/latest', methods=['GET'])
def get_latest_metrics():
    """Get latest metrics grouped by host and metric type"""
    try:
        metrics = MetricsModel.get_latest_by_host_and_type()
        formatted_metrics = [format_metric(m) for m in metrics]
        return jsonify(formatted_metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500