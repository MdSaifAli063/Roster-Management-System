import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import api from '../api/client';
import {
  clickGoogleSignInButton,
  ensureGoogleSignInInitialized,
  renderHiddenGoogleButton,
} from '../lib/googleSignIn';

const GoogleAuthConfigContext = createContext({
  clientId: null,
  loading: true,
  configured: false,
  gsiReady: false,
  requestSignIn: () => {},
});

function isValidGoogleClientId(value) {
  const clientId = String(value || '').trim();
  const normalized = clientId.toLowerCase();
  if (!clientId || !clientId.endsWith('.apps.googleusercontent.com')) return false;
  if (normalized.includes('xxxx') || normalized.includes('example') || normalized.includes('your-client-id')) {
    return false;
  }
  return true;
}

export function GoogleAuthConfigProvider({ children }) {
  const [clientId, setClientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gsiReady, setGsiReady] = useState(false);
  const buttonHostRef = useRef(null);
  const credentialHandlerRef = useRef(null);
  const buttonRenderedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const envClientIdRaw = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || null;
    const envClientId = isValidGoogleClientId(envClientIdRaw) ? envClientIdRaw : null;

    api
      .get('/auth/config')
      .then((res) => {
        if (cancelled) return;
        const fromApiRaw = res.data?.googleClientId?.trim();
        const fromApi = isValidGoogleClientId(fromApiRaw) ? fromApiRaw : null;
        setClientId(fromApi || envClientId || null);
      })
      .catch(() => {
        if (!cancelled) setClientId(envClientId);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!clientId) {
      setGsiReady(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        await ensureGoogleSignInInitialized(clientId, (credential) => {
          credentialHandlerRef.current?.(credential);
        });
        if (!cancelled) setGsiReady(true);
      } catch (err) {
        console.warn('Google Sign-In init:', err.message);
        if (!cancelled) setGsiReady(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  useEffect(() => {
    if (!gsiReady || !buttonHostRef.current || buttonRenderedRef.current) return;
    renderHiddenGoogleButton(buttonHostRef.current, {
      text: 'signin_with',
      shape: 'pill',
      width: 400,
    });
    buttonRenderedRef.current = true;
  }, [gsiReady]);

  const requestSignIn = useCallback(
    (onCredential, onError) => {
      if (!gsiReady || !clientId) {
        onError?.(new Error('Google Sign-In is not configured'));
        return;
      }
      credentialHandlerRef.current = (credential) => {
        credentialHandlerRef.current = null;
        onCredential(credential);
      };
      try {
        clickGoogleSignInButton(buttonHostRef.current);
      } catch {
        credentialHandlerRef.current = null;
        onError?.(new Error('Could not open Google Sign-In'));
      }
    },
    [gsiReady, clientId]
  );

  const value = {
    clientId,
    loading,
    configured: Boolean(clientId),
    gsiReady,
    requestSignIn,
  };

  return (
    <GoogleAuthConfigContext.Provider value={value}>
      {children}
      {clientId ? (
        <div
          ref={buttonHostRef}
          className="pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0"
          aria-hidden
        />
      ) : null}
    </GoogleAuthConfigContext.Provider>
  );
}

export function useGoogleAuthConfig() {
  return useContext(GoogleAuthConfigContext);
}
