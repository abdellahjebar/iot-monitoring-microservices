import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { Dashboard } from './pages/dashboard/Dashboard';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';

import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { NotificationProvider } from './context/NotificationContext';
import { TelemetryProvider } from './context/TelemetryContext';

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <TelemetryProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route
                  path="/"
                  element={
                    <DashboardLayout>
                      <Dashboard />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <DashboardLayout>
                      <InventoryPage />
                    </DashboardLayout>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <DashboardLayout>
                      <AnalyticsPage />
                    </DashboardLayout>
                  }
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </TelemetryProvider>
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
