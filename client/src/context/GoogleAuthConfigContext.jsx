import { createContext, useContext, useEffect, useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import api from '../api/client';

const GoogleAuthConfigContext = createContext({
  clientId: null,
  loading: true,
  configured: false,
});

export function GoogleAuthConfigProvider({ children }) {
  const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || null;
  const [clientId, setClientId] = useState(envClientId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/auth/config')
      .then((res) => {
        if (cancelled) return;
        const fromApi = res.data?.googleClientId?.trim();
        if (fromApi) setClientId(fromApi);
        else if (envClientId) setClientId(envClientId);
      })
      .catch(() => {
        if (!cancelled && envClientId) setClientId(envClientId);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [envClientId]);

  const value = {
    clientId,
    loading,
    configured: Boolean(clientId),
  };

  const inner = (
    <GoogleAuthConfigContext.Provider value={value}>{children}</GoogleAuthConfigContext.Provider>
  );

  if (clientId) {
    return <GoogleOAuthProvider clientId={clientId}>{inner}</GoogleOAuthProvider>;
  }
  return inner;
}

export function useGoogleAuthConfig() {
  return useContext(GoogleAuthConfigContext);
}
