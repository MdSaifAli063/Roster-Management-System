import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import StaffRoute from './components/StaffRoute';
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
import Profile from './pages/Profile';
import Leave from './pages/Leave';

function Staff({ children }) {
  return <StaffRoute>{children}</StaffRoute>;
}

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
              <Route index element={<Staff><Dashboard /></Staff>} />
              <Route path="manage-roster" element={<Staff><ManageRoster /></Staff>} />
              <Route path="view-roster" element={<ViewRoster />} />
              <Route path="actual-roster" element={<Staff><ActualRoster /></Staff>} />
              <Route path="leave" element={<Leave />} />
              <Route path="employees" element={<Staff><Employees /></Staff>} />
              <Route path="shifts" element={<Staff><Shifts /></Staff>} />
              <Route path="holidays" element={<Staff><Holidays /></Staff>} />
              <Route path="plants" element={<Staff><PlantMaster /></Staff>} />
              <Route path="assignments" element={<Staff><Assignments /></Staff>} />
              <Route path="reports" element={<Staff><Reports /></Staff>} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
