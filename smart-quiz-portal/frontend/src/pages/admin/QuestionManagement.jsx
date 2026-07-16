import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { Plus, Pencil, Trash2, Upload, Download, Loader2, ArrowLeft, X } from 'lucide-react';

const emptyForm = { questionText: '', marks: 1, explanation: '', options: [{ optionText: '', isCorrect: false }, { optionText: '', isCorrect: false }, { optionText: '', isCorrect: false }, { optionText: '', isCorrect: false }] };

export default function QuestionManagement() {
  const { quizId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([adminAPI.getQuestions(quizId), adminAPI.getQuiz(quizId)]).then(([q, quiz]) => {
      setQuestions(q.data); setQuiz(quiz.data); setLoading(false);
    });
  };
  useEffect(() => { load(); }, [quizId]);

  const openCreate = () => { setEditItem(null); setForm(JSON.parse(JSON.stringify(emptyForm))); setError(''); setModal(true); };
  const openEdit = (q) => {
    setEditItem(q);
    setForm({ questionText: q.questionText, marks: q.marks, explanation: q.explanation || '', options: q.options.map(o => ({ id: o.id, optionText: o.optionText, isCorrect: o.isCorrect })) });
    setError(''); setModal(true);
  };

  const setCorrect = (idx) => setForm(f => ({ ...f, options: f.options.map((o, i) => ({ ...o, isCorrect: i === idx })) }));
  const updateOption = (idx, text) => setForm(f => ({ ...f, options: f.options.map((o, i) => i === idx ? { ...o, optionText: text } : o) }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.options.some(o => o.isCorrect)) { setError('Please mark one option as correct'); return; }
    setSaving(true); setError('');
    try {
      if (editItem) await adminAPI.updateQuestion(editItem.id, form);
      else await adminAPI.addQuestion(quizId, form);
      setModal(false); load();
    } catch (err) { setError(err.response?.data?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    await adminAPI.deleteQuestion(id); load();
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try { await adminAPI.bulkUpload(quizId, file); load(); alert('Questions uploaded successfully!'); }
    catch (err) { alert(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDownloadTemplate = async () => {
    const { data } = await adminAPI.downloadTemplate();
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a'); a.href = url; a.download = 'questions_template.xlsx'; a.click();
  };

  return (
    <AdminLayout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <Link to="/admin/quizzes" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-1"><ArrowLeft size={14} />Back to Quizzes</Link>
          <h1 className="page-title">{quiz?.title || 'Questions'}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{questions.length} questions</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleDownloadTemplate} className="btn-secondary"><Download size={15} />Template</button>
          <label className={`btn-secondary cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Bulk Upload
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleUpload} />
          </label>
          <button onClick={openCreate} className="btn-primary"><Plus size={15} />Add Question</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={q.id} className="card p-4 animate-fade-in">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs flex items-center justify-center font-bold flex-shrink-0">{idx + 1}</span>
                    <span className="badge-info">{q.marks} mark{q.marks > 1 ? 's' : ''}</span>
                  </div>
                  <p className="font-medium text-slate-900 dark:text-white mb-3">{q.questionText}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {q.options.map((o, i) => (
                      <div key={o.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${o.isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400'}`}>
                        <span className="font-bold text-xs">{String.fromCharCode(65 + i)}.</span>
                        {o.optionText}
                        {o.isCorrect && <span className="ml-auto text-emerald-500 text-xs">✓ Correct</span>}
                      </div>
                    ))}
                  </div>
                  {q.explanation && <p className="text-xs text-slate-400 mt-2 italic">💡 {q.explanation}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(q)} className="btn-ghost btn-sm"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(q.id)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
          {!questions.length && (
            <div className="card p-16 text-center text-slate-400">
              <p className="text-lg mb-2">No questions added yet</p>
              <p className="text-sm">Add questions individually or bulk upload an Excel file</p>
            </div>
          )}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal p-6 max-w-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{editItem ? 'Edit Question' : 'Add Question'}</h2>
              <button onClick={() => setModal(false)} className="btn-ghost p-1"><X size={18} /></button>
            </div>
            {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="label">Question *</label>
                <textarea className="input" rows={3} value={form.questionText} onChange={e => setForm(f => ({ ...f, questionText: e.target.value }))} required placeholder="Enter the question text..." />
              </div>
              <div>
                <label className="label">Marks</label>
                <input className="input" type="number" min="1" value={form.marks} onChange={e => setForm(f => ({ ...f, marks: parseInt(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Options * (click a radio to mark correct)</label>
                <div className="space-y-2">
                  {form.options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="radio" name="correct" checked={o.isCorrect} onChange={() => setCorrect(i)} className="text-primary-600 flex-shrink-0" />
                      <span className="text-sm font-bold text-slate-500 w-5">{String.fromCharCode(65 + i)}.</span>
                      <input className="input" value={o.optionText} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} required />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Explanation (optional)</label>
                <textarea className="input" rows={2} value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} placeholder="Add explanation shown after submission..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving && <Loader2 size={15} className="animate-spin" />}{editItem ? 'Save Changes' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
