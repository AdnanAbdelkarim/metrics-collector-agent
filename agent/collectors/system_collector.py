import psutil
import time
from config.agent_config import AgentConfig

class SystemCollector:
    def collect(self):
        """Collect CPU, memory, and disk usage"""
        try:
            metrics = {
                "agent_id": AgentConfig.AGENT_ID,
                "hostname": AgentConfig.HOSTNAME,
                "os": AgentConfig.OS,
                "timestamp": int(time.time()),
                "cpu": psutil.cpu_percent(interval=1),
                "memory": psutil.virtual_memory().percent,
                "disk": psutil.disk_usage("/").percent,
            }
            return metrics
        except Exception as e:
            print(f"Error collecting metrics: {e}")
            return None
