import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { GuestRoute, UserRoute, AdminRoute } from './components/PrivateRoute';

// Auth pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import CategoryManagement from './pages/admin/CategoryManagement';
import SubjectManagement from './pages/admin/SubjectManagement';
import QuizManagement from './pages/admin/QuizManagement';
import QuestionManagement from './pages/admin/QuestionManagement';
import UserManagement from './pages/admin/UserManagement';
import ResultsManagement from './pages/admin/ResultsManagement';
import AdminLeaderboard from './pages/admin/AdminLeaderboard';

// User / Candidate pages
import CandidateDashboard from './pages/user/CandidateDashboard';
import QuizzesList from './pages/user/QuizzesList';
import ExamRoom from './pages/user/ExamRoom';
import ResultDetail from './pages/user/ResultDetail';
import MyAttempts from './pages/user/MyAttempts';
import CandidateLeaderboard from './pages/user/CandidateLeaderboard';
import Profile from './pages/user/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Guest / Public Routes */}
            <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

            {/* Candidate / User Routes */}
            <Route path="/dashboard" element={<UserRoute><CandidateDashboard /></UserRoute>} />
            <Route path="/quizzes" element={<UserRoute><QuizzesList /></UserRoute>} />
            <Route path="/quiz/:quizId" element={<UserRoute><ExamRoom /></UserRoute>} />
            <Route path="/result/:attemptId" element={<UserRoute><ResultDetail /></UserRoute>} />
            <Route path="/my-attempts" element={<UserRoute><MyAttempts /></UserRoute>} />
            <Route path="/leaderboard" element={<UserRoute><CandidateLeaderboard /></UserRoute>} />
            <Route path="/profile" element={<UserRoute><Profile /></UserRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><CategoryManagement /></AdminRoute>} />
            <Route path="/admin/subjects" element={<AdminRoute><SubjectManagement /></AdminRoute>} />
            <Route path="/admin/quizzes" element={<AdminRoute><QuizManagement /></AdminRoute>} />
            <Route path="/admin/quizzes/:quizId/questions" element={<AdminRoute><QuestionManagement /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
            <Route path="/admin/results" element={<AdminRoute><ResultsManagement /></AdminRoute>} />
            <Route path="/admin/leaderboard" element={<AdminRoute><AdminLeaderboard /></AdminRoute>} />

            {/* Default redirect route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
