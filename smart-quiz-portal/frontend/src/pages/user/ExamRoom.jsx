import { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { userAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  AlertTriangle, Shield, CheckCircle, Clock, ChevronLeft, ChevronRight, 
  Flag, RotateCcw, Loader2, Maximize2
} from 'lucide-react';

export default function ExamRoom() {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Quiz & Questions state
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  // User responses
  // Format: { [questionId]: selectedOptionId }
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [visited, setVisited] = useState(new Set([0]));
  const [markedForReview, setMarkedForReview] = useState(new Set());

  // Fullscreen & Anti-Cheat State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningCount, setWarningCount] = useState(0);
  const MAX_WARNINGS = 3;

  // Timer State
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const timerRef = useRef(null);

  // Submit Modal
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Element reference for fullscreen
  const containerRef = useRef(null);

  // Load Quiz Metadata & Questions
  useEffect(() => {
    if (!quizId || !attemptId) {
      navigate('/dashboard');
      return;
    }
    
    Promise.all([
      userAPI.getQuiz(quizId),
      userAPI.getQuizQuestions(quizId)
    ]).then(([qRes, qListRes]) => {
      setQuiz(qRes.data);
      setQuestions(qListRes.data);
      setTimeLeft(qRes.data.duration * 60);
      setLoading(false);
    }).catch(() => {
      alert('Failed to load exam data.');
      navigate('/dashboard');
    });
  }, [quizId, attemptId]);

  // Timer Countdown logic
  useEffect(() => {
    if (loading || showFullscreenPrompt) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit('Time Expired!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, showFullscreenPrompt]);

  // Anti-cheat handlers: visibilitychange & window blur
  useEffect(() => {
    if (loading || showFullscreenPrompt || submitting) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerCheatWarning('Tab switched / backgrounded');
      }
    };

    const handleWindowBlur = () => {
      triggerCheatWarning('Left exam window');
    };

    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isFull);
      if (!isFull && !submitting) {
        triggerCheatWarning('Exited fullscreen mode');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [loading, showFullscreenPrompt, warningCount, submitting]);

  const triggerCheatWarning = (reason) => {
    setWarningCount(prev => {
      const nextCount = prev + 1;
      if (nextCount >= MAX_WARNINGS) {
        // Auto submit immediately on exceeding limits
        handleAutoSubmit(`Exceeded anti-cheat limits (${reason})`);
        return nextCount;
      }
      setWarningMessage(`Warning ${nextCount}/${MAX_WARNINGS - 1}: ${reason} detected! Please stay on the page in fullscreen mode. Further violations will cause automatic submission.`);
      return nextCount;
    });
  };

  // Fullscreen helper
  const enterFullscreen = () => {
    const el = containerRef.current;
    if (el) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      else if (el.msRequestFullscreen) el.msRequestFullscreen();
      setIsFullscreen(true);
      setShowFullscreenPrompt(false);
    }
  };

  const handleAutoSubmit = async (reason) => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    alert(`Auto-submitting: ${reason}`);
    
    const submissionBody = questions.map(q => ({
      questionId: q.id,
      selectedOptionId: selectedAnswers[q.id] || null
    }));

    try {
      await userAPI.submitAttempt(attemptId, submissionBody);
      // Clean exit of fullscreen before navigating
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      navigate(`/result/${attemptId}?autosubmitted=true`);
    } catch (err) {
      alert('Error submitting exam: ' + (err.response?.data?.message || 'Server error'));
      navigate('/dashboard');
    }
  };

  const handleManualSubmit = async () => {
    setSubmitting(true);
    const submissionBody = questions.map(q => ({
      questionId: q.id,
      selectedOptionId: selectedAnswers[q.id] || null
    }));

    try {
      await userAPI.submitAttempt(attemptId, submissionBody);
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      navigate(`/result/${attemptId}`);
    } catch (err) {
      alert('Error submitting exam: ' + (err.response?.data?.message || 'Server error'));
      setSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  // Question navigation helper
  const jumpToQuestion = (idx) => {
    setCurrentIdx(idx);
    setVisited(prev => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      jumpToQuestion(currentIdx + 1);
    }
  };

  const prevQuestion = () => {
    if (currentIdx > 0) {
      jumpToQuestion(currentIdx - 1);
    }
  };

  const selectOption = (optId) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optId
    }));
  };

  const clearResponse = () => {
    setSelectedAnswers(prev => {
      const next = { ...prev };
      delete next[currentQuestion.id];
      return next;
    });
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => {
      const next = new Set(prev);
      if (next.has(currentIdx)) {
        next.delete(currentIdx);
      } else {
        next.add(currentIdx);
      }
      return next;
    });
  };

  // Formatting helpers
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <Loader2 className="animate-spin text-primary-600 mx-auto mb-4" size={40} />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Preparing secure exam session...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(selectedAnswers).length;
  const reviewCount = markedForReview.size;

  // Colors based on state
  const getPaletteBtnClass = (idx) => {
    const questionId = questions[idx]?.id;
    const isAnswered = selectedAnswers[questionId] !== undefined;
    const isMarked = markedForReview.has(idx);
    const isVisited = visited.has(idx);

    if (currentIdx === idx) {
      return 'ring-2 ring-primary-600 ring-offset-2 scale-105 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold';
    }
    if (isMarked) {
      return 'bg-purple-500 hover:bg-purple-600 text-white font-semibold';
    }
    if (isAnswered) {
      return 'bg-emerald-500 hover:bg-emerald-600 text-white font-semibold';
    }
    if (isVisited) {
      return 'bg-red-500 hover:bg-red-600 text-white font-semibold';
    }
    return 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400';
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col select-none">
      {/* Fullscreen Start Modal Overlay */}
      {showFullscreenPrompt && (
        <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 text-center animate-slide-up">
            <Shield className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{quiz?.title}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              This exam is conducted in a secure browser environment. You must enter fullscreen mode to begin.
            </p>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 text-left text-xs text-amber-700 dark:text-amber-400 mb-6 space-y-2">
              <p className="font-bold flex items-center gap-1.5"><AlertTriangle size={14} /> SECURITY PROTOCOLS:</p>
              <p>• Do NOT press Escape key or exit fullscreen.</p>
              <p>• Do NOT switch windows or open new tabs.</p>
              <p>• The system automatically submits your paper if warnings exceed limit.</p>
            </div>

            <button 
              onClick={enterFullscreen}
              className="btn-primary w-full justify-center text-base py-3"
            >
              <Maximize2 size={18} /> Enter Fullscreen & Start
            </button>
          </div>
        </div>
      )}

      {/* Main Header */}
      <header className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 z-30 px-4 md:px-8 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">{quiz?.title}</h2>
          <span className="text-xs text-slate-400 dark:text-slate-500">{quiz?.subjectName}</span>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400">
            <Clock size={16} className="animate-pulse" />
            <span className="font-mono font-bold text-sm md:text-base">{formatTime(timeLeft)}</span>
          </div>

          <button 
            onClick={() => setShowSubmitConfirm(true)}
            className="btn-success btn-sm md:btn-md"
          >
            <CheckCircle size={15} /> Submit Quiz
          </button>
        </div>
      </header>

      {/* Warning Toast Banner */}
      {warningMessage && (
        <div className="bg-red-500 text-white text-xs md:text-sm px-6 py-2 flex items-center justify-between font-medium shadow-inner animate-pulse">
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} />
            {warningMessage}
          </span>
          <button 
            onClick={() => setWarningMessage('')} 
            className="hover:opacity-80 px-2 py-0.5 bg-black/20 rounded text-xs"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Primary Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Question Pane */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col justify-between">
          <div className="card p-6 md:p-8 mb-6">
            {/* Question Info Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4 mb-6">
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Question {currentIdx + 1} of {questions.length}</span>
              <span className="badge-info text-xs">{currentQuestion?.marks} Mark(s)</span>
            </div>

            {/* Question Text */}
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              {currentQuestion?.questionText}
            </h3>

            {/* Options List */}
            <div className="space-y-3">
              {currentQuestion?.options.map((opt, i) => {
                const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
                return (
                  <div 
                    key={opt.id}
                    onClick={() => selectOption(opt.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' 
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-600 text-white' 
                        : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{String.fromCharCode(65 + i)}.</span>
                    <span className="text-sm text-slate-800 dark:text-slate-200">{opt.optionText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3 mt-auto">
            <div className="flex items-center gap-2">
              <button 
                onClick={clearResponse}
                disabled={selectedAnswers[currentQuestion?.id] === undefined}
                className="btn-secondary btn-sm md:btn-md"
                title="Clear selected answer"
              >
                <RotateCcw size={15} /> Clear
              </button>
              <button 
                onClick={toggleMarkForReview}
                className={`btn-secondary btn-sm md:btn-md ${
                  markedForReview.has(currentIdx) 
                    ? 'text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10' 
                    : ''
                }`}
              >
                <Flag size={15} /> {markedForReview.has(currentIdx) ? 'Unmark Review' : 'Mark Review'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={prevQuestion}
                disabled={currentIdx === 0}
                className="btn-secondary btn-sm md:btn-md"
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button 
                onClick={nextQuestion}
                disabled={currentIdx === questions.length - 1}
                className="btn-primary btn-sm md:btn-md"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </main>

        {/* Right Side: Information / Palette Pane */}
        <aside className="w-full lg:w-80 bg-white dark:bg-slate-800 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* Candidate Identity */}
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold text-sm">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-slate-400 truncate">Candidate Account</p>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { label: 'Answered', val: answeredCount, dot: 'bg-emerald-500' },
                { label: 'Marked', val: reviewCount, dot: 'bg-purple-500' },
                { label: 'Visited', val: visited.size, dot: 'bg-red-500' },
                { label: 'Total', val: questions.length, dot: 'bg-slate-400' }
              ].map(stat => (
                <div key={stat.label} className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
                    <span className="text-[10px] uppercase font-bold text-slate-400">{stat.label}</span>
                  </div>
                  <p className="text-base font-black text-slate-800 dark:text-white mt-0.5">{stat.val}</p>
                </div>
              ))}
            </div>

            {/* Question Palette Grid */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Question Palette</h4>
            <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
              {questions.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => jumpToQuestion(idx)}
                  className={`h-9 w-full rounded-lg text-xs font-medium transition-all duration-150 flex items-center justify-center ${getPaletteBtnClass(idx)}`}
                >
                  {(idx + 1).toString().padStart(2, '0')}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700 mt-6 lg:mt-0 text-center">
            <button 
              onClick={() => setShowSubmitConfirm(true)}
              className="btn-primary w-full justify-center"
            >
              Finish Exam
            </button>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 flex items-center justify-center gap-1">
              <Shield size={10} /> Double end-to-end encryption active
            </p>
          </div>
        </aside>
      </div>

      {/* Manual Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="modal-overlay" onClick={() => !submitting && setShowSubmitConfirm(false)}>
          <div className="modal p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Submit Exam Paper?</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Are you sure you want to finish and submit your exam? You cannot modify your answers after submitting.
            </p>

            <div className="grid grid-cols-2 gap-4 py-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 text-center mb-6">
              <div>
                <p className="text-xs text-slate-400">Total Questions</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">{questions.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Answered Questions</p>
                <p className="text-lg font-bold text-emerald-600 mt-0.5">{answeredCount}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button" 
                disabled={submitting}
                onClick={() => setShowSubmitConfirm(false)} 
                className="btn-secondary flex-1"
              >
                Resume
              </button>
              <button 
                type="button" 
                disabled={submitting}
                onClick={handleManualSubmit} 
                className="btn-success flex-1 justify-center"
              >
                {submitting ? <Loader2 className="animate-spin" size={15} /> : 'Submit Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
