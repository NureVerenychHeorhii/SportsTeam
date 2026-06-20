import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const empty = { first_name: '', last_name: '', email: '', team_id: '', password: '', role: 'player' };
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

const exportCSV = (rows, tMap) => {
    if (!rows.length) return;
    const csv = [
        ['ID','Ім\'я','Прізвище','Email','Роль','Команда'].join(','),
        ...rows.map(r => [r.id, `"${r.first_name}"`, `"${r.last_name}"`, `"${r.email}"`, r.role, `"${tMap[r.team_id]||''}"`].join(','))
    ].join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv'})), download:'players.csv' });
    a.click(); URL.revokeObjectURL(a.href);
};

export default function PlayersPage() {
    const [players,    setPlayers]    = useState([]);
    const [teams,      setTeams]      = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [modal,      setModal]      = useState(null);
    const [form,       setForm]       = useState(empty);
    const [editId,     setEditId]     = useState(null);
    const [error,      setError]      = useState('');
    const [search,     setSearch]     = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [sortField,  setSortField]  = useState('last_name');
    const [sortDir,    setSortDir]    = useState('asc');
    const { isCoach } = useAuth();

    const load = async () => {
        setLoading(true);
        const [pr, tr] = await Promise.all([api.get('/players'), api.get('/teams')]);
        setPlayers(await pr.json()); setTeams(await tr.json()); setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const tMap = useMemo(() => Object.fromEntries(teams.map(t => [t.id, t.name])), [teams]);

    const filtered = useMemo(() => {
        let r = [...players];
        if (search)     r = r.filter(p => `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(search.toLowerCase()));
        if (teamFilter) r = r.filter(p => teamFilter === '__none' ? !p.team_id : String(p.team_id) === teamFilter);
        if (roleFilter) r = r.filter(p => p.role === roleFilter);
        r.sort((a, b) => {
            const va = String(a[sortField]||''); const vb = String(b[sortField]||'');
            return sortDir==='asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        });
        return r;
    }, [players, search, teamFilter, roleFilter, sortField, sortDir]);

    const toggleSort = (f) => { if (sortField===f) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortField(f); setSortDir('asc'); } };
    const sc = (f) => sortField===f ? `sortable sort-${sortDir}` : 'sortable';

    const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
    const openCreate = () => { setForm(empty); setError(''); setModal('create'); };
    const openEdit   = (p) => { setForm({ first_name:p.first_name, last_name:p.last_name, email:p.email, team_id:p.team_id||'', password:'', role:p.role }); setEditId(p.id); setError(''); setModal('edit'); };
    const closeModal = () => setModal(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        const res = modal==='create' ? await api.post('/players', form) : await api.put(`/players/${editId}`, form);
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        closeModal(); load();
    };
    const handleDelete = async (id) => { if (!confirm('Видалити?')) return; await api.delete(`/players/${id}`); load(); };

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Гравці та тренери</h1><p className="page-subtitle">Всі користувачі системи</p></div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={() => exportCSV(filtered, tMap)}><Icon d={EXPORT_D} /> CSV</button>
                    {isCoach && <button className="btn btn-primary" onClick={openCreate}><Icon d={PLUS_D} /> Новий гравець</button>}
                </div>
            </div>
            <div className="toolbar">
                <div className="search-box"><Icon d={SEARCH_D} /><input placeholder="Ім'я, прізвище або email..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <select className="filter-select" value={teamFilter} onChange={e => setTeamFilter(e.target.value)}>
                    <option value="">Усі команди</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    <option value="__none">Без команди</option>
                </select>
                <select className="filter-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                    <option value="">Усі ролі</option><option value="player">Гравці</option><option value="coach">Тренери</option>
                </select>
                <span className="text-muted" style={{fontSize:13,marginLeft:'auto'}}>{filtered.length} з {players.length}</span>
            </div>
            {loading ? <div className="loader"><div className="loader-spinner"/><div>Завантаження...</div></div> : (
                <div className="table-card"><div className="table-scroll">
                    <table>
                        <thead><tr>
                            <th style={{width:48}}>ID</th>
                            <th className={sc('last_name')} onClick={()=>toggleSort('last_name')}>Прізвище та ім'я</th>
                            <th className={sc('email')}     onClick={()=>toggleSort('email')}>Email</th>
                            <th>Роль</th>
                            <th>Команда</th>
                            {isCoach && <th style={{width:110}}></th>}
                        </tr></thead>
                        <tbody>
                            {filtered.map(p => (
                                <tr key={p.id}>
                                    <td className="td-id">{p.id}</td>
                                    <td className="td-strong">{p.last_name} {p.first_name}</td>
                                    <td className="td-muted td-nowrap">{p.email}</td>
                                    <td><span className={`badge ${p.role==='coach'?'badge-green':'badge-blue'}`}>{p.role==='coach'?'Тренер':'Гравець'}</span></td>
                                    <td>{p.team_id ? <span className="badge badge-indigo">{tMap[p.team_id]||p.team_id}</span> : <span className="td-muted">—</span>}</td>
                                    {isCoach && <td className="td-actions">
                                        <button className="btn-icon-only" onClick={()=>openEdit(p)}><Icon d={EDIT_D}/></button>
                                        <button className="btn-icon-only danger" onClick={()=>handleDelete(p.id)} style={{marginLeft:4}}><Icon d={DEL_D}/></button>
                                    </td>}
                                </tr>
                            ))}
                            {!filtered.length && <tr><td colSpan="6" className="td-empty">Гравців не знайдено</td></tr>}
                        </tbody>
                    </table>
                </div></div>
            )}
            {modal && (
                <Modal title={modal==='create'?'Новий користувач':'Редагувати користувача'} onClose={closeModal}>
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-error">{error}</div>}
                        <div className="form-row">
                            <div className="form-group"><label>Ім'я *</label><input value={form.first_name} onChange={e=>set('first_name',e.target.value)} required autoFocus /></div>
                            <div className="form-group"><label>Прізвище *</label><input value={form.last_name} onChange={e=>set('last_name',e.target.value)} required /></div>
                        </div>
                        <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} required /></div>
                        <div className="form-row">
                            <div className="form-group"><label>Роль</label>
                                <select value={form.role} onChange={e=>set('role',e.target.value)}><option value="player">Гравець</option><option value="coach">Тренер</option></select>
                            </div>
                            <div className="form-group"><label>Команда</label>
                                <select value={form.team_id} onChange={e=>set('team_id',e.target.value)}>
                                    <option value="">— Без команди —</option>
                                    {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{modal==='create'?'Пароль *':'Новий пароль (залиш порожнім)'}</label>
                            <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} required={modal==='create'} placeholder="мін. 6 символів" />
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
