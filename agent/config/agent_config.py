import socket
import platform
import uuid

class AgentConfig:
    # URL of the server to push metrics to
    SERVER_URL = "YOUR-IP-ADDRESS/api/metrics"
    
    # Interval between metric collections (seconds)
    COLLECTION_INTERVAL = 10

    # Identity info for this agent
    AGENT_ID = str(uuid.uuid4())
    HOSTNAME = socket.gethostname()
    OS = platform.system().lower()  # linux / windows 
