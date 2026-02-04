from prometheus_client import Gauge, Counter, Summary, start_http_server
import time

# --- Metrics Definitions ---

# 1. Active Devices (Gauge) - Tracks the current size of the fleet
ACTIVE_DEVICES = Gauge(
    'simulator_active_devices', 
    'Number of devices currently being simulated',
    ['status']
)

# 2. Physics Tick Duration (Summary) - How long does one "tick" take?
# Using Summary to track P50/P90/P99 latency of the simulation loop
PHYSICS_TICK_DURATION = Summary(
    'simulator_tick_duration_seconds',
    'Time spent processing one physics simulation step'
)

# 3. Messages Published (Counter) - Total MQTT messages sent
MESSAGES_PUBLISHED = Counter(
    'simulator_messages_published_total',
    'Total number of telemetry messages published to MQTT',
    ['topic_type'] # e.g., 'telemetry', 'event'
)

# 4. Simulation Errors (Counter)
SIMULATION_ERRORS = Counter(
    'simulator_errors_total',
    'Total number of errors encountered during simulation',
    ['error_type']
)

def start_metrics_server(port=9090):
    """Starts the Prometheus metrics server on a separate thread."""
    try:
        start_http_server(port)
        print(f"📊 Metrics server started on port {port}")
    except Exception as e:
        print(f"❌ Failed to start metrics server: {e}")
