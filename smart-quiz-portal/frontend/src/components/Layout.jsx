import Sidebar from './Sidebar';

export const AdminLayout = ({ children }) => (
  <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
    <Sidebar role="ADMIN" />
    <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen">{children}</div>
    </main>
  </div>
);

export const UserLayout = ({ children }) => (
  <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
    <Sidebar role="USER" />
    <main className="flex-1 lg:ml-64 pt-16 lg:pt-0">
      <div className="p-4 sm:p-6 lg:p-8 min-h-screen">{children}</div>
    </main>
  </div>
);
