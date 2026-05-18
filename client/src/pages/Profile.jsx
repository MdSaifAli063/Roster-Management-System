import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Shield, Calendar, Settings } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { getRoleLabel } from '../lib/auth';
import api from '../api/client';
import { format } from 'date-fns';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(user))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal border-t-transparent" />
      </div>
    );
  }

  const initials = profile?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), 'd MMMM yyyy')
    : '—';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy dark:text-white">My Profile</h1>
        <p className="text-slate-500 dark:text-slate-400">Your account information</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="flex flex-col items-center border-b border-slate-100 bg-gradient-to-br from-navy to-navy-dark px-6 py-8 text-white dark:border-slate-800">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-teal/20 text-2xl font-bold text-teal ring-4 ring-white/20">
            {initials}
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold">{profile?.name}</h2>
          <p className="text-sm text-slate-300">{getRoleLabel(profile?.role)}</p>
        </div>

        <dl className="divide-y divide-slate-100 dark:divide-slate-800">
          <ProfileRow icon={User} label="Full name" value={profile?.name} />
          <ProfileRow icon={Mail} label="Email" value={profile?.email} />
          <ProfileRow icon={Shield} label="Role" value={getRoleLabel(profile?.role)} />
          <ProfileRow icon={Calendar} label="Member since" value={memberSince} />
        </dl>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button as={Link} to="/settings" variant="secondary">
          <Settings className="h-4 w-4" />
          App settings
        </Button>
      </div>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
        <Icon className="h-5 w-5 text-teal" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-medium text-slate-900 dark:text-slate-100">{value || '—'}</dd>
      </div>
    </div>
  );
}
