import { useState } from 'react';
import { mockApi } from '../shared/api/client';
import { MockApiError } from '../shared/api/types';
import { useSession } from '../shared/SessionContext';
import { PageHeader, Card, Button, Input, ErrorBanner, showToast } from '../shared/ui';

export default function SecurityPage() {
  const { user } = useSession();
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!currentPw) errs.currentPw = 'Enter your current password.';
    if (!newPw || newPw.length < 6) errs.newPw = 'New password must be at least 6 characters.';
    if (newPw !== confirmPw) errs.confirmPw = 'Passwords do not match.';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      mockApi.changePassword(currentPw, newPw);
      showToast('Password changed successfully.');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (e) {
      if (e instanceof MockApiError) {
        if (e.apiError.details) {
          const d: Record<string, string> = {};
          for (const [k, v] of Object.entries(e.apiError.details)) d[k] = v;
          setErrors(d);
        } else {
          setErrors({ form: e.apiError.message });
        }
      } else {
        setErrors({ form: 'Password change failed.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Change Password" subtitle="Update your account password" />

      <div className="max-w-sm">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-white font-semibold">
              {user?.fullName.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-slate-800">{user?.fullName}</p>
              <p className="text-xs text-slate-400 font-mono">{user?.username}</p>
            </div>
          </div>

          {errors.form && <div className="mb-4"><ErrorBanner message={errors.form} onDismiss={() => setErrors({})} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              error={errors.currentPw || errors.currentPassword}
              autoComplete="current-password"
            />
            <Input
              label="New Password"
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              error={errors.newPw || errors.newPassword}
              hint="Minimum 6 characters"
              autoComplete="new-password"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              error={errors.confirmPw}
              autoComplete="new-password"
            />
            <Button type="submit" className="w-full" loading={loading}>
              Change Password
            </Button>
          </form>
        </Card>

        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-700 mb-2">Password Policy</h3>
          <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
            <li>At least 6 characters</li>
            <li>New password must differ from current</li>
            <li>Current password is required for security</li>
            <li>In demo mode: passwords are stored in browser only and are not real credentials</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
