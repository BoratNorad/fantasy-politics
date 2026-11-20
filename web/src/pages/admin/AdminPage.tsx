/** Site admin panel. Only visible to emails listed in ADMIN_EMAILS. */
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { AdminEvents } from './AdminEvents';
import { AdminPlayers } from './AdminPlayers';
import { AdminUsers } from './AdminUsers';

const tab = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`;

export function AdminPage() {
  return (
    <div className="space-y-4">
      <h1 className="page-title">Admin</h1>
      <nav className="flex gap-2">
        <NavLink to="/admin/players" className={tab}>Players</NavLink>
        <NavLink to="/admin/events" className={tab}>Event log</NavLink>
        <NavLink to="/admin/users" className={tab}>Users</NavLink>
      </nav>
      <Routes>
        <Route index element={<Navigate to="players" replace />} />
        <Route path="players" element={<AdminPlayers />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="users" element={<AdminUsers />} />
      </Routes>
    </div>
  );
}
