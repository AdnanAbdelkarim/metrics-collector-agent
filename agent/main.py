import logging
import time
from config.agent_config import AgentConfig
from collectors.system_collector import SystemCollector
from sender.metrics_sender import MetricsSender

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    logger.info("Metrics Agent Started")
    logger.info(f"Sending to {AgentConfig.SERVER_URL}")

    collector = SystemCollector()
    sender = MetricsSender(AgentConfig.SERVER_URL)

    while True:
        metrics = collector.collect()
        if metrics:
            sender.send(metrics)
            logger.info(f"Metrics sent from {AgentConfig.HOSTNAME} at {time.strftime('%H:%M:%S')}")
        else:
            logger.warning(f"⚠️ Metrics collection failed on {AgentConfig.HOSTNAME}")

        time.sleep(AgentConfig.COLLECTION_INTERVAL)

if __name__ == "__main__":
    main()
