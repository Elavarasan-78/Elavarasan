import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, BookOpen, HelpCircle, Users, BarChart3, FolderOpen,
  Layers, FileText, LogOut, Menu, X, Sun, Moon, ChevronRight, Trophy
} from 'lucide-react';

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/categories', icon: FolderOpen, label: 'Categories' },
  { to: '/admin/subjects', icon: Layers, label: 'Subjects' },
  { to: '/admin/quizzes', icon: BookOpen, label: 'Quizzes' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/results', icon: FileText, label: 'Results' },
  { to: '/admin/leaderboard', icon: Trophy, label: 'Leaderboard' },
];

const userLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/quizzes', icon: BookOpen, label: 'Available Quizzes' },
  { to: '/my-attempts', icon: HelpCircle, label: 'My Attempts' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: Users, label: 'Profile' },
];

export default function Sidebar({ role = 'USER' }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const links = role === 'ADMIN' ? adminLinks : userLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-sm">Smart Quiz</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{role === 'ADMIN' ? 'Admin Panel' : 'Portal'}</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-200 dark:border-slate-700 space-y-1">
        <button onClick={toggle} className="sidebar-link w-full">
          {dark ? <Sun size={17} /> : <Moon size={17} />}
          <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <div className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.fullName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} title="Logout" className="text-slate-400 hover:text-red-500 transition-colors">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 h-screen flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 fixed left-0 top-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="font-bold text-slate-900 dark:text-white text-sm">Smart Quiz</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-slate-800 shadow-2xl z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
