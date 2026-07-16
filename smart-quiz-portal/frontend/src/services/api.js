import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// AUTH
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

// ADMIN
export const adminAPI = {
  // Analytics
  getAnalytics: () => api.get('/admin/analytics'),
  getGlobalLeaderboard: () => api.get('/admin/leaderboard/global'),
  getSubjectLeaderboard: (id) => api.get(`/admin/leaderboard/subject/${id}`),

  // Users
  getUsers: () => api.get('/admin/users'),
  searchUsers: (q) => api.get(`/admin/users/search?query=${q}`),
  toggleUserStatus: (id, active) => api.put(`/admin/users/${id}/toggle-status?active=${active}`),
  resetUserPassword: (id, newPassword) => api.put(`/admin/users/${id}/reset-password`, { newPassword }),

  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Subjects
  getSubjects: () => api.get('/admin/subjects'),
  createSubject: (data) => api.post('/admin/subjects', data),
  updateSubject: (id, data) => api.put(`/admin/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/admin/subjects/${id}`),

  // Quizzes
  getQuizzes: () => api.get('/admin/quizzes'),
  getQuiz: (id) => api.get(`/admin/quizzes/${id}`),
  createQuiz: (data) => api.post('/admin/quizzes', data),
  updateQuiz: (id, data) => api.put(`/admin/quizzes/${id}`, data),
  deleteQuiz: (id) => api.delete(`/admin/quizzes/${id}`),
  publishQuiz: (id) => api.put(`/admin/quizzes/${id}/publish`),
  unpublishQuiz: (id) => api.put(`/admin/quizzes/${id}/unpublish`),
  duplicateQuiz: (id) => api.post(`/admin/quizzes/${id}/duplicate`),

  // Questions
  getQuestions: (quizId) => api.get(`/admin/quizzes/${quizId}/questions`),
  addQuestion: (quizId, data) => api.post(`/admin/quizzes/${quizId}/questions`, data),
  updateQuestion: (id, data) => api.put(`/admin/questions/${id}`, data),
  deleteQuestion: (id) => api.delete(`/admin/questions/${id}`),
  bulkUpload: (quizId, file) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/admin/quizzes/${quizId}/questions/bulk-upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  downloadTemplate: () => api.get('/admin/questions/template', { responseType: 'blob' }),

  // Results
  getAllResults: () => api.get('/admin/results'),
  getResultsByQuiz: (id) => api.get(`/admin/results/quiz/${id}`),
  exportResultsExcel: () => api.get('/admin/results/export/excel', { responseType: 'blob' }),
  exportResultPdf: (id) => api.get(`/admin/results/export/pdf/${id}`, { responseType: 'blob' }),
};

// USER
export const userAPI = {
  getPublishedQuizzes: () => api.get('/user/quizzes'),
  getQuiz: (id) => api.get(`/user/quizzes/${id}`),
  canAttempt: (id) => api.get(`/user/quizzes/${id}/can-attempt`),
  getCategories: () => api.get('/user/categories'),
  getSubjects: () => api.get('/user/subjects'),
  startAttempt: (quizId) => api.post(`/user/quizzes/${quizId}/start`),
  getQuizQuestions: (quizId) => api.get(`/user/quizzes/${quizId}/questions`),
  submitAttempt: (attemptId, answers) => api.post(`/user/attempts/${attemptId}/submit`, answers),
  getAttemptResult: (attemptId) => api.get(`/user/attempts/${attemptId}/result`),
  getMyAttempts: () => api.get('/user/my-attempts'),
  getGlobalLeaderboard: () => api.get('/user/leaderboard/global'),
  getSubjectLeaderboard: (id) => api.get(`/user/leaderboard/subject/${id}`),
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  changePassword: (data) => api.put('/user/profile/change-password', data),
  exportResultPdf: (id) => api.get(`/user/attempts/${id}/export/pdf`, { responseType: 'blob' }),
};

export default api;
