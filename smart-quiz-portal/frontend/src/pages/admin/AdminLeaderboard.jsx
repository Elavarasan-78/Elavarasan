import { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { Trophy, Medal } from 'lucide-react';

export default function AdminLeaderboard() {
  const [global, setGlobal] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectBoard, setSubjectBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminAPI.getGlobalLeaderboard(), adminAPI.getSubjects()]).then(([g, s]) => {
      setGlobal(g.data); setSubjects(s.data); setLoading(false);
    });
  }, []);

  const loadSubjectBoard = async (id) => {
    setSelectedSubject(id);
    const { data } = await adminAPI.getSubjectLeaderboard(id);
    setSubjectBoard(data);
  };

  const rankIcon = (r) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;

  const Board = ({ data }) => (
    <div className="table-wrapper rounded-xl">
      <table className="table">
        <thead><tr><th>Rank</th><th>Participant</th><th>Score</th><th>Attempts</th></tr></thead>
        <tbody>
          {data.map(p => (
            <tr key={p.userId} className={p.rank <= 3 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
              <td><span className="text-lg">{rankIcon(p.rank)}</span></td>
              <td>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 text-xs font-bold">{p.userFullName?.charAt(0)}</div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{p.userFullName}</p>
                    <p className="text-xs text-slate-400">@{p.username}</p>
                  </div>
                </div>
              </td>
              <td><span className="font-bold text-primary-600 dark:text-primary-400">{p.totalScore}</span></td>
              <td>{p.quizzesAttempted}</td>
            </tr>
          ))}
          {!data.length && <tr><td colSpan={4} className="text-center py-8 text-slate-400">No entries yet</td></tr>}
        </tbody>
      </table>
    </div>
  );

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Global and subject-wise rankings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <Trophy size={18} className="text-amber-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Global Leaderboard</h2>
          </div>
          <div className="p-4"><Board data={global} /></div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <Medal size={18} className="text-blue-500" />
            <h2 className="font-semibold text-slate-900 dark:text-white">Subject Leaderboard</h2>
          </div>
          <div className="px-4 pt-4">
            <select className="input mb-4" onChange={e => loadSubjectBoard(e.target.value)} defaultValue="">
              <option value="" disabled>Select a subject...</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="px-4 pb-4">{selectedSubject ? <Board data={subjectBoard} /> : <p className="text-center text-slate-400 py-8">Select a subject to view rankings</p>}</div>
        </div>
      </div>
    </AdminLayout>
  );
}
