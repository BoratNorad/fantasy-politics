/** App shell: top bar on all sizes, bottom tab bar on phones. */
import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../auth';

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
    isActive ? 'text-indigo-600' : 'text-slate-500'
  }`;

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold">
            <span aria-hidden>🏛️</span> Fantasy Politics
          </Link>
          {user && (
            <nav className="flex items-center gap-4 text-sm">
              <NavLink to="/" end className="hidden font-medium text-slate-600 hover:text-slate-900 sm:block">
                Leagues
              </NavLink>
              <NavLink to="/players" className="hidden font-medium text-slate-600 hover:text-slate-900 sm:block">
                Players
              </NavLink>
              {user.isAdmin && (
                <NavLink to="/admin" className="hidden font-medium text-slate-600 hover:text-slate-900 sm:block">
                  Admin
                </NavLink>
              )}
              <span className="hidden text-slate-400 sm:inline">|</span>
              <span className="max-w-[8rem] truncate text-slate-600">{user.displayName}</span>
              <button onClick={logout} className="text-slate-500 hover:text-slate-900">
                Log out
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 sm:pb-8">
        <Outlet />
      </main>

      {user && (
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden">
          <NavLink to="/" end className={tabClass}>
            <span className="text-lg" aria-hidden>🏆</span>Leagues
          </NavLink>
          <NavLink to="/players" className={tabClass}>
            <span className="text-lg" aria-hidden>🧑‍💼</span>Players
          </NavLink>
          {user.isAdmin && (
            <NavLink to="/admin" className={tabClass}>
              <span className="text-lg" aria-hidden>🛠️</span>Admin
            </NavLink>
          )}
        </nav>
      )}
    </div>
  );
}
