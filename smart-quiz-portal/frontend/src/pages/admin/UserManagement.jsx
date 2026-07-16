import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { Search, UserCheck, UserX, KeyRound, Loader2 } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [resetModal, setResetModal] = useState(null);
  const [newPwd, setNewPwd] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (q = '') => {
    setLoading(true);
    const r = q ? await adminAPI.searchUsers(q) : await adminAPI.getUsers();
    setUsers(r.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSearch = (e) => { setSearch(e.target.value); clearTimeout(window._st); window._st = setTimeout(() => load(e.target.value), 400); };

  const toggleStatus = async (u) => {
    await adminAPI.toggleUserStatus(u.id, !u.isActive);
    load(search);
  };

  const handleReset = async (e) => {
    e.preventDefault(); setSaving(true);
    await adminAPI.resetUserPassword(resetModal.id, newPwd);
    setResetModal(null); setNewPwd(''); setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{users.length} users</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input className="input pl-9 max-w-sm" placeholder="Search by name or username..." value={search} onChange={handleSearch} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <div className="card">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>User</th><th>Email</th><th>Status</th><th>Joined</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">{u.fullName?.charAt(0)}</div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">{u.fullName}</p>
                          <p className="text-xs text-slate-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                    <td>
                      <span className={u.isActive ? 'badge-success' : 'badge-danger'}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => toggleStatus(u)} className={`btn-ghost btn-sm ${u.isActive ? 'text-amber-500' : 'text-emerald-600'}`} title={u.isActive ? 'Deactivate' : 'Activate'}>
                          {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                        <button onClick={() => { setResetModal(u); setNewPwd(''); }} className="btn-ghost btn-sm text-blue-500" title="Reset Password">
                          <KeyRound size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!users.length && <tr><td colSpan={5} className="text-center py-10 text-slate-400">No users found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {resetModal && (
        <div className="modal-overlay" onClick={() => setResetModal(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Reset Password</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Set a new password for <strong>{resetModal.fullName}</strong></p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="label">New Password *</label>
                <input className="input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setResetModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving && <Loader2 size={15} className="animate-spin" />}Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
