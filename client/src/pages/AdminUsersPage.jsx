import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

const emptyForm = { first_name:'', last_name:'', email:'', role:'player', team_id:'', password:'' };

const ROLES = ['player','coach','admin'];
const ROLE_LABELS = { player:'Гравець', coach:'Тренер', admin:'Адмін' };
const ROLE_BADGES = { player:'badge-blue', coach:'badge-green', admin:'badge-amber' };

const Icon = ({ d }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
    </svg>
);
const PLUS_D   = 'M12 5v14M5 12h14';
const DEL_D    = ['M3 6h18','M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6','M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2'];
const SEARCH_D = 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z';
const EXPORT_D = ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4','M7 10l5 5 5-5','M12 15V3'];
const SHIELD_D = ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'];

const exportCSV = (rows) => {
    if (!rows.length) return;
    const csv = [
        ['ID','Ім\'я','Прізвище','Email','Роль','Команда'].join(','),
        ...rows.map(r=>[r.id,`"${r.first_name}"`,`"${r.last_name}"`,`"${r.email}"`,r.role,`"${r.team_name||''}"`].join(','))
    ].join('\n');
    const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv'})),download:'users.csv'});
    a.click(); URL.revokeObjectURL(a.href);
};

export default function AdminUsersPage() {
    const [users,   setUsers]   = useState([]);
    const [teams,   setTeams]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError]   = useState('');
    const [search,  setSearch]  = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [modal,   setModal]   = useState(null); // 'create' | 'role:{id}'
    const [form,    setForm]    = useState(emptyForm);
    const [formErr, setFormErr] = useState('');
    const [roleTarget, setRoleTarget] = useState(null);
    const { user: me } = useAuth();

    const load = async () => {
        setLoading(true);
        const [ur, tr] = await Promise.all([api.get('/admin/users'), api.get('/teams')]);
        const ud = await ur.json(); const td = await tr.json();
        if (ur.ok) setUsers(ud); else setError(ud.error||'Помилка');
        setTeams(td); setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        let r = [...users];
        if (search) r = r.filter(u => `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase().includes(search.toLowerCase()));
        if (roleFilter) r = r.filter(u => u.role === roleFilter);
        return r;
    }, [users, search, roleFilter]);

    const tMap = useMemo(() => Object.fromEntries(teams.map(t=>[t.id,t.name])), [teams]);

    // Stats
    const counts = useMemo(() => ({
        total:  users.length,
        admin:  users.filter(u=>u.role==='admin').length,
        coach:  users.filter(u=>u.role==='coach').length,
        player: users.filter(u=>u.role==='player').length,
    }), [users]);

    // Change role
    const openRoleModal = (u) => { setRoleTarget(u); setFormErr(''); setModal('role'); };
    const handleRoleChange = async (newRole) => {
        setFormErr('');
        const res = await api.put(`/admin/users/${roleTarget.id}/role`, { role: newRole });
        // fallback: use PATCH via custom fetch if PUT not mapped
        const res2 = res.ok ? res : await fetch(`/api/admin/users/${roleTarget.id}/role`, {
            method: 'PATCH', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ role: newRole })
        });
        const data = await (res.ok ? res : res2).json();
        if (!(res.ok || res2.ok)) { setFormErr(data.error); return; }
        setModal(null); load();
    };

    // Create user
    const set = (f,v) => setForm(p=>({...p,[f]:v}));
    const openCreate = () => { setForm(emptyForm); setFormErr(''); setModal('create'); };
    const handleCreate = async (e) => {
        e.preventDefault(); setFormErr('');
        const res = await api.post('/admin/users', form);
        const data = await res.json();
        if (!res.ok) { setFormErr(data.error); return; }
        setModal(null); load();
    };

    // Delete
    const handleDelete = async (id) => {
        if (id === me?.id) { alert('Не можна видалити себе'); return; }
        if (!confirm('Видалити користувача?')) return;
        await api.delete(`/admin/users/${id}`); load();
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Права доступу</h1>
                    <p className="page-subtitle">Управління ролями та доступом користувачів</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={()=>exportCSV(filtered)}><Icon d={EXPORT_D}/> CSV</button>
                    <button className="btn btn-primary" onClick={openCreate}><Icon d={PLUS_D}/> Новий користувач</button>
                </div>
            </div>

            {/* Stats */}
            <div style={{display:'flex',gap:12,marginBottom:20,flexWrap:'wrap'}}>
                {[['','Всі',counts.total,'var(--primary)'],['admin','Адміни',counts.admin,'#d97706'],['coach','Тренери',counts.coach,'#059669'],['player','Гравці',counts.player,'#2563eb']].map(([v,l,c,col])=>(
                    <button key={v} onClick={()=>setRoleFilter(v)} style={{
                        display:'flex',alignItems:'center',gap:10,padding:'12px 20px',
                        background:roleFilter===v?'var(--primary)':'var(--card)',
                        border:'1.5px solid '+(roleFilter===v?'var(--primary)':'var(--border)'),
                        borderRadius:'var(--r-md)',cursor:'pointer',transition:'all .13s',boxShadow:'var(--shadow-sm)'}}>
                        <span style={{fontWeight:800,fontSize:22,color:roleFilter===v?'#fff':col,lineHeight:1}}>{c}</span>
                        <span style={{fontSize:13,fontWeight:600,color:roleFilter===v?'rgba(255,255,255,.8)':'var(--text-3)'}}>{l}</span>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="toolbar">
                <div className="search-box"><Icon d={SEARCH_D}/><input placeholder="Ім'я, прізвище або email..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
                <span className="text-muted" style={{fontSize:13,marginLeft:'auto'}}>{filtered.length} з {users.length} користувачів</span>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? <div className="loader"><div className="loader-spinner"/><div>Завантаження...</div></div> : (
                <div className="table-card"><div className="table-scroll">
                    <table>
                        <thead><tr>
                            <th style={{width:48}}>ID</th>
                            <th>Користувач</th>
                            <th>Email</th>
                            <th>Роль</th>
                            <th>Команда</th>
                            <th style={{width:180}}>Змінити роль</th>
                            <th style={{width:80}}></th>
                        </tr></thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id} style={u.id===me?.id?{background:'#fafbff'}:{}}>
                                    <td className="td-id">{u.id}</td>
                                    <td>
                                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                                            <div style={{
                                                width:32,height:32,borderRadius:'50%',flexShrink:0,
                                                background:u.role==='admin'?'#fef3c7':u.role==='coach'?'#ecfdf5':'#eff6ff',
                                                display:'flex',alignItems:'center',justifyContent:'center',
                                                fontSize:11,fontWeight:700,
                                                color:u.role==='admin'?'#92400e':u.role==='coach'?'#065f46':'#1e3a8a'
                                            }}>
                                                {u.first_name?.[0]}{u.last_name?.[0]}
                                            </div>
                                            <div>
                                                <div className="td-strong">{u.last_name} {u.first_name}</div>
                                                {u.id===me?.id && <div style={{fontSize:11,color:'var(--primary)',fontWeight:600}}>Це ви</div>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="td-muted td-nowrap">{u.email}</td>
                                    <td>
                                        <span className={`badge ${ROLE_BADGES[u.role]||'badge-slate'}`}>
                                            {u.role==='admin' && <><Icon d={SHIELD_D}/>&nbsp;</>}
                                            {ROLE_LABELS[u.role]||u.role}
                                        </span>
                                    </td>
                                    <td>{u.team_id ? <span className="badge badge-indigo">{tMap[u.team_id]||u.team_id}</span> : <span className="td-muted">—</span>}</td>
                                    <td>
                                        {u.id !== me?.id ? (
                                            <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                                                {ROLES.filter(r=>r!==u.role).map(r=>(
                                                    <button key={r} className={`btn btn-sm ${r==='admin'?'btn-secondary':r==='coach'?'btn-success':'btn-ghost'}`}
                                                        style={r==='admin'?{borderColor:'#fbbf24',color:'#92400e',background:'#fef3c7'}:{}}
                                                        onClick={()=>{ setRoleTarget({...u, newRole:r}); handleRoleChangeDirect(u.id, r); }}>
                                                        {ROLE_LABELS[r]}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : <span className="td-muted">—</span>}
                                    </td>
                                    <td className="td-actions">
                                        {u.id !== me?.id &&
                                            <button className="btn-icon-only danger" onClick={()=>handleDelete(u.id)}><Icon d={DEL_D}/></button>}
                                    </td>
                                </tr>
                            ))}
                            {!filtered.length && <tr><td colSpan="7" className="td-empty">Користувачів не знайдено</td></tr>}
                        </tbody>
                    </table>
                </div></div>
            )}

            {/* Create user modal */}
            {modal === 'create' && (
                <Modal title="Новий користувач" onClose={()=>setModal(null)}>
                    <form onSubmit={handleCreate}>
                        {formErr && <div className="alert alert-error">{formErr}</div>}
                        <div className="form-row">
                            <div className="form-group"><label>Ім'я *</label><input value={form.first_name} onChange={e=>set('first_name',e.target.value)} required autoFocus/></div>
                            <div className="form-group"><label>Прізвище *</label><input value={form.last_name} onChange={e=>set('last_name',e.target.value)} required/></div>
                        </div>
                        <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e=>set('email',e.target.value)} required/></div>
                        <div className="form-row">
                            <div className="form-group"><label>Роль</label>
                                <select value={form.role} onChange={e=>set('role',e.target.value)}>
                                    <option value="player">Гравець</option>
                                    <option value="coach">Тренер</option>
                                    <option value="admin">Адміністратор</option>
                                </select>
                            </div>
                            <div className="form-group"><label>Команда</label>
                                <select value={form.team_id} onChange={e=>set('team_id',e.target.value)}>
                                    <option value="">— Без команди —</option>
                                    {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group"><label>Пароль *</label>
                            <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} required placeholder="мін. 6 символів"/>
                        </div>
                        {form.role==='admin' && (
                            <div className="alert alert-warn" style={{marginBottom:0}}>
                                Цей користувач отримає повний доступ до системи
                            </div>
                        )}
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={()=>setModal(null)}>Скасувати</button>
                            <button type="submit" className="btn btn-primary">Створити</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );

    // inline helper to avoid extra state
    async function handleRoleChangeDirect(userId, newRole) {
        const res = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PATCH',
            headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ role: newRole })
        });
        const data = await res.json();
        if (!res.ok) { alert(data.error); return; }
        load();
    }
}
