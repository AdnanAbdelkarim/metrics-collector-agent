import requests

class MetricsSender:
    def __init__(self, url):
        self.url = url

    def send(self, metrics):
        if not metrics:
            return
        try:
            response = requests.post(self.url, json=metrics, timeout=5)
            if response.status_code != 200:
                print(f"Failed to send metrics: {response.text}")
        except Exception as e:
            print(f"Error sending metrics: {e}")
