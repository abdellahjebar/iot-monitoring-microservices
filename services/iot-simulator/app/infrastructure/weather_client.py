import requests
import time
from typing import Dict, Tuple, Optional
from ..core.config import receive_logger

logger = receive_logger()

class WeatherClient:
    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1/forecast"
        # Cache format: {(lat, lon): {'temp': 20.0, 'humid': 50.0, 'timestamp': 1234567890}}
        self._cache: Dict[Tuple[float, float], Dict] = {}
        self._cache_ttl = 900  # 15 minutes

    def fetch_current_weather(self, lat: float, lon: float) -> Optional[Dict[str, float]]:
        """
        Fetches current weather for the given coordinates.
        Uses in-memory cache to respect API rate limits.
        """
        key = (lat, lon)
        now = time.time()

        # Check Cache
        if key in self._cache:
            entry = self._cache[key]
            if now - entry['timestamp'] < self._cache_ttl:
                return {'temp': entry['temp'], 'humid': entry['humid']}

        # Fetch from API
        try:
            # Open-Meteo requires lat/lon with max 2 decimals usually, but handles more.
            # We want current temperature and humidity.
            url = f"{self.base_url}?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m"
            
            logger.info(f"🌦️ Fetching real weather for ({lat:.2f}, {lon:.2f})...")
            resp = requests.get(url, timeout=5)
            resp.raise_for_status()
            data = resp.json()

            if 'current' in data:
                current = data['current']
                temp = current.get('temperature_2m', 20.0)
                humid = current.get('relative_humidity_2m', 50.0)
                
                # Update Cache
                self._cache[key] = {
                    'temp': temp,
                    'humid': humid,
                    'timestamp': now
                }
                
                return {'temp': temp, 'humid': humid}
                
        except Exception as e:
            logger.error(f"❌ Weather API failed for ({lat:.2f}, {lon:.2f}): {e}")
            
        return None  # Indicate failure, caller should stick to old values
