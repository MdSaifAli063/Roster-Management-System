import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { getHomePath, ROLE_OPTIONS, ROLES } from '../lib/auth';
import { cn } from '../lib/utils';

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

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(getHomePath(user.role));
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
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
      navigate(getHomePath(user.role));
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="hidden flex-1 flex-col justify-center bg-navy p-12 text-white lg:flex">
        <Calendar className="mb-6 h-12 w-12 text-teal" />
        <h1 className="font-display text-4xl font-bold">Roster Management</h1>
        <p className="mt-4 max-w-md text-slate-300">
          Sign in or create an account. Choose your role — Employee, HR User, or Training Manager.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 lg:hidden">
            <Calendar className="mb-2 h-10 w-10 text-teal" />
            <h2 className="font-display text-2xl font-bold text-navy dark:text-white">RosterPro</h2>
          </div>

          <div className="mb-6 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {['signin', 'signup'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setMode(tab); setError(''); }}
                className={cn(
                  'flex-1 rounded-md py-2 text-sm font-medium transition-colors',
                  mode === tab
                    ? 'bg-white text-navy shadow dark:bg-slate-700 dark:text-white'
                    : 'text-slate-600 hover:text-navy dark:text-slate-400'
                )}
              >
                {tab === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" variant="teal" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
              <p className="text-center text-xs text-slate-500">
                Demo: admin@roster.com / admin123
              </p>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <Input
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Select>
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <Input
                label="Confirm password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="w-full" variant="teal" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
