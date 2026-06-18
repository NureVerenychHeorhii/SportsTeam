import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

// Real player_stats columns: id, user_id, event_id, goals, rating, coach_comment
const emptyForm = { user_id:'', goals:0, rating:'', coach_comment:'' };
const fmtDT = (d) => d ? new Date(d).toLocaleString('uk-UA',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';

const Icon = ({ d }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
);
const EDIT_D = ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'];
const DEL_D  = ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2'];
const PLUS_D = 'M12 5v14M5 12h14';

export default function StatsPage() {
    const [events,   setEvents]   = useState([]);
    const [players,  setPlayers]  = useState([]);
    const [stats,    setStats]    = useState([]);
    const [selEvent, setSelEvent] = useState('');
    const [tab,      setTab]      = useState('event');
    const [allStats, setAllStats] = useState([]);
    const [loading,  setLoading]  = useState(false);
    const [modal,    setModal]    = useState(null);
    const [form,     setForm]     = useState(emptyForm);
    const [editId,   setEditId]   = useState(null);
    const [error,    setError]    = useState('');
    const [sortField, setSortField] = useState('goals');
    const [sortDir,   setSortDir]   = useState('desc');
    const { isCoach } = useAuth();

    useEffect(() => {
        Promise.all([api.get('/events').then(r=>r.json()), api.get('/players').then(r=>r.json())])
            .then(([ev,pl]) => { setEvents(ev); setPlayers(pl); });
    }, []);

    useEffect(() => {
        if (tab==='alltime') {
            setLoading(true);
            api.get('/stats').then(r=>r.json()).then(s => { setAllStats(s); setLoading(false); });
        }
    }, [tab]);

    const loadStats = async (eid) => {
        if (!eid) { setStats([]); return; }
        setLoading(true);
        const s = await api.get(`/stats?event_id=${eid}`).then(r=>r.json());
        setStats(s); setLoading(false);
    };

    const toggleSort = (f) => { if (sortField===f) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortField(f); setSortDir('desc'); } };
    const sc = (f) => sortField===f ? `sortable sort-${sortDir}` : 'sortable';

    const sortRows = (arr) => [...arr].sort((a,b) => {
        const va=Number(a[sortField]||0); const vb=Number(b[sortField]||0);
        return sortDir==='desc'?vb-va:va-vb;
    });

    const allTimeSummary = useMemo(() => {
        const map = {};
        allStats.forEach(s => {
            if (!map[s.user_id]) map[s.user_id] = { user_id:s.user_id, first_name:s.first_name, last_name:s.last_name, goals:0, games:0, ratings:[] };
            map[s.user_id].goals += Number(s.goals||0);
            map[s.user_id].games++;
            if (s.rating!=null) map[s.user_id].ratings.push(Number(s.rating));
        });
        return Object.values(map).map(m => ({
            ...m,
            avg_rating: m.ratings.length ? (m.ratings.reduce((a,b)=>a+b,0)/m.ratings.length).toFixed(1) : null
        }));
    }, [allStats]);

    const displayRows = sortRows(tab==='event' ? stats : allTimeSummary);
    const usedIds = useMemo(() => new Set(stats.map(s=>s.user_id)), [stats]);
    const availPlayers = modal==='edit' ? players : players.filter(p=>!usedIds.has(p.id));

    const set = (f,v) => setForm(p=>({...p,[f]:v}));
    const openCreate = () => { setForm({...emptyForm}); setError(''); setModal('create'); };
    const openEdit   = (s) => { setForm({user_id:s.user_id,goals:s.goals,rating:s.rating??'',coach_comment:s.coach_comment||''}); setEditId(s.id); setError(''); setModal('edit'); };
    const closeModal = () => setModal(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        const payload = { ...form, event_id: parseInt(selEvent) };
        // always use POST (upsert) for create; PUT for edit
        const res = modal==='create'
            ? await api.post('/stats', payload)
            : await api.put(`/stats/${editId}`, payload);
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        closeModal(); loadStats(selEvent);
    };
    const handleDelete = async (id) => { if (!confirm('Видалити?')) return; await api.delete(`/stats/${id}`); loadStats(selEvent); };

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Статистика</h1><p className="page-subtitle">Показники гравців по матчах</p></div>
                <div className="page-actions">
                    {isCoach && tab==='event' && selEvent &&
                        <button className="btn btn-primary" onClick={openCreate}><Icon d={PLUS_D}/> Додати запис</button>}
                </div>
            </div>

            <div style={{display:'flex',gap:4,marginBottom:16,background:'var(--card)',padding:4,borderRadius:'var(--r)',border:'1px solid var(--border)',width:'fit-content'}}>
                {[['event','По матчах'],['alltime','Загальна']].map(([v,l])=>(
                    <button key={v} onClick={()=>{setTab(v);setSortField('goals');setSortDir('desc');}}
                        style={{padding:'6px 16px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',fontWeight:600,fontSize:13,
                            background:tab===v?'var(--primary)':'transparent',color:tab===v?'#fff':'var(--text-3)',transition:'all .13s'}}>
                        {l}
                    </button>
                ))}
            </div>

            {tab==='event' && (
                <div className="toolbar" style={{marginBottom:16}}>
                    <select className="filter-select" style={{minWidth:320}} value={selEvent}
                        onChange={e=>{setSelEvent(e.target.value);loadStats(e.target.value);}}>
                        <option value="">— Оберіть подію —</option>
                        {events.map(e=><option key={e.id} value={e.id}>{e.title} · {fmtDT(e.event_date)}</option>)}
                    </select>
                </div>
            )}

            {tab==='event' && !selEvent && <div className="empty-state" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)'}}>Оберіть подію</div>}
            {loading && <div className="loader"><div className="loader-spinner"/><div>Завантаження...</div></div>}

            {!loading && (tab==='alltime' || selEvent) && (
                <div className="table-card"><div className="table-scroll">
                    <table>
                        <thead><tr>
                            <th>Гравець</th>
                            {tab==='alltime' && <th className="td-center">Матчів</th>}
                            <th className={`td-center ${sc('goals')}`} onClick={()=>toggleSort('goals')}>Голи</th>
                            <th className={`td-center ${sc(tab==='alltime'?'avg_rating':'rating')}`}
                                onClick={()=>toggleSort(tab==='alltime'?'avg_rating':'rating')}>Рейтинг</th>
                            {tab==='event' && <th>Коментар тренера</th>}
                            {isCoach && tab==='event' && <th style={{width:110}}></th>}
                        </tr></thead>
                        <tbody>
                            {displayRows.map(s => {
                                const rating = tab==='alltime' ? s.avg_rating : s.rating;
                                return (
                                    <tr key={s.id||s.user_id}>
                                        <td className="td-strong">{s.first_name} {s.last_name}</td>
                                        {tab==='alltime' && <td className="td-center">{s.games}</td>}
                                        <td className="td-center"><strong style={{color:'var(--primary)',fontSize:16}}>{s.goals}</strong></td>
                                        <td className="td-center">
                                            {rating!=null
                                                ? <div className="rating-bar">
                                                    <div className="rating-track"><div className="rating-fill" style={{width:`${Math.min(100,(Number(rating)/10)*100)}%`}}/></div>
                                                    <span className="rating-num">{rating}</span>
                                                  </div>
                                                : <span className="td-muted">—</span>}
                                        </td>
                                        {tab==='event' && <td className="td-muted" style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.coach_comment||'—'}</td>}
                                        {isCoach && tab==='event' && <td className="td-actions">
                                            <button className="btn-icon-only" onClick={()=>openEdit(s)}><Icon d={EDIT_D}/></button>
                                            <button className="btn-icon-only danger" onClick={()=>handleDelete(s.id)} style={{marginLeft:4}}><Icon d={DEL_D}/></button>
                                        </td>}
                                    </tr>
                                );
                            })}
                            {!displayRows.length && <tr><td colSpan="7" className="td-empty">Немає даних</td></tr>}
                        </tbody>
                    </table>
                </div></div>
            )}

            {modal && (
                <Modal title={modal==='create'?'Новий запис':'Редагувати статистику'} onClose={closeModal}>
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-error">{error}</div>}
                        <div className="form-group"><label>Гравець *</label>
                            <select value={form.user_id} onChange={e=>set('user_id',e.target.value)} required disabled={modal==='edit'}>
                                <option value="">— Оберіть гравця —</option>
                                {availPlayers.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                            </select>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>Голи</label>
                                <input type="number" min="0" value={form.goals} onChange={e=>set('goals',e.target.value)}/>
                            </div>
                            <div className="form-group"><label>Рейтинг (0–10)</label>
                                <input type="number" min="0" max="10" step="1" value={form.rating} onChange={e=>set('rating',e.target.value)} placeholder="Необов'язково"/>
                            </div>
                        </div>
                        <div className="form-group"><label>Коментар тренера</label>
                            <textarea value={form.coach_comment} onChange={e=>set('coach_comment',e.target.value)} rows="3" placeholder="Оцінка гри..."/>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={closeModal}>Скасувати</button>
                            <button type="submit" className="btn btn-primary">Зберегти</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
