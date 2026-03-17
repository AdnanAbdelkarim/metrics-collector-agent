import logging
from datetime import datetime
from mysql.connector import Error, connect
from server.config.server_config import ServerConfig
from database.db_config import DB_CONFIG

logger = logging.getLogger(__name__)

#conn = connect(**DB_CONFIG)

def insert_metrics(metrics):
    """
    Inserting data to database
    """
    try:
        conn = connect(**DB_CONFIG)
        cursor = conn.cursor()

        insert_query = f"""
            INSERT INTO {ServerConfig.TABLE_NAME}
            (timestamp, host, cpu, memory, disk)
            VALUES (%s, %s, %s, %s, %s)
        """

        # Timestamp configuration
        ts = datetime.fromtimestamp(metrics["timestamp"])
        ts_str = ts.strftime('%Y-%m-%d %H:%M:%S')

        cursor.execute(insert_query, (
            ts_str,
            metrics["hostname"],
            metrics["cpu"],
            metrics["memory"],
            metrics["disk"]
        ))

        conn.commit()
        cursor.close()
        conn.close()

        logger.info(f"Inserted metrics snapshot for {metrics['hostname']}")
        return True

    except Error as e:
        logger.error(f"Failed to insert metrics: {e}")
        try:
            if conn:
                conn.rollback()
        except:
            pass
        return False