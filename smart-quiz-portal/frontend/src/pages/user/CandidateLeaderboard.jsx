import { useEffect, useState } from 'react';
import { UserLayout } from '../../components/Layout';
import { userAPI } from '../../services/api';
import { Trophy, Medal, Loader2 } from 'lucide-react';

export default function CandidateLeaderboard() {
  const [global, setGlobal] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjectBoard, setSubjectBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      userAPI.getGlobalLeaderboard(), 
      userAPI.getSubjects()
    ]).then(([g, s]) => {
      setGlobal(g.data); 
      setSubjects(s.data); 
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const loadSubjectBoard = async (id) => {
    if (!id) {
      setSubjectBoard([]);
      setSelectedSubject('');
      return;
    }
    setSelectedSubject(id);
    try {
      const { data } = await userAPI.getSubjectLeaderboard(id);
      setSubjectBoard(data);
    } catch (err) {
      alert('Failed to load subject leaderboard.');
    }
  };

  const rankIcon = (r) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`;

  const Board = ({ data }) => (
    <div className="table-wrapper rounded-xl">
      <table className="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Participant</th>
            <th>Score</th>
            <th>Attempts</th>
          </tr>
        </thead>
        <tbody>
          {data.map(p => (
            <tr key={p.userId} className={p.rank <= 3 ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}>
              <td>
                <span className="text-lg font-bold">{rankIcon(p.rank)}</span>
              </td>
              <td>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 text-xs font-bold">
                    {p.userFullName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{p.userFullName}</p>
                    <p className="text-xs text-slate-400">@{p.username}</p>
                  </div>
                </div>
              </td>
              <td>
                <span className="font-bold text-primary-600 dark:text-primary-400">{p.totalScore}</span>
              </td>
              <td className="text-sm">{p.quizzesAttempted}</td>
            </tr>
          ))}
          {!data.length && (
            <tr>
              <td colSpan={4} className="text-center py-10 text-slate-400">
                No entries yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <UserLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Check how you rank against peers</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card">
            <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <Trophy size={18} className="text-amber-500" />
              <h2 className="font-bold text-slate-900 dark:text-white">Global Standings</h2>
            </div>
            <div className="p-6">
              <Board data={global} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-2 px-6 py-5 border-b border-slate-200 dark:border-slate-700">
              <Medal size={18} className="text-blue-500" />
              <h2 className="font-bold text-slate-900 dark:text-white">Subject-wise Standings</h2>
            </div>
            <div className="p-6">
              <select 
                className="input mb-4" 
                onChange={e => loadSubjectBoard(e.target.value)} 
                value={selectedSubject}
              >
                <option value="">Select a subject...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              {selectedSubject ? (
                <Board data={subjectBoard} />
              ) : (
                <p className="text-center text-slate-400 py-12 text-sm">
                  Select a subject from the list to view its leaderboard.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
