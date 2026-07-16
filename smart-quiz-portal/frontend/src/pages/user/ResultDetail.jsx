import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { UserLayout } from '../../components/Layout';
import { userAPI } from '../../services/api';
import { 
  Award, Clock, CheckCircle, XCircle, FileText, ArrowLeft, Loader2,
  AlertTriangle, HelpCircle
} from 'lucide-react';

export default function ResultDetail() {
  const { attemptId } = useParams();
  const [searchParams] = useSearchParams();
  const autoSubmitted = searchParams.get('autosubmitted') === 'true';

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!attemptId) return;
    userAPI.getAttemptResult(attemptId).then(res => {
      setAttempt(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [attemptId]);

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { data } = await userAPI.exportResultPdf(attemptId);
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `Result_Attempt_${attemptId}.pdf`;
      link.click();
    } catch (err) {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      </UserLayout>
    );
  }

  if (!attempt) {
    return (
      <UserLayout>
        <div className="card p-10 text-center text-slate-400">
          <AlertTriangle className="mx-auto mb-2 opacity-50" size={40} />
          <p className="text-lg font-medium">Result not found</p>
          <p className="text-sm mb-4">We could not retrieve this quiz result.</p>
          <Link to="/dashboard" className="btn-primary inline-flex">Go Dashboard</Link>
        </div>
      </UserLayout>
    );
  }

  const durationSec = attempt.startTime && attempt.endTime
    ? Math.max(0, Math.floor((new Date(attempt.endTime) - new Date(attempt.startTime)) / 1000))
    : 0;
  const durationMin = Math.floor(durationSec / 60);

  const correctAnswers = attempt.correctAnswers || 0;
  const wrongAnswers = attempt.wrongAnswers || 0;
  const totalQuestions = attempt.totalQuestions || 0;
  const skippedQuestions = totalQuestions - (correctAnswers + wrongAnswers);

  return (
    <UserLayout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <Link to="/my-attempts" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-1">
            <ArrowLeft size={14} /> My Attempts
          </Link>
          <h1 className="page-title">Exam Performance Report</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{attempt.quizTitle}</p>
        </div>
        <button 
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="btn-primary"
        >
          {downloading ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
          Download PDF
        </button>
      </div>

      {autoSubmitted && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-700 dark:text-amber-400 text-sm flex items-start gap-2">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Auto-Submitted Session</p>
            <p className="text-xs mt-0.5">This session was automatically closed because the timer expired or security limits were exceeded.</p>
          </div>
        </div>
      )}

      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-icon bg-primary-500"><Award size={20} /></div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {attempt.marksObtained?.toFixed(1)} / {attempt.totalMarks}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Score Obtained</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${attempt.status === 'PASSED' ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {attempt.status === 'PASSED' ? <CheckCircle size={20} /> : <XCircle size={20} />}
          </div>
          <div>
            <p className={`text-xl font-bold ${attempt.status === 'PASSED' ? 'text-emerald-600' : 'text-red-500'}`}>
              {attempt.status}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Status (Pass/Fail)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-500"><Clock size={20} /></div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{durationMin} min</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Duration Taken</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-amber-500"><HelpCircle size={20} /></div>
          <div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{attempt.percentage?.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Percentage Score</p>
          </div>
        </div>
      </div>

      {/* Answer stats distribution banner */}
      <div className="card p-6 mb-8 bg-slate-50/50 dark:bg-slate-800/50">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Response Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-500">{correctAnswers}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-500">{wrongAnswers}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Incorrect</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-slate-400">{skippedQuestions}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Skipped / Blank</p>
          </div>
        </div>
      </div>

      {/* Question Details Review */}
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Detailed Question Review</h2>
      <div className="space-y-4">
        {(attempt.answers || []).map((ans, idx) => {
          const isSkipped = ans.selectedOptionId === null;
          const isCorrect = ans.isCorrect;
          
          return (
            <div key={idx} className="card p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className={isSkipped ? 'badge-gray' : isCorrect ? 'badge-success' : 'badge-danger'}>
                    {isSkipped ? 'Skipped' : isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
              </div>

              <p className="font-semibold text-slate-900 dark:text-white mb-4">{ans.questionText}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                {ans.options?.map((opt, i) => {
                  const wasSelected = ans.selectedOptionId === opt.id;
                  const isOptCorrect = ans.correctOptionId === opt.id;
                  
                  let styleClass = 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30';
                  let icon = null;

                  if (isOptCorrect) {
                    styleClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold';
                    icon = <span className="text-emerald-500 text-xs ml-auto">✓ Correct Option</span>;
                  } else if (wasSelected && !isCorrect) {
                    styleClass = 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-semibold';
                    icon = <span className="text-red-500 text-xs ml-auto">✗ Your Choice</span>;
                  } else if (wasSelected) {
                    // Correct selected choice: we already handle it with isOptCorrect since it is correct
                    icon = <span className="text-emerald-500 text-xs ml-auto">✓ Your Correct Choice</span>;
                  }

                  return (
                    <div 
                      key={opt.id}
                      className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm ${styleClass}`}
                    >
                      <span className="font-bold text-xs text-slate-400 dark:text-slate-500">{String.fromCharCode(65 + i)}.</span>
                      <span>{opt.optionText}</span>
                      {icon}
                    </div>
                  );
                })}
              </div>

              {ans.explanation && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">💡 Explanation:</span>
                  {ans.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </UserLayout>
  );
}
