import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../../components/Layout';
import { adminAPI } from '../../services/api';
import { Users, BookOpen, HelpCircle, BarChart3, TrendingUp, Award, Activity, CheckCircle, XCircle } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

const StatCard = ({ icon: Icon, label, value, color, subLabel }) => (
  <div className="stat-card animate-fade-in">
    <div className={`stat-icon ${color}`}><Icon size={22} /></div>
    <div>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</p>
      {subLabel && <p className="text-xs text-slate-400 dark:text-slate-500">{subLabel}</p>}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getAnalytics().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  const barData = {
    labels: data?.attemptsPerQuiz?.map(d => d.name.length > 20 ? d.name.substring(0, 20) + '...' : d.name) || [],
    datasets: [{ label: 'Attempts', data: data?.attemptsPerQuiz?.map(d => d.value) || [], backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 6 }],
  };

  const doughnutData = {
    labels: ['Passed', 'Failed'],
    datasets: [{
      data: data?.passFailStats?.map(d => d.value) || [0, 0],
      backgroundColor: ['rgba(34,197,94,0.8)', 'rgba(239,68,68,0.8)'],
      borderWidth: 0,
    }],
  };

  return (
    <AdminLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Overview of your quiz management platform</p>
        </div>
        <Link to="/admin/quizzes" className="btn-primary">Create Quiz</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total Users" value={data?.totalUsers || 0} color="bg-blue-500" subLabel={`${data?.activeUsers || 0} active`} />
        <StatCard icon={BookOpen} label="Total Quizzes" value={data?.totalQuizzes || 0} color="bg-purple-500" />
        <StatCard icon={HelpCircle} label="Total Questions" value={data?.totalQuestions || 0} color="bg-amber-500" />
        <StatCard icon={Activity} label="Quiz Attempts" value={data?.totalAttempts || 0} color="bg-emerald-500" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <StatCard icon={BarChart3} label="Avg Score" value={`${data?.averageScore || 0}%`} color="bg-cyan-500" />
        <StatCard icon={TrendingUp} label="Pass Rate" value={`${data?.passPercentage || 0}%`} color="bg-teal-500" />
        <StatCard icon={Award} label="Top Performers" value={data?.topPerformers?.length || 0} color="bg-rose-500" subLabel="in leaderboard" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Quiz Attempts (Top 10)</h2>
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } } } }} />
        </div>
        <div className="card p-6">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Pass / Fail Rate</h2>
          <Doughnut data={doughnutData} options={{ responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom' } } }} />
        </div>
      </div>

      {/* Leaderboard preview */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Top Performers</h2>
          <Link to="/admin/leaderboard" className="text-primary-600 text-sm hover:underline">View all</Link>
        </div>
        <div className="table-wrapper rounded-none border-0">
          <table className="table">
            <thead>
              <tr><th>#</th><th>Name</th><th>Score</th><th>Attempts</th></tr>
            </thead>
            <tbody>
              {(data?.topPerformers || []).slice(0, 5).map((p) => (
                <tr key={p.userId}>
                  <td><span className={`badge ${p.rank === 1 ? 'badge-warning' : p.rank === 2 ? 'badge-info' : 'badge-gray'}`}>#{p.rank}</span></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 text-xs font-bold">{p.userFullName?.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{p.userFullName}</p>
                        <p className="text-xs text-slate-400">@{p.username}</p>
                      </div>
                    </div>
                  </td>
                  <td><span className="font-semibold text-primary-600">{p.totalScore}</span></td>
                  <td>{p.quizzesAttempted}</td>
                </tr>
              ))}
              {(!data?.topPerformers?.length) && (
                <tr><td colSpan={4} className="text-center text-slate-400 py-8">No attempts recorded yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
