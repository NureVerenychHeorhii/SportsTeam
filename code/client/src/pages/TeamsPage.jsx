import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const empty = { name: '', category: '' };
const Icon = ({ d }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
    </svg>
);
const EDIT_D   = ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'];
const DEL_D    = ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2'];
const PLUS_D   = 'M12 5v14M5 12h14';
const SEARCH_D = 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z';
const USERS_D  = ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75','M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8'];

export default function TeamsPage() {
    const [teams,    setTeams]    = useState([]);
    const [players,  setPlayers]  = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [modal,    setModal]    = useState(null);
    const [form,     setForm]     = useState(empty);
    const [editId,   setEditId]   = useState(null);
    const [viewTeam, setViewTeam] = useState(null);
    const [search,   setSearch]   = useState('');
    const [error,    setError]    = useState('');
    const { isCoach } = useAuth();

    const load = async () => {
        setLoading(true);
        const [tr, pr] = await Promise.all([api.get('/teams'), api.get('/players')]);
        setTeams(await tr.json()); setPlayers(await pr.json()); setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const teamsWithCount = useMemo(() =>
        teams.map(t => ({ ...t, playerCount: players.filter(p => p.team_id === t.id).length }))
    , [teams, players]);

    const filtered = useMemo(() =>
        teamsWithCount.filter(t =>
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.category.toLowerCase().includes(search.toLowerCase()))
    , [teamsWithCount, search]);

    const openCreate  = () => { setForm(empty); setError(''); setModal('create'); };
    const openEdit    = (t) => { setForm({ name: t.name, category: t.category }); setEditId(t.id); setError(''); setModal('edit'); };
    const openMembers = (t) => { setViewTeam(t); setModal('members'); };
    const closeModal  = () => setModal(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        const res = modal === 'create' ? await api.post('/teams', form) : await api.put(`/teams/${editId}`, form);
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        closeModal(); load();
    };
    const handleDelete = async (id) => {
        if (!confirm('Видалити команду?')) return;
        const res = await api.delete(`/teams/${id}`);
        if (!res.ok) { const d = await res.json(); alert(d.error); return; }
        load();
    };

    const teamMembers = viewTeam ? players.filter(p => p.team_id === viewTeam.id) : [];

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Команди</h1><p className="page-subtitle">Управління командами клубу</p></div>
                <div className="page-actions">{isCoach && <button className="btn btn-primary" onClick={openCreate}><Icon d={PLUS_D} /> Нова команда</button>}</div>
            </div>
            <div className="toolbar">
                <div className="search-box"><Icon d={SEARCH_D} /><input placeholder="Назва або категорія..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                <span className="text-muted" style={{fontSize:13,marginLeft:'auto'}}>{filtered.length} з {teams.length}</span>
            </div>
            {loading ? <div className="loader"><div className="loader-spinner"/><div>Завантаження...</div></div> : (
                <div className="table-card"><div className="table-scroll">
                    <table>
                        <thead><tr><th style={{width:48}}>ID</th><th>Назва</th><th>Категорія</th><th className="td-center">Гравців</th>{isCoach && <th style={{width:110}}></th>}</tr></thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id}>
                                    <td className="td-id">{t.id}</td>
                                    <td className="td-strong">{t.name}</td>
                                    <td><span className="badge badge-indigo">{t.category}</span></td>
                                    <td className="td-center"><button className="btn btn-ghost btn-sm" onClick={() => openMembers(t)}><Icon d={USERS_D} /> {t.playerCount}</button></td>
                                    {isCoach && <td className="td-actions">
                                        <button className="btn-icon-only" onClick={() => openEdit(t)}><Icon d={EDIT_D} /></button>
                                        <button className="btn-icon-only danger" onClick={() => handleDelete(t.id)} style={{marginLeft:4}}><Icon d={DEL_D} /></button>
                                    </td>}
                                </tr>
                            ))}
                            {!filtered.length && <tr><td colSpan="5" className="td-empty">Команд не знайдено</td></tr>}
                        </tbody>
                    </table>
                </div></div>
            )}
            {(modal === 'create' || modal === 'edit') && (
                <Modal title={modal === 'create' ? 'Нова команда' : 'Редагувати команду'} onClose={closeModal}>
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-error">{error}</div>}
                        <div className="form-group"><label>Назва команди *</label><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} required autoFocus /></div>
                        <div className="form-group"><label>Категорія *</label><input value={form.category} onChange={e => setForm({...form,category:e.target.value})} placeholder="Основа, U-19..." required /></div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={closeModal}>Скасувати</button>
                            <button type="submit" className="btn btn-primary">Зберегти</button>
                        </div>
                    </form>
                </Modal>
            )}
            {modal === 'members' && viewTeam && (
                <Modal title={`Склад: ${viewTeam.name}`} onClose={closeModal}>
                    <div style={{marginBottom:12}}><span className="badge badge-indigo">{viewTeam.category}</span><span className="text-muted" style={{marginLeft:8,fontSize:13}}>{teamMembers.length} гравців</span></div>
                    {teamMembers.length === 0
                        ? <div className="empty-state" style={{padding:'24px 0'}}>Команда порожня</div>
                        : <table><thead><tr><th>Гравець</th><th>Email</th></tr></thead>
                          <tbody>{teamMembers.map(p => <tr key={p.id}><td className="td-strong">{p.first_name} {p.last_name}</td><td className="td-muted">{p.email}</td></tr>)}</tbody></table>}
                    <div className="form-actions" style={{marginTop:16}}><button className="btn btn-secondary" onClick={closeModal}>Закрити</button></div>
                </Modal>
            )}
        </div>
    );
}
