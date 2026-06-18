import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const empty = { team_id: '', title: '', event_date: '', location: '', description: '' };
const toInput = (d) => d ? new Date(d).toISOString().slice(0,16) : '';
const fmtDT   = (d) => d ? new Date(d).toLocaleString('uk-UA',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const isUpcoming = (d) => d && new Date(d) >= new Date();

const Icon = ({ d }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
);
const EDIT_D   = ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'];
const DEL_D    = ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2'];
const PLUS_D   = 'M12 5v14M5 12h14';
const SEARCH_D = 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z';
const EXPORT_D = ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'];

const exportCSV = (rows) => {
    if (!rows.length) return;
    const csv = [
        ['ID','Назва','Дата','Команда','Локація','Опис'].join(','),
        ...rows.map(r=>[r.id,`"${r.title}"`,fmtDT(r.event_date),`"${r.team_name||''}"`,`"${r.location||''}"`,`"${r.description||''}"`].join(','))
    ].join('\n');
    const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv'})),download:'events.csv'});
    a.click(); URL.revokeObjectURL(a.href);
};

export default function EventsPage() {
    const [events,  setEvents]  = useState([]);
    const [teams,   setTeams]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal,   setModal]   = useState(null);
    const [form,    setForm]    = useState(empty);
    const [editId,  setEditId]  = useState(null);
    const [error,   setError]   = useState('');
    const [search,  setSearch]  = useState('');
    const [timeFilter, setTimeFilter] = useState('all');
    const [teamFilter, setTeamFilter] = useState('');
    const { isCoach } = useAuth();

    const load = async () => {
        setLoading(true);
        const [er, tr] = await Promise.all([api.get('/events'), api.get('/teams')]);
        setEvents(await er.json()); setTeams(await tr.json()); setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        let r = [...events];
        if (search)     r = r.filter(e => `${e.title} ${e.location||''}`.toLowerCase().includes(search.toLowerCase()));
        if (teamFilter) r = r.filter(e => String(e.team_id) === teamFilter);
        if (timeFilter==='upcoming') r = r.filter(e => isUpcoming(e.event_date));
        if (timeFilter==='past')     r = r.filter(e => !isUpcoming(e.event_date));
        return r.sort((a,b) => new Date(a.event_date)-new Date(b.event_date));
    }, [events, search, teamFilter, timeFilter]);

    const set = (f,v) => setForm(p=>({...p,[f]:v}));
    const openCreate = () => { setForm(empty); setError(''); setModal('create'); };
    const openEdit   = (e) => { setForm({team_id:e.team_id||'',title:e.title,event_date:toInput(e.event_date),location:e.location||'',description:e.description||''}); setEditId(e.id); setError(''); setModal('edit'); };
    const closeModal = () => setModal(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        const res = modal==='create' ? await api.post('/events',form) : await api.put(`/events/${editId}`,form);
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        closeModal(); load();
    };
    const handleDelete = async (id) => { if (!confirm('Видалити подію?')) return; await api.delete(`/events/${id}`); load(); };

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Події та матчі</h1><p className="page-subtitle">Розклад тренувань і змагань</p></div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={()=>exportCSV(filtered)}><Icon d={EXPORT_D}/> CSV</button>
                    {isCoach && <button className="btn btn-primary" onClick={openCreate}><Icon d={PLUS_D}/> Нова подія</button>}
                </div>
            </div>
            <div className="toolbar">
                <div className="search-box"><Icon d={SEARCH_D}/><input placeholder="Назва або локація..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
                <select className="filter-select" value={timeFilter} onChange={e=>setTimeFilter(e.target.value)}>
                    <option value="all">Всі події</option><option value="upcoming">Майбутні</option><option value="past">Минулі</option>
                </select>
                <select className="filter-select" value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}>
                    <option value="">Усі команди</option>
                    {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <span className="text-muted" style={{fontSize:13,marginLeft:'auto'}}>{filtered.length} з {events.length}</span>
            </div>
            {loading ? <div className="loader"><div className="loader-spinner"/><div>Завантаження...</div></div> : (
                <div className="table-card"><div className="table-scroll">
                    <table>
                        <thead><tr>
                            <th style={{width:48}}>ID</th><th>Назва події</th><th>Дата та час</th>
                            <th>Команда</th><th>Локація</th><th>Статус</th>
                            {isCoach && <th style={{width:110}}></th>}
                        </tr></thead>
                        <tbody>
                            {filtered.map(e => {
                                const up = isUpcoming(e.event_date);
                                return (<tr key={e.id}>
                                    <td className="td-id">{e.id}</td>
                                    <td>
                                        <div className="td-strong">{e.title}</div>
                                        {e.description && <div className="td-sub" style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.description}</div>}
                                    </td>
                                    <td className="td-nowrap">{fmtDT(e.event_date)}</td>
                                    <td>{e.team_name?<span className="badge badge-indigo">{e.team_name}</span>:<span className="td-muted">—</span>}</td>
                                    <td className="td-muted">{e.location||'—'}</td>
                                    <td><span className={`badge ${up?'badge-green':'badge-slate'}`}>{up?'Майбутня':'Минула'}</span></td>
                                    {isCoach && <td className="td-actions">
                                        <button className="btn-icon-only" onClick={()=>openEdit(e)}><Icon d={EDIT_D}/></button>
                                        <button className="btn-icon-only danger" onClick={()=>handleDelete(e.id)} style={{marginLeft:4}}><Icon d={DEL_D}/></button>
                                    </td>}
                                </tr>);
                            })}
                            {!filtered.length && <tr><td colSpan="7" className="td-empty">Подій не знайдено</td></tr>}
                        </tbody>
                    </table>
                </div></div>
            )}
            {modal && (
                <Modal title={modal==='create'?'Нова подія':'Редагувати подію'} onClose={closeModal}>
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-error">{error}</div>}
                        <div className="form-group"><label>Назва *</label><input value={form.title} onChange={e=>set('title',e.target.value)} required autoFocus/></div>
                        <div className="form-row">
                            <div className="form-group"><label>Дата та час *</label><input type="datetime-local" value={form.event_date} onChange={e=>set('event_date',e.target.value)} required/></div>
                            <div className="form-group"><label>Команда</label>
                                <select value={form.team_id} onChange={e=>set('team_id',e.target.value)}>
                                    <option value="">— Усі команди —</option>
                                    {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group"><label>Локація</label><input value={form.location} onChange={e=>set('location',e.target.value)} placeholder="Стадіон, зал..."/></div>
                        <div className="form-group"><label>Опис / план</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} rows="3"/></div>
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
