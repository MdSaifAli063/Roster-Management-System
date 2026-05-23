import { GoogleLogin } from '@react-oauth/google';
import { useGoogleAuthConfig } from '../context/GoogleAuthConfigContext';
import { cn } from '../lib/utils';

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const pillVisualClass = cn(
  'pointer-events-none flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
);

function GoogleLoginLayer({ label, gsiText, disabled, onSuccess, onError }) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 overflow-hidden rounded-full opacity-[0.011]',
        '[&>div]:!h-full [&>div]:!w-full',
        disabled && 'pointer-events-none'
      )}
      aria-label={label}
    >
      <GoogleLogin
        onSuccess={(res) => {
          if (res.credential) onSuccess(res.credential);
          else onError?.(new Error('Google did not return a credential'));
        }}
        onError={() => onError?.(new Error('Google sign-in was cancelled or failed'))}
        useOneTap={false}
        theme="outline"
        size="large"
        text={gsiText}
        shape="pill"
        width="400"
      />
    </div>
  );
}

/**
 * @param {'signin' | 'signup'} mode
 * @param {'auth' | 'default'} variant — auth = pill style for login page
 */
export default function GoogleAuthButton({
  mode = 'signin',
  variant = 'default',
  onSuccess,
  onError,
  disabled,
}) {
  const { configured, loading } = useGoogleAuthConfig();
  const label = mode === 'signup' ? 'Sign up with Google' : 'Login with Google';
  const gsiText = mode === 'signup' ? 'signup_with' : 'signin_with';

  if (loading) {
    return (
      <div className={variant === 'auth' ? 'relative w-full' : 'w-full'}>
        <div className={variant === 'auth' ? pillVisualClass : 'flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-medium opacity-70'}>
          <GoogleIcon />
          {label}
        </div>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="w-full">
        <div className={variant === 'auth' ? pillVisualClass : 'flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--text-secondary)] opacity-70'}>
          <GoogleIcon />
          {label}
        </div>
        {variant === 'auth' && (
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Google Sign-In is not configured on this server.
          </p>
        )}
      </div>
    );
  }

  if (variant === 'auth') {
    return (
      <div className="relative w-full">
        <div className={pillVisualClass}>
          <GoogleIcon />
          {label}
        </div>
        <GoogleLoginLayer
          label={label}
          gsiText={gsiText}
          disabled={disabled}
          onSuccess={onSuccess}
          onError={onError}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex w-full justify-center rounded-lg border border-[var(--border)] bg-white py-0.5 dark:bg-[var(--bg-secondary)]',
        '[&>div]:!w-full [&>div]:!flex [&>div]:!justify-center',
        disabled && 'pointer-events-none opacity-50'
      )}
      aria-label={label}
    >
      <GoogleLogin
        onSuccess={(res) => {
          if (res.credential) onSuccess(res.credential);
          else onError?.(new Error('Google did not return a credential'));
        }}
        onError={() => onError?.(new Error('Google sign-in was cancelled or failed'))}
        useOneTap={false}
        theme="outline"
        size="large"
        text={gsiText}
        shape="rectangular"
        width="360"
      />
    </div>
  );
}
