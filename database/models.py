from database.db_config import get_db_connection
from server.config.server_config import ServerConfig
import logging

logger = logging.getLogger(__name__)

connection = get_db_connection()

class MetricsModel:
    """Database operations for metrics"""
    
    @staticmethod
    def insert(metric):
        """Insert metric into database"""
        connection = get_db_connection()  # Gets from pool
        if not connection:
            raise Exception("Database connection failed")
        
        try:
            cursor = connection.cursor()
            query = f"""
                INSERT INTO {ServerConfig.TABLE_NAME} 
                (timestamp, host, metric_type, percentage)
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(query, (
                metric['timestamp'],
                metric['host'],
                metric['metric_type'],
                metric['percentage']
            ))
            connection.commit()
            return cursor.lastrowid
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    @staticmethod
    def get_by_host(host, limit):
        """Get metrics by host"""
        connection = get_db_connection()
        if not connection:
            raise Exception("Database connection failed")
        
        try:
            cursor = connection.cursor(dictionary=True)
            query = f"""
                SELECT * FROM {ServerConfig.TABLE_NAME}
                WHERE host = %s 
                ORDER BY timestamp DESC 
                LIMIT %s
            """
            cursor.execute(query, (host, limit))
            return cursor.fetchall()
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    @staticmethod
    def get_all(limit):
        """Get all metrics"""
        connection = get_db_connection()
        if not connection:
            raise Exception("Database connection failed")
        
        try:
            cursor = connection.cursor(dictionary=True)
            query = f"""
                SELECT * FROM {ServerConfig.TABLE_NAME}
                ORDER BY timestamp DESC 
                LIMIT %s
            """
            cursor.execute(query, (limit,))
            return cursor.fetchall()
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
        
    @staticmethod
    def get_with_filters(from_date=None, to_date=None, cpu_min=None, 
                        memory_min=None, disk_min=None, hosts=None, limit=1000):
        """Get metrics with filters applied"""
        connection = get_db_connection()
        if not connection:
            raise Exception("Database connection failed")
        
        try:
            cursor = connection.cursor(dictionary=True)
            
            # Build dynamic query
            query = f"SELECT * FROM {ServerConfig.TABLE_NAME} WHERE 1=1"
            params = []
            
            # Date range filters
            if from_date:
                query += " AND timestamp >= %s"
                params.append(from_date)
            
            if to_date:
                query += " AND timestamp <= %s"
                params.append(to_date)
            
            # Metric threshold filters
            # Note: Adjust these column names based on your actual schema
            if cpu_min is not None:
                query += " AND (metric_type = 'cpu' AND percentage >= %s)"
                params.append(cpu_min)
            
            if memory_min is not None:
                query += " AND (metric_type = 'memory' AND percentage >= %s)"
                params.append(memory_min)
            
            if disk_min is not None:
                query += " AND (metric_type = 'disk' AND percentage >= %s)"
                params.append(disk_min)
            
            # Host filter
            if hosts and len(hosts) > 0:
                placeholders = ','.join(['%s'] * len(hosts))
                query += f" AND host IN ({placeholders})"
                params.extend(hosts)
            
            query += " ORDER BY timestamp DESC LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            return cursor.fetchall()
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    @staticmethod
    def get_unique_hosts():
        """Get list of unique hosts"""
        connection = get_db_connection()
        if not connection:
            raise Exception("Database connection failed")
        
        try:
            cursor = connection.cursor()
            query = f"SELECT DISTINCT host FROM {ServerConfig.TABLE_NAME} ORDER BY host"
            cursor.execute(query)
            return [row[0] for row in cursor.fetchall()]
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()
    
    @staticmethod
    def get_latest_by_host_and_type():
        """Get latest metrics grouped by host and metric_type
        Returns data in format suitable for dashboard display
        """
        connection = get_db_connection()
        if not connection:
            raise Exception("Database connection failed")
        
        try:
            cursor = connection.cursor(dictionary=True)
            
            # Get the latest metric for each host and metric_type combination
            query = f"""
                SELECT t1.*
                FROM {ServerConfig.TABLE_NAME} t1
                INNER JOIN (
                    SELECT host, metric_type, MAX(timestamp) as max_timestamp
                    FROM {ServerConfig.TABLE_NAME}
                    GROUP BY host, metric_type
                ) t2
                ON t1.host = t2.host 
                AND t1.metric_type = t2.metric_type 
                AND t1.timestamp = t2.max_timestamp
                ORDER BY t1.host, t1.metric_type
            """
            cursor.execute(query)
            results = cursor.fetchall()
            
            # Transform to dashboard format
            # Group by host and pivot metric_types into columns
            dashboard_data = {}
            for row in results:
                host = row['host']
                if host not in dashboard_data:
                    dashboard_data[host] = {
                        'host': host,
                        'timestamp': row['timestamp'],
                        'cpu': 0,
                        'memory': 0,
                        'disk': 0
                    }
                
                # Update the appropriate metric
                metric_type = row['metric_type'].lower()
                if metric_type in ['cpu', 'memory', 'disk']:
                    dashboard_data[host][metric_type] = row['percentage']
                    # Update timestamp to most recent
                    if row['timestamp'] > dashboard_data[host]['timestamp']:
                        dashboard_data[host]['timestamp'] = row['timestamp']
            
            return list(dashboard_data.values())
        finally:
            if connection.is_connected():
                cursor.close()
                connection.close()