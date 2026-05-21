import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isEmployee } from '../lib/auth';

/** Only employees — employers are redirected to dashboard */
export default function EmployeeRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
        Loading…
      </div>
    );
  }
  if (!isEmployee(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
