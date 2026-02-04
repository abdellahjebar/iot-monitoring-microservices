import requests
import time
from typing import List
from ..core.config import receive_logger, settings
from ..domain.models import DeviceConfig, CityConfig

logger = receive_logger()

# We will use OpenMeteo Geocoding API to resolve city coordinates dynamically
# https://geocoding-api.open-meteo.com/v1/search?name=Casablanca

class BackendClient:
    def __init__(self):
        self.base_url = settings.DEVICE_MANAGEMENT_URL
        self._city_cache = {}

    def _resolve_city(self, city_name: str) -> CityConfig:
        if city_name in self._city_cache:
            return self._city_cache[city_name]

        try:
            logger.info(f"🌍 Geocoding city: {city_name}...")
            resp = requests.get(
                f"https://geocoding-api.open-meteo.com/v1/search?name={city_name}&count=1&language=en&format=json",
                timeout=5
            )
            data = resp.json()
            if 'results' in data and len(data['results']) > 0:
                res = data['results'][0]
                config = CityConfig(
                    name=res['name'],
                    lat=res['latitude'],
                    lon=res['longitude']
                )
                self._city_cache[city_name] = config
                return config
        except Exception as e:
            logger.error(f"❌ Geocoding failed for {city_name}: {e}")
        
        # Fallback to a default if geocoding fails (0,0 null island)
        return CityConfig("Unknown", 0.0, 0.0)

    def fetch_active_device_list(self) -> List[DeviceConfig]:
        """
        Polls the Device-Management Service to get all registered devices.
        Retries until successful.
        """
        retries = 0
        while True:
            try:
                # Candidate URLs to try
                candidate_urls = [
                    f"{self.base_url}/devices/active",
                    "http://device-ms:8001/devices/active",
                    "http://device-management:8001/devices/active"
                ]
                
                success = False
                for url in candidate_urls:
                    try:
                        logger.info(f"🔄 Syncing with Backend: {url}")
                        resp = requests.get(url, timeout=5)
                        resp.raise_for_status()
                        
                        raw_devices = resp.json()
                        configs = []
                        
                        for d in raw_devices:
                            city_name = d.get('location', 'Casablanca')
                            try:
                                city_config = self._resolve_city(city_name)
                            except Exception as geo_error:
                                logger.error(f"Geocoding error for {city_name}: {geo_error}")
                                city_config = CityConfig("Unknown", 0.0, 0.0)

                            configs.append(DeviceConfig(
                                device_id=d['id'],
                                type=d.get('type', 'SENSOR'),
                                city=city_config
                            ))
                        
                        logger.info(f"✅ Successfully synced {len(configs)} devices from Backend ({url}).")
                        return configs
                        
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to sync with {url}: {e}")
                        continue
                
                # If all failed
                raise Exception("All backend URLs failed.")

            except requests.exceptions.HTTPError as http_err:
                 logger.error(f"HTTP Error syncing backend: {http_err} - Response: {http_err.response.text}")
            except Exception as e:
                retries += 1
                wait_time = min(30, 2 ** retries)
                logger.error(f"❌ Backend Sync Failed: {e}. Retrying in {wait_time}s...")
                time.sleep(wait_time)
