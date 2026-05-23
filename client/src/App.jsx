import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GoogleAuthConfigProvider } from './context/GoogleAuthConfigContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { PlanProvider } from './context/PlanContext';
import ProtectedRoute from './components/ProtectedRoute';
import EmployerRoute from './components/EmployerRoute';
import EmployeeRoute from './components/EmployeeRoute';
import OnboardingGate from './components/OnboardingGate';
import Layout from './components/Layout';
import Home from './pages/Home';
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
import Attendance from './pages/Attendance';
import PdfExtract from './pages/PdfExtract';
import Onboarding from './pages/Onboarding';
import Staff from './pages/Staff';
import StaffDetail from './pages/StaffDetail';
import Finance from './pages/Finance';
import Pricing from './pages/Pricing';
import BillingSettings from './pages/BillingSettings';
import Organization from './pages/Organization';

function Employer({ children }) {
  return (
    <EmployerRoute>
      <OnboardingGate>{children}</OnboardingGate>
    </EmployerRoute>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <GoogleAuthConfigProvider>
      <AuthProvider>
        <PlanProvider>
        <NotificationProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="manage-roster" element={<Employer><ManageRoster /></Employer>} />
                  <Route path="view-roster" element={<ViewRoster />} />
                  <Route path="actual-roster" element={<Employer><ActualRoster /></Employer>} />
                  <Route path="leave" element={<Leave />} />
                  <Route path="attendance" element={<EmployeeRoute><Attendance /></EmployeeRoute>} />
                  <Route path="staff" element={<Employer><Staff /></Employer>} />
                  <Route path="staff/:id" element={<Employer><StaffDetail /></Employer>} />
                  <Route path="employees" element={<Employer><Employees /></Employer>} />
                  <Route path="shifts" element={<Employer><Shifts /></Employer>} />
                  <Route path="holidays" element={<Employer><Holidays /></Employer>} />
                  <Route path="plants" element={<Employer><PlantMaster /></Employer>} />
                  <Route path="assignments" element={<Employer><Assignments /></Employer>} />
                  <Route path="reports" element={<Employer><Reports /></Employer>} />
                  <Route path="pdf-extractor" element={<Employer><PdfExtract /></Employer>} />
                  <Route path="pdf-extract" element={<Navigate to="/pdf-extractor" replace />} />
                  <Route path="finance" element={<Employer><Finance /></Employer>} />
                  <Route path="organization" element={<Employer><Organization /></Employer>} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="settings/billing" element={<Employer><BillingSettings /></Employer>} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </NotificationProvider>
        </PlanProvider>
      </AuthProvider>
      </GoogleAuthConfigProvider>
    </ThemeProvider>
  );
}
