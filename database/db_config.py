import mysql.connector
from mysql.connector import pooling, Error
import logging
from server.config.server_config import ServerConfig

logger = logging.getLogger(__name__)

DB_CONFIG = {
    'host': 'localhost',
    'database': 'database_name',
    'user': 'database_user',
    'password': 'database_password'
}


def get_db_connection():
    """Create database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        logging.error(f"Database connection error: {e}")
        return None
