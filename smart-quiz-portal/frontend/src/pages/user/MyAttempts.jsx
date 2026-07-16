import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserLayout } from '../../components/Layout';
import { userAPI } from '../../services/api';
import { HelpCircle, FileText, ArrowRight, Loader2, Award } from 'lucide-react';

export default function MyAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    userAPI.getMyAttempts().then(res => {
      setAttempts(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDownloadPdf = async (e, id) => {
    e.preventDefault();
    setDownloadingId(id);
    try {
      const { data } = await userAPI.exportResultPdf(id);
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Result_Attempt_${id}.pdf`;
      link.click();
    } catch (err) {
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <UserLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Attempts</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review your past performance history</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <div className="card">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(a => (
                  <tr key={a.id}>
                    <td>
                      <p className="font-semibold text-sm text-slate-900 dark:text-white">{a.quizTitle}</p>
                      <p className="text-xs text-slate-400">{a.subjectName}</p>
                    </td>
                    <td className="font-semibold text-primary-600">
                      {a.marksObtained?.toFixed(1)} / {a.totalMarks}
                    </td>
                    <td>{a.percentage?.toFixed(1)}%</td>
                    <td>
                      <span className={a.status === 'PASSED' ? 'badge-success' : 'badge-danger'}>
                        {a.status}
                      </span>
                    </td>
                    <td className="text-xs text-slate-400">
                      {a.startTime ? new Date(a.startTime).toLocaleString() : '—'}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => handleDownloadPdf(e, a.id)}
                          disabled={downloadingId === a.id}
                          className="btn-ghost btn-sm text-slate-500 hover:text-slate-700"
                          title="Download PDF"
                        >
                          {downloadingId === a.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <FileText size={14} />
                          )}
                        </button>
                        <Link 
                          to={`/result/${a.id}`} 
                          className="btn-primary btn-sm inline-flex items-center gap-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50"
                        >
                          Review <ArrowRight size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {!attempts.length && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      <HelpCircle size={40} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-medium">You have not attempted any quizzes yet.</p>
                      <Link to="/quizzes" className="btn-primary btn-sm mt-3 inline-flex">Browse Quizzes</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
