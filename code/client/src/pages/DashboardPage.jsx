import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Icon = ({ d, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDT   = (d) => d ? new Date(d).toLocaleString ('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

function KpiCard({ label, value, note, iconColor, iconPaths }) {
    return (
        <div className="kpi-card">
            <div className="kpi-card-top">
                <span className="kpi-card-label">{label}</span>
                <span className={`kpi-icon ${iconColor}`}><Icon d={iconPaths} size={17} /></span>
            </div>
            <div className="kpi-value">{value ?? '—'}</div>
            {note && <div className="kpi-note">{note}</div>}
        </div>
    );
}

export default function DashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/dashboard')
            .then(r => r.json())
            .then(d => {
                if (d.error) { setError(d.error); setLoading(false); return; }
                setData(d); setLoading(false);
            })
            .catch(e => { setError(e.message); setLoading(false); });
    }, []);

    if (loading) return (
        <div className="page">
            <div className="loader"><div className="loader-spinner" /><div>Завантаження...</div></div>
        </div>
    );

    if (error) return (
        <div className="page">
            <div className="alert alert-error">Помилка завантаження дашборду: {error}</div>
        </div>
    );

    const kpi               = data?.kpi               || {};
    const upcomingEvents    = data?.upcomingEvents     || [];
    const activeInjuries    = data?.activeInjuries     || [];
    const topScorers        = data?.topScorers         || [];
    const teamSizes         = data?.teamSizes          || [];
    const attendanceSummary = data?.attendanceSummary  || [];
    const maxPlayers = Math.max(...teamSizes.map(t => Number(t.player_count) || 0), 1);

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Огляд</h1>
                    <p className="page-subtitle">Ласкаво просимо, {user?.first_name}. Ось поточний стан клубу.</p>
                </div>
            </div>

            {/* KPI */}
            <div className="kpi-grid">
                <KpiCard label="Гравців"          value={kpi.total_players}      note={`${kpi.total_coaches} тренерів`}           iconColor="kpi-icon-indigo" iconPaths={['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8']} />
                <KpiCard label="Команд"           value={kpi.total_teams}        note="активних"                                   iconColor="kpi-icon-blue"   iconPaths={['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8']} />
                <KpiCard label="Майбутніх подій"  value={kpi.upcoming_events}    note={`${kpi.past_events} проведено`}             iconColor="kpi-icon-green"  iconPaths={['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z']} />
                <KpiCard label="Активних травм"   value={kpi.active_injuries}    note={`${kpi.total_injuries} всього`}             iconColor="kpi-icon-red"    iconPaths={['M22 12h-4l-3 9L9 3l-3 9H2']} />
                <KpiCard label="Одиниць інвентаря" value={kpi.inventory_items}   note={kpi.inventory_poor > 0 ? `${kpi.inventory_poor} у поганому стані` : 'всі в нормі'} iconColor={kpi.inventory_poor > 0 ? 'kpi-icon-amber' : 'kpi-icon-slate'} iconPaths={['M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2']} />
                <KpiCard label="Записів статистики" value={kpi.total_stat_records} note={`${kpi.total_attendance_records} відмітки відвідуваності`} iconColor="kpi-icon-indigo" iconPaths={['M18 20V10','M12 20V4','M6 20v-6']} />
            </div>

            {/* Widgets */}
            <div className="widgets-grid">

                {/* Upcoming events */}
                <div className="widget">
                    <div className="widget-header">
                        <span className="widget-title">Найближчі події</span>
                        <span className="widget-count">{upcomingEvents.length}</span>
                    </div>
                    <div className="widget-list">
                        {upcomingEvents.length === 0 && <div className="widget-empty">Немає запланованих подій</div>}
                        {upcomingEvents.map(e => (
                            <div key={e.id} className="widget-row">
                                <div className="widget-row-main">
                                    <div className="widget-row-name">{e.title}</div>
                                    <div className="widget-row-sub">{e.location || 'Локація не вказана'}</div>
                                </div>
                                <div className="widget-row-value" style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                                    <span style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{fmtDT(e.event_date)}</span>
                                    {e.team_name && <span className="badge badge-indigo">{e.team_name}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active injuries */}
                <div className="widget">
                    <div className="widget-header">
                        <span className="widget-title">Активні травми</span>
                        <span className="widget-count" style={{ background:'var(--danger-bg)', color:'var(--danger)' }}>{activeInjuries.length}</span>
                    </div>
                    <div className="widget-list">
                        {activeInjuries.length === 0 && <div className="widget-empty">Немає активних травм</div>}
                        {activeInjuries.map(i => (
                            <div key={i.id} className="widget-row">
                                <div className="widget-row-main">
                                    <div className="widget-row-name">{i.first_name} {i.last_name}</div>
                                    <div className="widget-row-sub">{i.injury_type || 'Тип не вказано'} · {i.status}</div>
                                </div>
                                <div className="widget-row-value">
                                    <span className="badge badge-red">{i.days_ago ?? 0} дн.</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top scorers */}
                <div className="widget">
                    <div className="widget-header">
                        <span className="widget-title">Топ бомбардири</span>
                    </div>
                    <div className="widget-list">
                        {topScorers.length === 0 && <div className="widget-empty">Статистика відсутня</div>}
                        {topScorers.map((s, i) => (
                            <div key={s.id} className="widget-row">
                                <div className="widget-row-num">{i + 1}</div>
                                <div className="widget-row-main">
                                    <div className="widget-row-name">{s.first_name} {s.last_name}</div>
                                    <div className="widget-row-sub">{s.games_played} матчів{s.avg_rating ? ` · рейтинг ${s.avg_rating}` : ''}</div>
                                </div>
                                <div className="widget-row-value">
                                    <span style={{ color:'var(--primary)', fontSize:14, fontWeight:800 }}>{s.total_goals}</span>
                                    <span style={{ color:'var(--text-4)', fontSize:11 }}> голів</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team composition */}
                <div className="widget">
                    <div className="widget-header">
                        <span className="widget-title">Склад команд</span>
                        <span className="widget-count">{teamSizes.length} команд</span>
                    </div>
                    <div className="widget-list">
                        {teamSizes.length === 0 && <div className="widget-empty">Немає команд</div>}
                        {teamSizes.map(t => (
                            <div key={t.id} className="team-bar-row">
                                <div className="team-bar-header">
                                    <span className="team-bar-name">{t.name}</span>
                                    <span className="team-bar-count">{t.player_count} гравців · <span className="badge badge-slate" style={{fontSize:10}}>{t.category}</span></span>
                                </div>
                                <div className="team-bar-track">
                                    <div className="team-bar-fill" style={{ width: `${(t.player_count / maxPlayers) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attendance summary */}
                <div className="widget">
                    <div className="widget-header">
                        <span className="widget-title">Відвідуваність подій</span>
                    </div>
                    <div className="widget-list">
                        {attendanceSummary.length === 0 && <div className="widget-empty">Записів відвідуваності немає</div>}
                        {attendanceSummary.map(a => {
                            const cls = a.pct >= 80 ? 'att-pct-high' : a.pct >= 50 ? 'att-pct-mid' : 'att-pct-low';
                            return (
                                <div key={a.id} className="att-row">
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div className="widget-row-name">{a.title}</div>
                                        <div className="widget-row-sub">{fmtDate(a.event_date)} · {a.present_count}/{a.total}</div>
                                    </div>
                                    <span className={`att-pct-pill ${cls}`}>{a.pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}
