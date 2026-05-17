import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageRoster from './pages/ManageRoster';
import ViewRoster from './pages/ViewRoster';
import ActualRoster from './pages/ActualRoster';
import Employees from './pages/Employees';
import Shifts from './pages/Shifts';
import Holidays from './pages/Holidays';
import PlantMaster from './pages/PlantMaster';
import Assignments from './pages/Assignments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Leave from './pages/Leave';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="manage-roster" element={<ManageRoster />} />
              <Route path="view-roster" element={<ViewRoster />} />
              <Route path="actual-roster" element={<ActualRoster />} />
              <Route path="leave" element={<Leave />} />
              <Route path="employees" element={<Employees />} />
              <Route path="shifts" element={<Shifts />} />
              <Route path="holidays" element={<Holidays />} />
              <Route path="plants" element={<PlantMaster />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
