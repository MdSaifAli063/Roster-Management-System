import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import Logo from '../components/Logo';
import AuthMarketingPanel from '../components/auth/AuthMarketingPanel';
import AuthBackLink from '../components/auth/AuthBackLink';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/ui/Button';
import { getHomePath, ROLE_OPTIONS, ROLES } from '../lib/auth';
import { isApiMisconfigured } from '../lib/apiConfig';
import { cn } from '../lib/utils';
import GoogleAuthButton from '../components/GoogleAuthButton';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500';

const selectClass =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';

function authErrorMessage(err) {
  const status = err.response?.status;
  if (status === 405) {
    return 'API route error. Redeploy with the latest code, or set VITE_API_URL if using a separate backend.';
  }
  if (status === 404 && isApiMisconfigured()) {
    return 'Invalid VITE_API_URL. Use full URL with /api suffix, or leave unset for Vercel all-in-one deploy.';
  }
  return err.response?.data?.error || err.message || 'Request failed';
}

function AuthLabel({ children, required }) {
  return (
    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </span>
  );
}

function AuthField({
  label,
  required,
  type = 'text',
  showToggle,
  visible,
  onToggleVisible,
  className,
  ...props
}) {
  const isPassword = type === 'password' && showToggle;
  const inputType = isPassword ? (visible ? 'text' : 'password') : type;

  return (
    <label className="block space-y-1.5">
      <AuthLabel required={required}>{label}</AuthLabel>
      <div className="relative">
        <input
          type={inputType}
          required={required}
          className={cn(inputClass, isPassword && 'pr-11', className)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onToggleVisible}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </label>
  );
}

function AuthDivider({ children }) {
  return (
    <div className="relative py-1.5">
      <div className="absolute inset-x-0 top-1/2 border-t border-slate-200 dark:border-slate-700" />
      <p className="relative mx-auto w-fit bg-white px-3 text-center text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        {children}
      </p>
    </div>
  );
}

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(ROLES.EMPLOYEE);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, loginWithGoogle } = useAuth();
  const { dark } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const isSignUp = mode === 'signup';

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') setMode('signup');
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setMode('signup');
      setError('');
    }
  }, [searchParams]);

  useEffect(() => {
    document.documentElement.classList.add('auth-page-lock');
    return () => document.documentElement.classList.remove('auth-page-lock');
  }, []);

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(redirectTo || getHomePath(user.role));
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (credential) => {
    setError('');
    setLoading(true);
    try {
      const user = await loginWithGoogle({
        credential,
        role: isSignUp ? role : undefined,
        mode: isSignUp ? 'signup' : 'signin',
      });
      navigate(redirectTo || getHomePath(user.role));
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const user = await signup({ name, email, password, role });
      navigate(redirectTo || getHomePath(user.role));
    } catch (err) {
      setError(authErrorMessage(err) || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-white dark:bg-slate-950">
      {/* Left panel — fixed width matches sign-in & sign-up */}
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden lg:w-[520px] lg:shrink-0 xl:w-[540px]">
        <div className="shrink-0 px-6 pt-5 sm:px-10 lg:px-12">
          <AuthBackLink to="/" label="Back to home" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden px-6 pb-6 sm:px-10 lg:px-12">
          <div className="mx-auto flex w-full max-w-[400px] min-h-0 flex-col justify-center">
            <div className="mb-5 flex shrink-0 justify-center lg:justify-start">
              <Logo variant="full" size="lg" theme={dark ? 'dark' : 'light'} linkTo="/" />
            </div>

            <h1 className="shrink-0 text-center font-display text-2xl font-bold leading-snug text-slate-900 dark:text-white sm:text-[1.65rem] lg:text-left">
              {isSignUp ? 'Create your RosterPro account' : 'Welcome back to RosterPro'}
            </h1>
            <p className="mt-2 min-h-[2.75rem] shrink-0 text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400 lg:text-left">
              {isSignUp
                ? 'Ready to manage your workforce more efficiently? Create your account to get started.'
                : 'Ready to manage your workforce more efficiently? Log in to your account.'}
            </p>

            {searchParams.get('checkout') === 'success' && (
              <div className="mt-3 shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
                Payment received — sign up with the same email to activate your plan.
              </div>
            )}

            {isApiMisconfigured() && (
              <div className="mt-3 shrink-0 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                Invalid <strong>VITE_API_URL</strong>.
              </div>
            )}

            <div className="mt-5 shrink-0 space-y-3.5">
              <GoogleAuthButton
                mode={isSignUp ? 'signup' : 'signin'}
                variant="auth"
                disabled={loading}
                onSuccess={handleGoogleAuth}
                onError={(err) => setError(err.message)}
              />

              <AuthDivider>
                {isSignUp ? 'Or sign up manually with email' : 'Or login manually with email'}
              </AuthDivider>

              {/* Fixed-height form area keeps sign-in / sign-up panels identical */}
              <div className="min-h-[292px]">
                {isSignUp ? (
                  <form onSubmit={handleSignUp} className="space-y-2.5">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <AuthField
                        label="Full name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        autoComplete="name"
                      />
                      <AuthField
                        label="Email address"
                        required
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email address"
                        autoComplete="email"
                      />
                    </div>
                    <label className="block space-y-1.5">
                      <AuthLabel required>Role</AuthLabel>
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className={selectClass}
                        required
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <AuthField
                        label="Password"
                        required
                        type="password"
                        showToggle
                        visible={showPassword}
                        onToggleVisible={() => setShowPassword((v) => !v)}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        autoComplete="new-password"
                        minLength={8}
                      />
                      <AuthField
                        label="Confirm password"
                        required
                        type="password"
                        showToggle
                        visible={showConfirm}
                        onToggleVisible={() => setShowConfirm((v) => !v)}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm"
                        autoComplete="new-password"
                      />
                    </div>
                    <div className="h-5" aria-hidden />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button
                      type="submit"
                      className="w-full min-h-11 rounded-xl text-base font-semibold"
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? 'Creating account…' : 'Create account'}
                    </Button>
                    <p className="min-h-[1.25rem] text-center text-xs text-transparent" aria-hidden>
                      placeholder
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-3">
                    <AuthField
                      label="Email address"
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      autoComplete="email"
                    />
                    <AuthField
                      label="Password"
                      required
                      type="password"
                      showToggle
                      visible={showPassword}
                      onToggleVisible={() => setShowPassword((v) => !v)}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                    />
                    <div className="flex h-5 items-center justify-end">
                      <Link
                        to="/login"
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        onClick={(e) => {
                          e.preventDefault();
                          setError('Password reset is not available yet. Contact your administrator.');
                        }}
                      >
                        Forgot password?
                      </Link>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button
                      type="submit"
                      className="w-full min-h-11 rounded-xl text-base font-semibold"
                      variant="primary"
                      disabled={loading}
                    >
                      {loading ? 'Signing in…' : 'Login'}
                    </Button>
                    <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                      Demo:{' '}
                      <span className="font-mono text-slate-700 dark:text-slate-300">demo@rosterpro.com</span>
                      {' / '}
                      <span className="font-mono text-slate-700 dark:text-slate-300">DemoPro2025!</span>
                    </p>
                  </form>
                )}
              </div>
            </div>

            <p className="mt-6 shrink-0 text-center text-sm text-slate-600 dark:text-slate-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
                className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <AuthMarketingPanel />
    </div>
  );
}
