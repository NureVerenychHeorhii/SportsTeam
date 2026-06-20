import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Icon = ({ d, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
);

const I = {
    dashboard: ['M3 3h7v7H3z','M14 3h7v7h-7z','M3 14h7v7H3z','M14 14h7v7h-7z'],
    teams:     ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
    players:   ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
    events:    ['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
    attendance:['M22 11.08V12a10 10 0 1 1-5.93-9.14','M22 4 12 14.01l-3-3'],
    stats:     ['M18 20V10','M12 20V4','M6 20v-6'],
    injuries:  ['M22 12h-4l-3 9L9 3l-3 9H2'],
    inventory: ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z','M3.27 6.96 12 12.01l8.73-5.05','M12 22.08V12'],
    admin:     ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'],
    profile:   ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
    myevents:  ['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
    medical:   ['M22 12h-4l-3 9L9 3l-3 9H2'],
    mystats:   ['M18 20V10','M12 20V4','M6 20v-6'],
    myatt:     ['M9 11l3 3L22 4','M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11'],
    team:      ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8'],
};

const ROLE_LABELS = { admin:'Адміністратор', coach:'Тренер', player:'Гравець' };

// Staff nav (admin + coach)
const NAV_STAFF = [
    { to:'/dashboard',  label:'Огляд',         icon:'dashboard' },
    { to:'/teams',      label:'Команди',        icon:'teams' },
    { to:'/players',    label:'Гравці',         icon:'players' },
    { to:'/events',     label:'Події',          icon:'events' },
    { to:'/attendance', label:'Відвідуваність', icon:'attendance' },
    { to:'/stats',      label:'Статистика',     icon:'stats' },
    { to:'/injuries',   label:'Медпункт',       icon:'injuries' },
    { to:'/inventory',  label:'Інвентар',       icon:'inventory' },
];

// Player nav
const NAV_PLAYER = [
    { to:'/player/dashboard',  label:'Мій огляд',      icon:'dashboard' },
    { to:'/player/events',     label:'Мої події',       icon:'myevents' },
    { to:'/player/team',       label:'Моя команда',     icon:'team' },
    { to:'/player/medical',    label:'Медпункт',        icon:'medical' },
    { to:'/player/stats',      label:'Моя статистика',  icon:'mystats' },
    { to:'/player/attendance', label:'Відвідуваність',  icon:'myatt' },
    { to:'/player/profile',    label:'Мій профіль',     icon:'profile' },
];

export default function Sidebar() {
    const { user, logout, isCoach, isAdmin } = useAuth();
    const navigate = useNavigate();
    const isStaff  = isCoach || isAdmin;
    const isPlayer = !isStaff;

    const nav = isPlayer ? NAV_PLAYER : NAV_STAFF;
    const handleLogout = () => { logout(); navigate('/login'); };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="sidebar-logo-icon">
                    <Icon d={['M12 2L2 7l10 5 10-5-10-5z','M2 17l10 5 10-5','M2 12l10 5 10-5']} size={20}/>
                </div>
                <span className="sidebar-logo-text">SportManager</span>
            </div>

            <div className="sidebar-section-label">Навігація</div>
            <nav className="sidebar-nav">
                {nav.map(n => (
                    <NavLink key={n.to} to={n.to} className={({ isActive }) => `sidebar-link${isActive?' active':''}`}>
                        <span className="sidebar-link-icon"><Icon d={I[n.icon]}/></span>
                        <span className="sidebar-link-label">{n.label}</span>
                    </NavLink>
                ))}
            </nav>

            {isAdmin && (
                <>
                    <div className="sidebar-divider"/>
                    <div className="sidebar-section-admin">Адміністрування</div>
                    <nav className="sidebar-nav">
                        <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link${isActive?' active':''}`}
                            style={({ isActive }) => isActive ? {} : { color:'#fbbf24' }}>
                            <span className="sidebar-link-icon"><Icon d={I.admin}/></span>
                            <span className="sidebar-link-label">Права доступу</span>
                        </NavLink>
                    </nav>
                </>
            )}

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="sidebar-avatar">
                        {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <div className="sidebar-user-info">
                        <span className="sidebar-user-name">{user?.first_name} {user?.last_name}</span>
                        <span className={`sidebar-role sidebar-role-${user?.role}`}>
                            {ROLE_LABELS[user?.role] || user?.role}
                        </span>
                    </div>
                </div>
                <button className="sidebar-logout" onClick={handleLogout} title="Вийти">
                    <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                </button>
            </div>
        </aside>
    );
}
