import { useEffect, useState } from 'react';
import { UserLayout } from '../../components/Layout';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { User, KeyRound, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Profile() {
  const { user: authUser, login } = useAuth();
  
  // Profile Form state
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', username: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form state
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    userAPI.getProfile().then(res => {
      const { fullName, email, username } = res.data;
      setProfileForm({ fullName, email, username });
      setProfileLoading(false);
    }).catch(() => setProfileLoading(false));
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      const res = await userAPI.updateProfile({
        fullName: profileForm.fullName,
        email: profileForm.email
      });
      setProfileSuccess('Profile updated successfully!');
      // Update local storage auth user
      const updatedUser = { ...authUser, fullName: res.data.fullName, email: res.data.email };
      login(updatedUser);
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwdSuccess('');
    setPwdError('');

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters.');
      return;
    }

    setPwdSaving(true);
    try {
      await userAPI.changePassword({
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      setPwdSuccess('Password changed successfully!');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <UserLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your account details and password</p>
        </div>
      </div>

      {profileLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Information Card */}
          <div className="card p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4 mb-6">
              <User className="text-primary-600" size={20} />
              <h2 className="font-bold text-slate-900 dark:text-white">General Information</h2>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={14} /> {profileSuccess}
              </div>
            )}
            {profileError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-xs flex items-center gap-1.5 font-medium">
                <AlertCircle size={14} /> {profileError}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="label">Username</label>
                <input 
                  className="input opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800" 
                  value={`@${profileForm.username}`} 
                  disabled 
                />
                <p className="text-[10px] text-slate-400 mt-1">Username cannot be changed.</p>
              </div>

              <div>
                <label className="label">Full Name *</label>
                <input 
                  className="input" 
                  value={profileForm.fullName} 
                  onChange={e => setProfileForm(f => ({ ...f, fullName: e.target.value }))}
                  required 
                />
              </div>

              <div>
                <label className="label">Email Address *</label>
                <input 
                  type="email"
                  className="input" 
                  value={profileForm.email} 
                  onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                  required 
                />
              </div>

              <button 
                type="submit" 
                disabled={profileSaving}
                className="btn-primary w-full justify-center"
              >
                {profileSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Details
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="card p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-4 mb-6">
              <KeyRound className="text-amber-500" size={20} />
              <h2 className="font-bold text-slate-900 dark:text-white">Change Password</h2>
            </div>

            {pwdSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-1.5 font-medium">
                <CheckCircle2 size={14} /> {pwdSuccess}
              </div>
            )}
            {pwdError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 text-xs flex items-center gap-1.5 font-medium">
                <AlertCircle size={14} /> {pwdError}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="label">Current Password *</label>
                <input 
                  type="password"
                  className="input" 
                  value={pwdForm.currentPassword}
                  onChange={e => setPwdForm(f => ({ ...f, currentPassword: e.target.value }))}
                  required 
                />
              </div>

              <div>
                <label className="label">New Password *</label>
                <input 
                  type="password"
                  className="input" 
                  value={pwdForm.newPassword}
                  onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))}
                  required 
                  minLength={6}
                />
              </div>

              <div>
                <label className="label">Confirm New Password *</label>
                <input 
                  type="password"
                  className="input" 
                  value={pwdForm.confirmPassword}
                  onChange={e => setPwdForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  required 
                  minLength={6}
                />
              </div>

              <button 
                type="submit" 
                disabled={pwdSaving}
                className="btn-primary w-full justify-center bg-amber-500 hover:bg-amber-600 focus:ring-amber-400"
              >
                {pwdSaving ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
