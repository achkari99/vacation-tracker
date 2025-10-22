import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import CalendarPage from './pages/CalendarPage';
import DashboardPage from './pages/DashboardPage';
import ProfilesPage from './pages/ProfilesPage';

function Sidebar() {
  const navClasses = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors ${
      isActive ? 'bg-brand-100 text-brand-800 font-semibold' : ''
    }`;

  return (
    <aside className="hidden md:flex flex-col w-64 p-4 gap-2">
      <div className="px-4 py-3">
        <div className="text-2xl font-bold">Acme RH</div>
        <div className="text-subtle text-sm">Suivi des conges</div>
      </div>
      <NavLink className={navClasses} to="/">
        Tableau de bord
      </NavLink>
      <NavLink className={navClasses} to="/calendar">
        Calendrier
      </NavLink>
      <NavLink className={navClasses} to="/profiles">
        Profils
      </NavLink>
    </aside>
  );
}

function Topbar() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between p-4 border-b border-line bg-card">
      <div className="md:hidden">
        <select className="input" onChange={(e) => navigate(e.target.value)}>
          <option value="/">Tableau de bord</option>
          <option value="/calendar">Calendrier</option>
          <option value="/profiles">Profils</option>
        </select>
      </div>
      <div className="font-semibold">Plateforme RH</div>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-brand-600 text-white grid place-items-center">A</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[16rem_1fr]">
      <Sidebar />
      <main className="flex flex-col">
        <Topbar />
        <div className="p-4 md:p-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/profiles" element={<ProfilesPage />} />
            <Route path="/me" element={<Navigate to="/profiles" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
