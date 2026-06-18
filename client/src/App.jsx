import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Staff pages
import DashboardPage  from './pages/DashboardPage';
import TeamsPage      from './pages/TeamsPage';
import PlayersPage    from './pages/PlayersPage';
import EventsPage     from './pages/EventsPage';
import InjuriesPage   from './pages/InjuriesPage';
import AttendancePage from './pages/AttendancePage';
import StatsPage      from './pages/StatsPage';
import InventoryPage  from './pages/InventoryPage';
import AdminUsersPage from './pages/AdminUsersPage';

// Player pages
import PlayerDashboard  from './pages/player/PlayerDashboard';
import PlayerEvents     from './pages/player/PlayerEvents';
import PlayerTeam       from './pages/player/PlayerTeam';
import PlayerMedical    from './pages/player/PlayerMedical';
import PlayerStats      from './pages/player/PlayerStats';
import PlayerAttendance from './pages/player/PlayerAttendance';
import PlayerProfile    from './pages/player/PlayerProfile';
import LoginPage        from './pages/LoginPage';

function AdminRoute({ children }) {
    const { isAdmin } = useAuth();
    return isAdmin ? children : <Navigate to="/dashboard" replace />;
}

function RoleIndex() {
    const { isCoach, isAdmin } = useAuth();
    return <Navigate to={(isCoach||isAdmin) ? '/dashboard' : '/player/dashboard'} replace />;
}

function Layout() {
    return (
        <div className="app-shell">
            <Sidebar />
            <main className="app-main">
                <Outlet />
            </main>
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<RoleIndex />} />

                        {/* Staff routes (admin + coach) */}
                        <Route path="/dashboard"   element={<DashboardPage />} />
                        <Route path="/teams"       element={<TeamsPage />} />
                        <Route path="/players"     element={<PlayersPage />} />
                        <Route path="/events"      element={<EventsPage />} />
                        <Route path="/attendance"  element={<AttendancePage />} />
                        <Route path="/stats"       element={<StatsPage />} />
                        <Route path="/injuries"    element={<InjuriesPage />} />
                        <Route path="/inventory"   element={<InventoryPage />} />
                        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />

                        {/* Player routes */}
                        <Route path="/player/dashboard"  element={<PlayerDashboard />} />
                        <Route path="/player/events"     element={<PlayerEvents />} />
                        <Route path="/player/team"       element={<PlayerTeam />} />
                        <Route path="/player/medical"    element={<PlayerMedical />} />
                        <Route path="/player/stats"      element={<PlayerStats />} />
                        <Route path="/player/attendance" element={<PlayerAttendance />} />
                        <Route path="/player/profile"    element={<PlayerProfile />} />

                        <Route path="*" element={<RoleIndex />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
