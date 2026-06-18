import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';

const STATUS_OPT = ['present','absent','late'];
const STATUS_CFG = { present:{label:'Присутній',btn:'active-present'}, absent:{label:'Відсутній',btn:'active-absent'}, late:{label:'Запізнився',btn:'active-late'} };
const fmtDT = (d) => d ? new Date(d).toLocaleString('uk-UA',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

const Icon = ({ d }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
);
const SAVE_D = ['M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z','M17 21v-8H7v8','M7 3v5h8'];

export default function AttendancePage() {
    const [events,  setEvents]  = useState([]);
    const [players, setPlayers] = useState([]);
    const [records, setRecords] = useState({});
    const [selEvent, setSelEvent] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving,  setSaving]  = useState(false);
    const [saved,   setSaved]   = useState(false);
    const [teamFilter, setTeamFilter] = useState('');
    const [teams,   setTeams]   = useState([]);

    useEffect(() => {
        Promise.all([api.get('/events').then(r=>r.json()), api.get('/teams').then(r=>r.json())])
            .then(([ev, tm]) => { setEvents(ev); setTeams(tm); });
    }, []);

    useEffect(() => {
        if (!selEvent) { setPlayers([]); setRecords({}); return; }
        setLoading(true);
        Promise.all([api.get('/players').then(r=>r.json()), api.get(`/attendance?event_id=${selEvent}`).then(r=>r.json())])
            .then(([pl, at]) => {
                setPlayers(pl);
                const map = {};
                pl.forEach(p => { map[p.id] = 'present'; });
                at.forEach(a => { map[a.user_id] = a.status; });
                setRecords(map);
                setLoading(false);
            });
    }, [selEvent]);

    const filteredPlayers = useMemo(() =>
        teamFilter ? players.filter(p => String(p.team_id) === teamFilter) : players
    , [players, teamFilter]);

    const summary = useMemo(() => {
        const p = filteredPlayers.filter(pl => records[pl.id]==='present').length;
        const a = filteredPlayers.filter(pl => records[pl.id]==='absent').length;
        const l = filteredPlayers.filter(pl => records[pl.id]==='late').length;
        const pct = filteredPlayers.length ? Math.round(100*p/filteredPlayers.length) : 0;
        return { present:p, absent:a, late:l, pct };
    }, [filteredPlayers, records]);

    const setStatus = (uid, s) => setRecords(r=>({...r,[uid]:s}));

    const handleSave = async () => {
        setSaving(true); setSaved(false);
        const recs = players.map(p=>({user_id:p.id,status:records[p.id]||'present'}));
        await api.post('/attendance/bulk',{event_id:parseInt(selEvent),records:recs});
        setSaving(false); setSaved(true);
        setTimeout(()=>setSaved(false),2500);
    };

    const markAll = (s) => {
        const map = {...records};
        filteredPlayers.forEach(p => { map[p.id]=s; });
        setRecords(map);
    };

    const tMap = useMemo(() => Object.fromEntries(teams.map(t=>[t.id,t.name])), [teams]);
    const event = events.find(e=>String(e.id)===String(selEvent));

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Відвідуваність</h1><p className="page-subtitle">Облік присутності на подіях</p></div>
                <div className="page-actions">
                    {selEvent && players.length > 0 && (
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            <Icon d={SAVE_D}/> {saving?'Збереження...':saved?'Збережено':'Зберегти'}
                        </button>
                    )}
                </div>
            </div>

            <div className="toolbar">
                <select className="filter-select" style={{minWidth:320}} value={selEvent} onChange={e=>{setSelEvent(e.target.value);setSaved(false);}}>
                    <option value="">— Оберіть подію —</option>
                    {events.map(e=><option key={e.id} value={e.id}>{e.title} · {fmtDT(e.event_date)}</option>)}
                </select>
                {selEvent && (
                    <select className="filter-select" value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}>
                        <option value="">Усі команди</option>
                        {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                )}
            </div>

            {!selEvent && <div className="empty-state" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)'}}>Оберіть подію для відображення відвідуваності</div>}
            {selEvent && loading && <div className="loader"><div className="loader-spinner"/><div>Завантаження...</div></div>}

            {selEvent && !loading && filteredPlayers.length > 0 && (
                <div className="table-card">
                    <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-2)',display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
                        {event && <span style={{fontWeight:600,fontSize:14}}>{event.title}</span>}
                        <span className="badge badge-green">{summary.present} присутніх</span>
                        <span className="badge badge-red">{summary.absent} відсутніх</span>
                        <span className="badge badge-amber">{summary.late} запізнились</span>
                        <span className="badge badge-indigo">{summary.pct}% явки</span>
                        <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                            <button className="btn btn-secondary btn-sm" onClick={()=>markAll('present')}>Всі присутні</button>
                            <button className="btn btn-secondary btn-sm" onClick={()=>markAll('absent')}>Всі відсутні</button>
                        </div>
                    </div>
                    <div className="table-scroll">
                        <table>
                            <thead><tr><th>Гравець</th><th>Команда</th><th>Статус</th></tr></thead>
                            <tbody>
                                {filteredPlayers.map(p => (
                                    <tr key={p.id}>
                                        <td className="td-strong">{p.first_name} {p.last_name}</td>
                                        <td>{p.team_id ? <span className="badge badge-indigo">{tMap[p.team_id]||p.team_id}</span> : <span className="td-muted">—</span>}</td>
                                        <td>
                                            <div className="status-group">
                                                {STATUS_OPT.map(s => (
                                                    <button key={s} className={`status-btn ${records[p.id]===s?STATUS_CFG[s].btn:''}`}
                                                        onClick={()=>setStatus(p.id,s)}>{STATUS_CFG[s].label}</button>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="att-summary-bar">
                        <div className="att-summary-item"><div className="att-dot" style={{background:'var(--success)'}}/><span>{summary.present} присутніх</span></div>
                        <div className="att-summary-item"><div className="att-dot" style={{background:'var(--danger)'}}/><span>{summary.absent} відсутніх</span></div>
                        <div className="att-summary-item"><div className="att-dot" style={{background:'var(--warning)'}}/><span>{summary.late} запізнились</span></div>
                        <strong style={{marginLeft:'auto'}}>{summary.pct}% явки</strong>
                    </div>
                </div>
            )}
            {selEvent && !loading && filteredPlayers.length === 0 && (
                <div className="empty-state" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)'}}>Немає гравців для відображення</div>
            )}
        </div>
    );
}
