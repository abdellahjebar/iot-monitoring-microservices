import time
from app.core.config import setup_logging
from app.services.simulation_runner import SimulationRunner

from app.core.metrics import start_metrics_server

def main():
    logger = setup_logging()
    logger.info("⚡ IoT Simulator 2.0 Starting Up...")
    
    # Start Prometheus Metrics Server
    start_metrics_server(9090)
    
    # Optional: Delay for other services to be ready
    time.sleep(5)
    
    runner = SimulationRunner()
    runner.run()

if __name__ == "__main__":
    main()
