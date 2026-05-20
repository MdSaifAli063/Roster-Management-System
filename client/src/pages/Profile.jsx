import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Mail, Shield, Calendar, Settings, Pencil, Camera, X, Check, Loader2 } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHeader from '../components/PageHeader';
import UserAvatar from '../components/UserAvatar';
import { Input } from '../components/ui/Input';
import { CardSkeleton } from '../components/ui/Skeleton';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getRoleLabel } from '../lib/auth';
import api from '../api/client';
import { format } from 'date-fns';

const MAX_AVATAR_BYTES = 512 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarDirty, setAvatarDirty] = useState(false);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const loadProfile = () =>
    api.get('/auth/me').then((res) => {
      setProfile(res.data);
      updateUser?.(res.data);
      return res.data;
    });

  useEffect(() => {
    loadProfile()
      .catch(() => setProfile(user))
      .finally(() => setLoading(false));
  }, [user]);

  const startEdit = () => {
    setForm({ name: profile?.name || '', email: profile?.email || '' });
    setAvatarPreview(null);
    setAvatarDirty(false);
    setRemoveAvatar(false);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setAvatarPreview(null);
    setAvatarDirty(false);
    setRemoveAvatar(false);
  };

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast?.error('Use JPG, PNG, or WebP images only');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast?.error('Image must be under 512 KB');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarPreview(dataUrl);
      setAvatarDirty(true);
      setRemoveAvatar(false);
    } catch {
      toast?.error('Could not read image file');
    }
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setAvatarPreview(null);
    setAvatarDirty(true);
    setRemoveAvatar(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast?.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
      };
      if (avatarDirty) {
        payload.avatar_url = removeAvatar ? null : avatarPreview;
      }
      const { data } = await api.patch('/auth/profile', payload);
      setProfile(data);
      updateUser?.(data);
      setEditing(false);
      setAvatarPreview(null);
      setAvatarDirty(false);
      setRemoveAvatar(false);
      toast?.success('Profile updated successfully');
    } catch (err) {
      toast?.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const displayAvatar = editing
    ? (removeAvatar ? null : avatarPreview || profile?.avatar_url)
    : profile?.avatar_url;

  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), 'd MMMM yyyy')
    : '—';

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        pathname={location.pathname}
        subtitle="Manage your account information and photo"
        actions={
          !editing ? (
            <Button variant="primary" onClick={startEdit}>
              <Pencil className="h-4 w-4" /> Edit profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button variant="primary" type="submit" form="profile-form" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          )
        }
      />

      <Card className="overflow-hidden p-0">
        {/* Header banner */}
        <div className="relative border-b border-[var(--border)] bg-gradient-to-br from-blue-600/20 via-[var(--bg-elevated)] to-cyan-600/10 px-6 py-10 text-center">
          <div className="relative mx-auto inline-block">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={profile?.name}
                className="mx-auto h-28 w-28 rounded-full object-cover ring-4 ring-[var(--bg-secondary)] shadow-xl"
              />
            ) : (
              <UserAvatar user={profile} size="xl" className="mx-auto ring-4 ring-[var(--bg-secondary)] shadow-xl" />
            )}

            {editing && (
              <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 gap-1.5">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-500 focus-ring"
                  title="Upload photo"
                >
                  <Camera className="h-4 w-4" />
                </button>
                {(profile?.avatar_url || avatarPreview) && !removeAvatar && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-red-500 shadow-lg ring-1 ring-[var(--border)] transition hover:bg-red-500/10 focus-ring"
                    title="Remove photo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {!editing ? (
            <>
              <h2 className="mt-5 font-display text-xl font-bold text-[var(--text-primary)]">{profile?.name}</h2>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{profile?.email}</p>
              <span className="mt-3 inline-block rounded-full bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-300">
                {getRoleLabel(profile?.role)}
              </span>
            </>
          ) : (
            <p className="mt-5 text-sm text-[var(--text-secondary)]">
              Click the camera to upload a photo (max 512 KB)
            </p>
          )}
        </div>

        {editing ? (
          <form id="profile-form" onSubmit={handleSave} className="space-y-4 p-5 sm:p-6">
            <Input
              label="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </form>
        ) : (
          <dl className="divide-y divide-[var(--border)]">
            <ProfileRow icon={User} label="Full name" value={profile?.name} />
            <ProfileRow icon={Mail} label="Email" value={profile?.email} />
            <ProfileRow icon={Shield} label="Role" value={getRoleLabel(profile?.role)} />
            <ProfileRow icon={Calendar} label="Member since" value={memberSince} />
          </dl>
        )}
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
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-elevated)]">
        <Icon className="h-5 w-5 text-[var(--accent-primary)]" />
      </div>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{label}</dt>
        <dd className="mt-0.5 truncate text-sm font-medium text-[var(--text-primary)]">{value || '—'}</dd>
      </div>
    </div>
  );
}
