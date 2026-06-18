import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout, isCoach } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <nav className="navbar">
            <div className="navbar-brand">🛡️ SportManager</div>
            <div className="navbar-links">
                <NavLink to="/teams">🏆 Команди</NavLink>
                <NavLink to="/players">🏃 Гравці</NavLink>
                <NavLink to="/events">📅 Події</NavLink>
                <NavLink to="/injuries">🏥 Медпункт</NavLink>
                {isCoach && <NavLink to="/attendance">✅ Відвідуваність</NavLink>}
                {isCoach && <NavLink to="/stats">📊 Статистика</NavLink>}
                {isCoach && <NavLink to="/inventory">🎽 Інвентар</NavLink>}
            </div>
            <div className="navbar-user">
                <span className="user-name">{user?.first_name} {user?.last_name}</span>
                <span className={`role-badge role-${user?.role}`}>
                    {user?.role === 'coach' ? 'Тренер' : 'Гравець'}
                </span>
                <button className="btn-logout" onClick={handleLogout}>Вийти</button>
            </div>
        </nav>
    );
}
