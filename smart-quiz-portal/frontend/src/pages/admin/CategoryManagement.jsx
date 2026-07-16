import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

const emptyForm = { name: '', description: '' };

export default function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    adminAPI.getCategories().then(r => { setCategories(r.data); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setError(''); setModal(true); };
  const openEdit = (c) => { setEditItem(c); setForm({ name: c.name, description: c.description || '' }); setError(''); setModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editItem) await adminAPI.updateCategory(editItem.id, form);
      else await adminAPI.createCategory(form);
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? All associated subjects/quizzes may be affected.')) return;
    await adminAPI.deleteCategory(id);
    load();
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Category Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Add Category</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <div className="card">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>Name</th><th>Description</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td><span className="font-medium text-slate-900 dark:text-white">{c.name}</span></td>
                    <td className="text-slate-500 dark:text-slate-400">{c.description || '—'}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="btn-ghost btn-sm"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(c.id)} className="btn-ghost btn-sm text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!categories.length && <tr><td colSpan={3} className="text-center py-10 text-slate-400">No categories yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{editItem ? 'Edit Category' : 'Add Category'}</h2>
            {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Category Name *</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Science" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
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
