import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Icon = ({ d, size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
    </svg>
);

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uk-UA',{day:'2-digit',month:'long',year:'numeric'}) : '—';
const fmtDT   = (d) => d ? new Date(d).toLocaleString('uk-UA',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
const daysUntil = (d) => d ? Math.ceil((new Date(d)-Date.now())/86400000) : null;

const STATUS_CFG = {
    present:{ label:'Присутній', bg:'var(--success-bg)', color:'var(--success)' },
    absent: { label:'Відсутній', bg:'var(--danger-bg)',  color:'var(--danger)' },
    late:   { label:'Запізнився',bg:'var(--warning-bg)', color:'var(--warning)' },
};

export default function PlayerDashboard() {
    const [profile,  setProfile]  = useState(null);
    const [events,   setEvents]   = useState([]);
    const [stats,    setStats]    = useState([]);
    const [attHist,  setAttHist]  = useState([]);
    const [team,     setTeam]     = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const safe = (r) => r.ok ? r.json() : r.json().catch(()=>r.text()).then(e=>{ throw new Error(typeof e==='string'?e:e?.error||'Помилка'); });
        Promise.all([
            api.get('/profile').then(safe),
            api.get('/profile/events').then(r=>r.ok?r.json():[]),
            api.get('/profile/stats').then(r=>r.ok?r.json():[]),
            api.get('/profile/attendance').then(r=>r.ok?r.json():[]),
            api.get('/profile/team').then(r=>r.ok?r.json():[]),
        ]).then(([p, ev, st, at, tm]) => {
            setProfile(p); setEvents(ev||[]); setStats(st||[]); setAttHist(at||[]); setTeam(tm||[]);
            setLoading(false);
        }).catch(e => { setError(e.message); setLoading(false); });
    }, []);

    if (loading) return <div className="page"><div className="loader"><div className="loader-spinner"/><div>Завантаження...</div></div></div>;
    if (error)   return <div className="page"><div className="alert alert-error">Помилка: {error}. Перезапустіть сервер та оновіть сторінку.</div></div>;

    const { stats: s, attendance: a } = profile || {};
    const upcoming  = events.filter(e => new Date(e.event_date) >= new Date()).slice(0,4);
    const attPct    = a?.total > 0 ? Math.round(100 * a.present / a.total) : null;
    const lastStats = stats.slice(0,4);

    return (
        <div className="page">
            {/* Header */}
            <div className="page-header" style={{marginBottom:28}}>
                <div>
                    <h1 className="page-title">Привіт, {user?.first_name}! 👋</h1>
                    <p className="page-subtitle">
                        {profile?.user?.team_name
                            ? `Команда: ${profile.user.team_name} · ${profile.user.team_category}`
                            : 'Ви не приєднані до жодної команди'}
                    </p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={()=>navigate('/player/profile')}>
                        <Icon d={['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8']}/>
                        Мій профіль
                    </button>
                    <button className="btn btn-primary" onClick={()=>navigate('/player/medical')}>
                        <Icon d={['M22 12h-4l-3 9L9 3l-3 9H2']}/>
                        Записатись до медпункту
                    </button>
                </div>
            </div>

            {/* KPI row */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
                {[
                    { label:'Голів', value: s?.total_goals ?? 0, sub:'за всі матчі', color:'var(--primary)', bg:'var(--primary-light)' },
                    { label:'Матчів', value: s?.games_played ?? 0, sub:'зіграно', color:'#2563eb', bg:'#eff6ff' },
                    { label:'Рейтинг', value: s?.avg_rating ?? '—', sub:'середній', color:'#d97706', bg:'#fffbeb' },
                    { label:'Явка', value: attPct != null ? attPct+'%' : '—', sub:`${a?.present??0} з ${a?.total??0} подій`, color:'#059669', bg:'#ecfdf5' },
                ].map(k => (
                    <div key={k.label} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'20px',boxShadow:'var(--shadow-sm)'}}>
                        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',color:'var(--text-3)',marginBottom:8}}>{k.label}</div>
                        <div style={{fontSize:32,fontWeight:800,color:k.color,letterSpacing:'-1px',lineHeight:1}}>{k.value}</div>
                        <div style={{fontSize:12,color:'var(--text-4)',marginTop:6}}>{k.sub}</div>
                    </div>
                ))}
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20}}>

                {/* Upcoming events */}
                <div className="widget">
                    <div className="widget-header">
                        <span className="widget-title">Найближчі події</span>
                        <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/player/events')}>Всі →</button>
                    </div>
                    <div className="widget-list">
                        {upcoming.length === 0 && <div className="widget-empty">Немає майбутніх подій</div>}
                        {upcoming.map(e => {
                            const days = daysUntil(e.event_date);
                            return (
                                <div key={e.id} className="widget-row">
                                    <div style={{
                                        width:40,height:40,borderRadius:'var(--r)',background:'var(--primary-light)',
                                        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                                        flexShrink:0,
                                    }}>
                                        <span style={{fontSize:14,fontWeight:800,color:'var(--primary)',lineHeight:1}}>
                                            {days === 0 ? '!' : days}
                                        </span>
                                        <span style={{fontSize:9,color:'var(--primary)',fontWeight:600}}>{days===0?'СЬОГОДНІ':'днів'}</span>
                                    </div>
                                    <div className="widget-row-main">
                                        <div className="widget-row-name">{e.title}</div>
                                        <div className="widget-row-sub">{fmtDT(e.event_date)} · {e.location||'Локація TBD'}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* My recent stats */}
                <div className="widget">
                    <div className="widget-header">
                        <span className="widget-title">Моя статистика</span>
                        <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/player/stats')}>Всі →</button>
                    </div>
                    <div className="widget-list">
                        {lastStats.length === 0 && <div className="widget-empty">Статистика відсутня</div>}
                        {lastStats.map(st => (
                            <div key={st.id} className="widget-row">
                                <div className="widget-row-main">
                                    <div className="widget-row-name">{st.event_title}</div>
                                    <div className="widget-row-sub">{fmtDate(st.event_date)}</div>
                                </div>
                                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
                                    <span style={{fontWeight:700,color:'var(--primary)',fontSize:15}}>{st.goals} г</span>
                                    {st.rating && <span style={{fontSize:11,color:'var(--text-4)'}}>⭐ {st.rating}/10</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Attendance history */}
                <div className="widget">
                    <div className="widget-header">
                        <span className="widget-title">Відвідуваність</span>
                        <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/player/attendance')}>Всі →</button>
                    </div>
                    {attPct != null && (
                        <div style={{padding:'12px 20px',borderBottom:'1px solid var(--border-2)',display:'flex',alignItems:'center',gap:12}}>
                            <div style={{flex:1,height:8,background:'var(--border-2)',borderRadius:4,overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${attPct}%`,background:attPct>=80?'var(--success)':attPct>=50?'var(--warning)':'var(--danger)',borderRadius:4,transition:'width .5s'}}/>
                            </div>
                            <span style={{fontWeight:700,fontSize:14,color:attPct>=80?'var(--success)':attPct>=50?'var(--warning)':'var(--danger)',minWidth:40}}>{attPct}%</span>
                        </div>
                    )}
                    <div className="widget-list">
                        {attHist.slice(0,5).map(a => {
                            const cfg = STATUS_CFG[a.status]||{label:a.status,bg:'#f1f5f9',color:'var(--text-3)'};
                            return (
                                <div key={a.id} className="widget-row">
                                    <div className="widget-row-main">
                                        <div className="widget-row-name">{a.title}</div>
                                        <div className="widget-row-sub">{fmtDate(a.event_date)}</div>
                                    </div>
                                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:cfg.bg,color:cfg.color,whiteSpace:'nowrap'}}>{cfg.label}</span>
                                </div>
                            );
                        })}
                        {attHist.length === 0 && <div className="widget-empty">Немає записів</div>}
                    </div>
                </div>

                {/* Team */}
                <div className="widget">
                    <div className="widget-header">
                        <span className="widget-title">Моя команда</span>
                        <button className="btn btn-ghost btn-sm" onClick={()=>navigate('/player/team')}>Всі →</button>
                    </div>
                    <div className="widget-list">
                        {team.length === 0 && <div className="widget-empty">Команду не призначено</div>}
                        {team.slice(0,6).map(m => (
                            <div key={m.id} className="widget-row">
                                <div style={{
                                    width:32,height:32,borderRadius:'50%',flexShrink:0,
                                    background:m.role==='coach'?'#ecfdf5':'#eff6ff',
                                    display:'flex',alignItems:'center',justifyContent:'center',
                                    fontSize:11,fontWeight:700,
                                    color:m.role==='coach'?'#065f46':'#1e3a8a'
                                }}>{m.first_name?.[0]}{m.last_name?.[0]}</div>
                                <div className="widget-row-main">
                                    <div className="widget-row-name">{m.first_name} {m.last_name}</div>
                                    <div className="widget-row-sub">{m.role==='coach'?'Тренер':'Гравець'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick actions */}
                <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',boxShadow:'var(--shadow-sm)',padding:20,display:'flex',flexDirection:'column',gap:10}}>
                    <div style={{fontSize:14,fontWeight:700,marginBottom:4}}>Швидкі дії</div>
                    {[
                        ['/player/medical','Записатись до медпункту','var(--danger-bg)','var(--danger)',['M22 12h-4l-3 9L9 3l-3 9H2']],
                        ['/player/events', 'Переглянути розклад','var(--info-bg)','var(--info)',['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z']],
                        ['/player/stats',  'Моя статистика','var(--primary-light)','var(--primary)',['M18 20V10','M12 20V4','M6 20v-6']],
                        ['/player/profile','Редагувати профіль','#f1f5f9','var(--text-3)',['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2','M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8']],
                    ].map(([to,label,bg,color,d])=>(
                        <button key={to} onClick={()=>navigate(to)} style={{
                            display:'flex',alignItems:'center',gap:12,padding:'12px 14px',
                            background:bg,border:'none',borderRadius:'var(--r)',cursor:'pointer',
                            textAlign:'left',transition:'opacity .13s',
                        }}
                        onMouseEnter={e=>e.currentTarget.style.opacity='.8'}
                        onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                            <span style={{color,display:'flex'}}><Icon d={d}/></span>
                            <span style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>{label}</span>
                        </button>
                    ))}
                </div>

            </div>
        </div>
    );
}
