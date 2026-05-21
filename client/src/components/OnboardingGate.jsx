import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { isEmployer } from '../lib/auth';

export default function OnboardingGate({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!isEmployer(user?.role)) return;
    api.get('/business/status')
      .then((r) => setStatus(r.data))
      .catch(() => setStatus({ hasBusiness: false, is_onboarded: true }));
  }, [user?.role]);

  if (!isEmployer(user?.role)) return children;
  if (status === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-[var(--text-secondary)]">
        Loading…
      </div>
    );
  }
  if (!status.is_onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}
