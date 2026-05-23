import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { getHomePath, ROLE_OPTIONS, ROLES } from '../lib/auth';
import { isApiMisconfigured } from '../lib/apiConfig';
import { cn } from '../lib/utils';

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

export default function Login() {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(ROLES.EMPLOYEE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  useEffect(() => {
    if (searchParams.get('mode') === 'signup') setMode('signup');
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setMode('signup');
      setError('');
    }
  }, [searchParams]);

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
    <div className="mesh-bg flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden bg-[var(--bg-primary)] lg:flex-row">
      <div className="relative hidden flex-1 flex-col justify-center overflow-hidden p-12 lg:flex">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0d1428]" />
        <div className="relative z-10 max-w-lg">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-[0_0_40px_rgba(59,130,246,0.4)]">
            <Calendar className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white">RosterPro</h1>
          <p className="mt-2 text-lg text-blue-300/80">Premium Enterprise Roster Management</p>
          <p className="mt-6 text-slate-400 leading-relaxed">
            Manage shifts, attendance, holidays, and reports — all in one unified platform built for modern teams.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="glass-card w-full max-w-md p-6 shadow-2xl sm:p-8 animate-scale-in">
          <Link to="/" className="mb-4 inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
            ← Back to home
          </Link>
          <div className="mb-6 lg:hidden">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-[var(--text-primary)]">RosterPro</h2>
          </div>

          {searchParams.get('checkout') === 'success' && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
              Payment received — create your employer account with the same email to activate your plan.
            </div>
          )}

          {isApiMisconfigured() && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              Invalid <strong>VITE_API_URL</strong>. Remove it for Vercel all-in-one deploy, or set a full https://…/api URL.
            </div>
          )}

          <div className="mb-6 flex rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-1">
            {['signin', 'signup'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setMode(tab); setError(''); }}
                className={cn(
                  'flex-1 rounded-md py-2 text-sm font-medium transition-all duration-200',
                  mode === tab
                    ? 'bg-blue-500/20 text-blue-300 shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                {tab === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required error={error || undefined} />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full btn-glow" variant="primary" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
              <p className="text-center font-mono text-xs text-[var(--text-secondary)]">
                Demo: admin@roster.com / admin123
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
              <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)} required>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Input label="Password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
              <Input label="Confirm password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full btn-glow" variant="primary" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
