import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const empty = { user_id: '', injury_type: '', incident_date: '', expected_recovery_date: '', status: 'Лечится' };
const toInput = (d) => d ? new Date(d).toISOString().slice(0,10) : '';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uk-UA') : '—';
const daysAgo = (d) => d ? Math.max(0, Math.floor((Date.now()-new Date(d))/86400000)) : 0;

const DONE_STATUSES = ['Одужав','recovered'];
const statusBadge = (s) => {
    if (DONE_STATUSES.includes(s)) return 'badge-green';
    if (s === 'Спостереження')     return 'badge-amber';
    return 'badge-red';
};

const Icon = ({ d }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
);
const EDIT_D  = ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'];
const DEL_D   = ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2'];
const PLUS_D  = 'M12 5v14M5 12h14';
const SRCH_D  = 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z';
const CHECK_D = ['M22 11.08V12a10 10 0 1 1-5.93-9.14','M22 4 12 14.01l-3-3'];

export default function InjuriesPage() {
    const [injuries, setInjuries] = useState([]);
    const [players,  setPlayers]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [modal,    setModal]    = useState(null);
    const [form,     setForm]     = useState(empty);
    const [editId,   setEditId]   = useState(null);
    const [error,    setError]    = useState('');
    const [search,   setSearch]   = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const { isCoach } = useAuth();

    const load = async () => {
        setLoading(true);
        const [ir, pr] = await Promise.all([api.get('/injuries'), api.get('/players')]);
        setInjuries(await ir.json()); setPlayers(await pr.json()); setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        let r = [...injuries];
        if (search) r = r.filter(i =>
            (i.first_name+' '+i.last_name).toLowerCase().includes(search.toLowerCase()) ||
            (i.injury_type||'').toLowerCase().includes(search.toLowerCase()));
        if (statusFilter === 'active') r = r.filter(i => !DONE_STATUSES.includes(i.status));
        if (statusFilter === 'done')   r = r.filter(i => DONE_STATUSES.includes(i.status));
        return r.sort((a,b) => new Date(b.incident_date) - new Date(a.incident_date));
    }, [injuries, search, statusFilter]);

    const activeCount = injuries.filter(i => !DONE_STATUSES.includes(i.status)).length;
    const doneCount   = injuries.filter(i =>  DONE_STATUSES.includes(i.status)).length;

    const set = (f, v) => setForm(p => ({...p,[f]:v}));
    const openCreate = () => { setForm(empty); setError(''); setModal('create'); };
    const openEdit   = (i) => {
        setForm({ user_id: i.user_id, injury_type: i.injury_type||'', incident_date: toInput(i.incident_date),
                  expected_recovery_date: toInput(i.expected_recovery_date), status: i.status });
        setEditId(i.id); setError(''); setModal('edit');
    };
    const closeModal = () => setModal(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        const res = modal==='create' ? await api.post('/injuries',form) : await api.put(`/injuries/${editId}`,form);
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        closeModal(); load();
    };
    const handleDelete  = async (id) => { if (!confirm('Видалити?')) return; await api.delete(`/injuries/${id}`); load(); };
    const markRecovered = async (inj) => {
        await api.put(`/injuries/${inj.id}`, { user_id: inj.user_id, injury_type: inj.injury_type,
            incident_date: toInput(inj.incident_date), expected_recovery_date: toInput(inj.expected_recovery_date), status: 'Одужав' });
        load();
    };

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Медпункт</h1><p className="page-subtitle">Облік травм та стан гравців</p></div>
                <div className="page-actions">{isCoach && <button className="btn btn-primary" onClick={openCreate}><Icon d={PLUS_D}/> Додати травму</button>}</div>
            </div>

            <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                {[['','Всі',injuries.length],['active','Активні',activeCount],['done','Одужали',doneCount]].map(([v,l,c])=>(
                    <button key={v} onClick={()=>setStatusFilter(v)} style={{
                        display:'flex',alignItems:'center',gap:8,padding:'10px 18px',
                        background:statusFilter===v?'var(--primary)':'var(--card)',
                        border:'1.5px solid '+(statusFilter===v?'var(--primary)':'var(--border)'),
                        borderRadius:'var(--r)',cursor:'pointer',transition:'all .13s'}}>
                        <span style={{fontWeight:700,fontSize:18,color:statusFilter===v?'#fff':'var(--text)'}}>{c}</span>
                        <span style={{fontSize:13,color:statusFilter===v?'rgba(255,255,255,.8)':'var(--text-3)'}}>{l}</span>
                    </button>
                ))}
            </div>

            <div className="toolbar">
                <div className="search-box"><Icon d={SRCH_D}/><input placeholder="Ім'я або тип травми..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
                <span className="text-muted" style={{fontSize:13,marginLeft:'auto'}}>{filtered.length} з {injuries.length}</span>
            </div>

            {loading ? <div className="loader"><div className="loader-spinner"/><div>Завантаження...</div></div> : (
                <div className="table-card"><div className="table-scroll">
                    <table>
                        <thead><tr>
                            <th style={{width:48}}>ID</th><th>Гравець</th><th>Тип травми</th>
                            <th>Дата</th><th>Одужання</th><th>Статус</th><th className="td-center">Днів</th>
                            {isCoach && <th style={{width:160}}></th>}
                        </tr></thead>
                        <tbody>
                            {filtered.map(i => (
                                <tr key={i.id}>
                                    <td className="td-id">{i.id}</td>
                                    <td className="td-strong">{i.first_name} {i.last_name}</td>
                                    <td>{i.injury_type||'—'}</td>
                                    <td className="td-nowrap">{fmtDate(i.incident_date)}</td>
                                    <td className="td-muted">{fmtDate(i.expected_recovery_date)}</td>
                                    <td><span className={`badge ${statusBadge(i.status)}`}>{i.status}</span></td>
                                    <td className="td-center">
                                        {!DONE_STATUSES.includes(i.status)
                                            ? <span style={{fontWeight:600,color:'var(--danger)'}}>{daysAgo(i.incident_date)}</span>
                                            : <span className="td-muted">—</span>}
                                    </td>
                                    {isCoach && <td className="td-actions">
                                        {!DONE_STATUSES.includes(i.status) &&
                                            <button className="btn btn-success btn-sm" onClick={()=>markRecovered(i)} style={{marginRight:4}}><Icon d={CHECK_D}/></button>}
                                        <button className="btn-icon-only" onClick={()=>openEdit(i)}><Icon d={EDIT_D}/></button>
                                        <button className="btn-icon-only danger" onClick={()=>handleDelete(i.id)} style={{marginLeft:4}}><Icon d={DEL_D}/></button>
                                    </td>}
                                </tr>
                            ))}
                            {!filtered.length && <tr><td colSpan="8" className="td-empty">Записів не знайдено</td></tr>}
                        </tbody>
                    </table>
                </div></div>
            )}

            {modal && (
                <Modal title={modal==='create'?'Нова травма':'Редагувати травму'} onClose={closeModal}>
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-error">{error}</div>}
                        <div className="form-group"><label>Гравець *</label>
                            <select value={form.user_id} onChange={e=>set('user_id',e.target.value)} required>
                                <option value="">— Оберіть гравця —</option>
                                {players.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Тип / опис травми *</label>
                            <input value={form.injury_type} onChange={e=>set('injury_type',e.target.value)} required placeholder="Розтягнення, перелом..."/>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>Дата травми *</label>
                                <input type="date" value={form.incident_date} onChange={e=>set('incident_date',e.target.value)} required/>
                            </div>
                            <div className="form-group"><label>Очікуване одужання</label>
                                <input type="date" value={form.expected_recovery_date} onChange={e=>set('expected_recovery_date',e.target.value)}/>
                            </div>
                        </div>
                        <div className="form-group"><label>Статус</label>
                            <select value={form.status} onChange={e=>set('status',e.target.value)}>
                                <option value="Лечится">Лікується</option>
                                <option value="Спостереження">Спостереження</option>
                                <option value="Одужав">Одужав</option>
                            </select>
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
