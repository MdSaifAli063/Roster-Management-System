import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaff } from '../lib/auth';

export default function StaffRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!isStaff(user?.role)) return <Navigate to="/view-roster" replace />;
  return children;
}
