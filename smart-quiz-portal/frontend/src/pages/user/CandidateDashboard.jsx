import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserLayout } from '../../components/Layout';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, CheckCircle, Clock, Activity, ArrowRight, Loader2, Trophy } from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([userAPI.getPublishedQuizzes(), userAPI.getMyAttempts()]).then(([q, a]) => {
      setQuizzes(q.data); setAttempts(a.data); setLoading(false);
    });
  }, []);

  const completedAttempts = attempts.filter(a => a.isCompleted);
  const passedCount = completedAttempts.filter(a => a.status === 'PASSED').length;
  const avgScore = completedAttempts.length
    ? (completedAttempts.reduce((s, a) => s + a.percentage, 0) / completedAttempts.length).toFixed(1)
    : 0;

  const attemptedQuizIds = new Set(completedAttempts.map(a => a.quizId));

  if (loading) return (
    <UserLayout>
      <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
    </UserLayout>
  );

  return (
    <UserLayout>
      {/* Welcome */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-6 text-white mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {user?.fullName?.split(' ')[0]}! 👋</h1>
        <p className="text-primary-200 mt-1">Ready to test your knowledge? Let&apos;s go!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { icon: BookOpen, label: 'Available', value: quizzes.length, color: 'bg-blue-500' },
          { icon: Activity, label: 'Attempted', value: completedAttempts.length, color: 'bg-purple-500' },
          { icon: CheckCircle, label: 'Passed', value: passedCount, color: 'bg-emerald-500' },
          { icon: Trophy, label: 'Avg Score', value: `${avgScore}%`, color: 'bg-amber-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <div className={`stat-icon ${color}`}><Icon size={20} /></div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Available Quizzes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Available Quizzes</h2>
          <Link to="/quizzes" className="text-primary-600 text-sm hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.slice(0, 6).map(q => {
            const attempted = attemptedQuizIds.has(q.id);
            return (
              <div key={q.id} className="card-hover p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center"><BookOpen size={18} className="text-primary-600 dark:text-primary-400" /></div>
                  <span className={attempted ? 'badge-gray' : 'badge-info'}>{attempted ? 'Attempted' : 'New'}</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{q.title}</h3>
                <p className="text-xs text-slate-400 mb-3">{q.subjectName} · {q.duration} min · {q.questionCount} Qs</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{q.totalMarks} marks · Pass: {q.passMarks}</span>
                  <Link to={`/quiz/${q.id}`} className="btn-primary btn-sm">
                    {attempted ? 'Re-attempt' : 'Start'} <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
          {!quizzes.length && (
            <div className="col-span-full card p-10 text-center text-slate-400">
              <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
              <p>No quizzes available yet. Check back later!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Attempts */}
      {completedAttempts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Attempts</h2>
            <Link to="/my-attempts" className="text-primary-600 text-sm hover:underline flex items-center gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="card">
            <div className="table-wrapper rounded-none border-0">
              <table className="table">
                <thead><tr><th>Quiz</th><th>Score</th><th>%</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {completedAttempts.slice(0, 5).map(a => (
                    <tr key={a.id}>
                      <td className="font-medium text-slate-900 dark:text-white text-sm">{a.quizTitle}</td>
                      <td>{a.marksObtained?.toFixed(1)} / {a.totalMarks}</td>
                      <td>{a.percentage?.toFixed(1)}%</td>
                      <td><span className={a.status === 'PASSED' ? 'badge-success' : 'badge-danger'}>{a.status}</span></td>
                      <td><Link to={`/result/${a.id}`} className="btn-ghost btn-sm text-primary-600">Review</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
