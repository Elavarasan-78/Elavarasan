import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

const emptyForm = { name: '', description: '', categoryId: '' };

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([adminAPI.getSubjects(), adminAPI.getCategories()]).then(([s, c]) => {
      setSubjects(s.data); setCategories(c.data); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setError(''); setModal(true); };
  const openEdit = (s) => { setEditItem(s); setForm({ name: s.name, description: s.description || '', categoryId: s.categoryId }); setError(''); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editItem) await adminAPI.updateSubject(editItem.id, form);
      else await adminAPI.createSubject(form);
      setModal(false); load();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return;
    await adminAPI.deleteSubject(id); load();
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Subject Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subjects.length} subjects</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Subject</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <div className="card">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>Name</th><th>Category</th><th>Description</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td><span className="font-medium text-slate-900 dark:text-white">{s.name}</span></td>
                    <td><span className="badge-info">{s.categoryName}</span></td>
                    <td className="text-slate-500 dark:text-slate-400">{s.description || '—'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(s)} className="btn-ghost btn-sm"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(s.id)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!subjects.length && <tr><td colSpan={4} className="text-center py-10 text-slate-400">No subjects yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{editItem ? 'Edit Subject' : 'Add Subject'}</h2>
            {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Category *</label>
                <select className="input" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Subject Name *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Mathematics" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving && <Loader2 size={15} className="animate-spin" />}{editItem ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
