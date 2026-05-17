import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Login() {
  const [email, setEmail] = useState('admin@roster.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'EMPLOYEE' ? '/view-roster' : '/');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-center bg-navy p-12 text-white lg:flex">
        <Calendar className="mb-6 h-12 w-12 text-teal" />
        <h1 className="font-display text-4xl font-bold">Roster Management</h1>
        <p className="mt-4 max-w-md text-slate-300">
          Plan shifts, manage holidays, and keep your workforce schedule organized in one place.
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center p-8">
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden">
            <Calendar className="mb-2 h-10 w-10 text-teal" />
            <h2 className="font-display text-2xl font-bold text-navy dark:text-white">Sign in</h2>
          </div>
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" variant="teal" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
          <p className="text-center text-xs text-slate-500">Demo: admin@roster.com / admin123</p>
        </form>
      </div>
    </div>
  );
}
