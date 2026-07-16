import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '../../components/Layout';
import { userAPI } from '../../services/api';
import { BookOpen, Search, Clock, Award, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export default function QuizzesList() {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  // Start attempt flow
  const [confirmQuiz, setConfirmQuiz] = useState(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      userAPI.getPublishedQuizzes(),
      userAPI.getCategories(),
      userAPI.getSubjects()
    ]).then(([q, c, s]) => {
      setQuizzes(q.data);
      setCategories(c.data);
      setSubjects(s.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleStartAttemptCheck = async (quiz) => {
    setChecking(true);
    setCheckError('');
    try {
      const res = await userAPI.canAttempt(quiz.id);
      if (res.data.status === 'ALLOWED') {
        setConfirmQuiz(quiz);
      } else {
        setCheckError(res.data.reason || 'You have reached the maximum attempt limit for this quiz.');
      }
    } catch (err) {
      setCheckError(err.response?.data?.message || 'Failed to check eligibility.');
    } finally {
      setChecking(false);
    }
  };

  const handleConfirmStart = async () => {
    if (!confirmQuiz) return;
    try {
      const res = await userAPI.startAttempt(confirmQuiz.id);
      navigate(`/quiz/${confirmQuiz.id}?attempt=${res.data.id}`);
    } catch (err) {
      setCheckError(err.response?.data?.message || 'Failed to start quiz attempt.');
    }
  };

  // Filter logic
  const filteredQuizzes = quizzes.filter(q => {
    const matchSearch = q.title.toLowerCase().includes(search.toLowerCase()) || 
                        q.subjectName?.toLowerCase().includes(search.toLowerCase());
    
    // Subject belongs to a category. We filter accordingly.
    const matchCategory = !selectedCategory || q.categoryName === categories.find(c => String(c.id) === selectedCategory)?.name;
    const matchSubject = !selectedSubject || String(q.subjectId) === selectedSubject;
    return matchSearch && matchCategory && matchSubject;
  });

  const subjectsOfCategory = selectedCategory 
    ? subjects.filter(s => String(s.categoryId) === selectedCategory)
    : subjects;

  return (
    <UserLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Available Quizzes</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Select a quiz to test your capability</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            className="input pl-9" 
            placeholder="Search quizzes..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <select 
          className="input" 
          value={selectedCategory} 
          onChange={e => { setSelectedCategory(e.target.value); setSelectedSubject(''); }}
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select 
          className="input" 
          value={selectedSubject} 
          onChange={e => setSelectedSubject(e.target.value)}
        >
          <option value="">All Subjects</option>
          {subjectsOfCategory.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {checkError && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 flex items-center gap-2 text-sm">
          <AlertTriangle size={16} />
          {checkError}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary-600" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map(q => (
            <div key={q.id} className="card-hover p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                    <BookOpen size={18} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="badge-info text-xs">{q.categoryName}</span>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-1">{q.title}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">{q.subjectName}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 line-clamp-2 h-10">{q.description || 'No description provided.'}</p>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 text-center mb-4">
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex justify-center gap-1 items-center"><Clock size={12} /> Time</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{q.duration}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex justify-center gap-1 items-center"><Award size={12} /> Qs</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{q.questionCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 flex justify-center gap-1 items-center"><CheckCircle2 size={12} /> Marks</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{q.totalMarks}</p>
                  </div>
                </div>

                <button 
                  onClick={() => handleStartAttemptCheck(q)} 
                  disabled={checking}
                  className="btn-primary w-full justify-center"
                >
                  {checking ? <Loader2 size={15} className="animate-spin" /> : 'Start Quiz'}
                </button>
              </div>
            </div>
          ))}

          {!filteredQuizzes.length && (
            <div className="col-span-full card p-16 text-center text-slate-400">
              <BookOpen size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-lg font-medium">No quizzes found</p>
              <p className="text-sm">Try relaxing your search or filters.</p>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmQuiz && (
        <div className="modal-overlay" onClick={() => setConfirmQuiz(null)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
              <ShieldAlert size={24} />
              <h2 className="text-lg font-bold">Important Instructions</h2>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              You are about to start the quiz: <strong className="text-slate-950 dark:text-white">{confirmQuiz.title}</strong>
            </p>

            <div className="space-y-2.5 mb-6 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>The quiz duration is <strong>{confirmQuiz.duration} minutes</strong>. Once started, the timer cannot be paused.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary-600 mt-0.5">•</span>
                <span>Do not refresh the page or navigate away. Your answers will save, but the timer will keep running.</span>
              </div>
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 font-medium">
                <span className="mt-0.5">•</span>
                <span><strong>Anti-Cheat Enabled:</strong> Leaving fullscreen or switching tabs will be tracked. Exceeding tab switches will auto-submit the exam.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setConfirmQuiz(null)} 
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleConfirmStart} 
                className="btn-primary flex-1 justify-center bg-emerald-600 hover:bg-emerald-700"
              >
                Accept & Start
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
