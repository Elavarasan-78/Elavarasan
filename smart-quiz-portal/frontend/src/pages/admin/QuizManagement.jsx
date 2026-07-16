import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, Eye, Globe, EyeOff, Copy, Loader2, BookOpen } from 'lucide-react';

const emptyForm = { title: '', description: '', duration: 30, totalMarks: 100, negativeMarks: 0, passMarks: 40, shuffleQuestions: false, shuffleOptions: false, maxAttempts: 1, subjectId: '' };

const F = ({ label, name, type = 'text', min, step, form, setForm }) => (
  <div>
    <label className="label">{label}</label>
    <input className="input" type={type} min={min} step={step} value={form[name]} onChange={e => setForm(f => ({ ...f, [name]: type === 'number' ? parseFloat(e.target.value) : e.target.value }))} required />
  </div>
);

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([adminAPI.getQuizzes(), adminAPI.getSubjects()]).then(([q, s]) => {
      setQuizzes(q.data); setSubjects(s.data); setLoading(false);
    });
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setError(''); setModal(true); };
  const openEdit = (q) => {
    setEditItem(q);
    setForm({ title: q.title, description: q.description || '', duration: q.duration, totalMarks: q.totalMarks, negativeMarks: q.negativeMarks, passMarks: q.passMarks, shuffleQuestions: q.shuffleQuestions, shuffleOptions: q.shuffleOptions, maxAttempts: q.maxAttempts, subjectId: q.subjectId });
    setError(''); setModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editItem) await adminAPI.updateQuiz(editItem.id, form);
      else await adminAPI.createQuiz(form);
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this quiz and all its questions?')) return;
    await adminAPI.deleteQuiz(id); load();
  };

  const handleTogglePublish = async (q) => {
    if (q.isPublished) await adminAPI.unpublishQuiz(q.id);
    else await adminAPI.publishQuiz(q.id);
    load();
  };

  const handleDuplicate = async (id) => { await adminAPI.duplicateQuiz(id); load(); };



  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Quiz Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{quizzes.length} quizzes</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={16} /> Create Quiz</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <div className="card">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>Quiz</th><th>Subject</th><th>Questions</th><th>Duration</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
              <tbody>
                {quizzes.map(q => (
                  <tr key={q.id}>
                    <td>
                      <p className="font-medium text-slate-900 dark:text-white">{q.title}</p>
                      <p className="text-xs text-slate-400">{q.totalMarks} marks · Pass: {q.passMarks}</p>
                    </td>
                    <td>
                      <p className="text-sm font-medium">{q.subjectName}</p>
                      <p className="text-xs text-slate-400">{q.categoryName}</p>
                    </td>
                    <td><span className="badge-info">{q.questionCount} Qs</span></td>
                    <td>{q.duration} min</td>
                    <td>
                      <span className={q.isPublished ? 'badge-success' : 'badge-gray'}>
                        {q.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/admin/quizzes/${q.id}/questions`} className="btn-ghost btn-sm" title="Manage Questions"><BookOpen size={14} /></Link>
                        <button onClick={() => openEdit(q)} className="btn-ghost btn-sm" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => handleTogglePublish(q)} className={`btn-sm btn-ghost ${q.isPublished ? 'text-amber-500' : 'text-emerald-600'}`} title={q.isPublished ? 'Unpublish' : 'Publish'}>
                          {q.isPublished ? <EyeOff size={14} /> : <Globe size={14} />}
                        </button>
                        <button onClick={() => handleDuplicate(q.id)} className="btn-ghost btn-sm text-blue-500" title="Duplicate"><Copy size={14} /></button>
                        <button onClick={() => handleDelete(q.id)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!quizzes.length && <tr><td colSpan={6} className="text-center py-10 text-slate-400">No quizzes yet. Click "Create Quiz" to get started.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal p-6 max-w-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{editItem ? 'Edit Quiz' : 'Create Quiz'}</h2>
            {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Subject *</label>
                <select className="input" value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} required>
                  <option value="">Select subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.categoryName})</option>)}
                </select>
              </div>
              <F label="Quiz Title *" name="title" form={form} setForm={setForm} />
              <div>
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <F label="Duration (min) *" name="duration" type="number" min="1" form={form} setForm={setForm} />
                <F label="Total Marks *" name="totalMarks" type="number" min="1" form={form} setForm={setForm} />
                <F label="Pass Marks *" name="passMarks" type="number" min="0" form={form} setForm={setForm} />
                <F label="Negative Marks" name="negativeMarks" type="number" min="0" step="0.25" form={form} setForm={setForm} />
                <F label="Max Attempts *" name="maxAttempts" type="number" min="1" form={form} setForm={setForm} />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                  <input type="checkbox" checked={form.shuffleQuestions} onChange={e => setForm(f => ({ ...f, shuffleQuestions: e.target.checked }))} className="rounded" />
                  Shuffle Questions
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300">
                  <input type="checkbox" checked={form.shuffleOptions} onChange={e => setForm(f => ({ ...f, shuffleOptions: e.target.checked }))} className="rounded" />
                  Shuffle Options
                </label>
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
