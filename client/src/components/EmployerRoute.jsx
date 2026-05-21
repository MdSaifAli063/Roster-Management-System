import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isEmployer } from '../lib/auth';

export default function EmployerRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
        Loading…
      </div>
    );
  }
  if (!isEmployer(user?.role)) {
    return <Navigate to="/view-roster" replace />;
  }
  return children;
}
