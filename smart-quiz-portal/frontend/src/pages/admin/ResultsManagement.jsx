import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { Download, FileDown, Loader2 } from 'lucide-react';

export default function ResultsManagement() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    adminAPI.getAllResults().then(r => { setResults(r.data); setLoading(false); });
  }, []);

  const handleExcelExport = async () => {
    setExporting(true);
    const { data } = await adminAPI.exportResultsExcel();
    const url = window.URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a'); a.href = url; a.download = 'results.xlsx'; a.click();
    setExporting(false);
  };

  const handlePdfExport = async (attemptId) => {
    const { data } = await adminAPI.exportResultPdf(attemptId);
    const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    window.open(url, '_blank');
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Results Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{results.length} results</p>
        </div>
        <button onClick={handleExcelExport} disabled={exporting} className="btn-success">
          {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}Export Excel
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <div className="card">
          <div className="table-wrapper rounded-none border-0">
            <table className="table">
              <thead><tr><th>Student</th><th>Quiz</th><th>Score</th><th>%</th><th>Status</th><th>Date</th><th className="text-right">PDF</th></tr></thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id}>
                    <td>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{r.user?.fullName}</p>
                      <p className="text-xs text-slate-400">@{r.user?.username}</p>
                    </td>
                    <td>
                      <p className="text-sm">{r.quiz?.title}</p>
                      <p className="text-xs text-slate-400">{r.quiz?.subject?.name}</p>
                    </td>
                    <td className="font-semibold text-primary-600">{r.score} / {r.quiz?.totalMarks}</td>
                    <td>{r.percentage?.toFixed(1)}%</td>
                    <td><span className={r.status === 'PASSED' ? 'badge-success' : 'badge-danger'}>{r.status}</span></td>
                    <td className="text-xs text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="flex justify-end">
                        <button onClick={() => handlePdfExport(r.quizAttempt?.id || r.id)} className="btn-ghost btn-sm text-blue-500" title="Download PDF">
                          <FileDown size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!results.length && <tr><td colSpan={7} className="text-center py-10 text-slate-400">No results yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
