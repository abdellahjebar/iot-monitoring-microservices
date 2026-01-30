import unittest
from datetime import datetime

# Logic to be tested (mocked here for TDD structure, will move to main.py)
def calculate_thermal_physics(ambient_temp, cpu_load, cooling_active=False):
    heat_coefficient = 0.5
    if cooling_active:
        heat_coefficient = 0.2 # Fan reduces heat accumulation
        
    internal_heat = cpu_load * heat_coefficient
    return round(ambient_temp + internal_heat, 2)

class TestPhysicsEngine(unittest.TestCase):
    
    def test_ifrane_safe_scenario(self):
        """Case 1: Ifrane (10C) + High CPU (90%) = Warm but Safe"""
        ambient = 10.0
        cpu = 90.0
        
        # 10 + (90 * 0.5) = 10 + 45 = 55.0
        temp = calculate_thermal_physics(ambient, cpu)
        
        self.assertEqual(temp, 55.0)
        self.assertTrue(temp < 75.0, "Ifrane device should NOT overheat")

    def test_laayoune_critical_scenario(self):
        """Case 2: Laayoune (40C) + High CPU (90%) = CRITICAL"""
        ambient = 40.0
        cpu = 90.0
        
        # 40 + (90 * 0.5) = 40 + 45 = 85.0
        temp = calculate_thermal_physics(ambient, cpu)
        
        self.assertEqual(temp, 85.0)
        self.assertTrue(temp > 75.0, "Laayoune device MUST overheat")

    def test_cooling_fan_impact(self):
        """Case 3: Laayoune (40C) + High CPU (90%) + FAN ON = SAFE"""
        ambient = 40.0
        cpu = 90.0
        cooling = True
        
        # 40 + (90 * 0.2) = 40 + 18 = 58.0
        temp = calculate_thermal_physics(ambient, cpu, cooling)
        
        self.assertEqual(temp, 58.0)
        self.assertTrue(temp < 75.0, "Cooling fan should save the device")

if __name__ == '__main__':
    unittest.main()
