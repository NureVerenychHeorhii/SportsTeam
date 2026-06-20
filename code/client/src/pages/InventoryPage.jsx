import { useState, useEffect, useMemo } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';

// Real inventory columns: id, team_id, item_name, quantity, condition
const empty = { item_name:'', quantity:1, condition:'Нове', team_id:'' };
const LOW_QTY = 5;

const condBadge = (c) => {
    if (!c) return 'badge-slate';
    const lc = c.toLowerCase();
    if (lc==='good'    || lc==='добрий'  || lc==='нове')    return 'badge-green';
    if (lc==='fair'    || lc==='задовільний')                return 'badge-amber';
    if (lc==='poor'    || lc==='поганий' || lc==='зношене') return 'badge-red';
    return 'badge-slate';
};
const condDot = (c) => {
    if (!c) return '';
    const lc = c.toLowerCase();
    if (lc==='good'||lc==='добрий'||lc==='нове')  return 'cond-good';
    if (lc==='fair'||lc==='задовільний')            return 'cond-fair';
    return 'cond-poor';
};
const isPoor = (c) => c && ['poor','поганий','зношене'].includes(c.toLowerCase());

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
const WARN_D   = ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','M12 9v4','M12 17h.01'];

const exportCSV = (rows, tMap) => {
    if (!rows.length) return;
    const csv = [
        ['ID','Назва','Кількість','Стан','Команда'].join(','),
        ...rows.map(r=>[r.id,`"${r.item_name}"`,r.quantity,r.condition,`"${tMap[r.team_id]||''}"`].join(','))
    ].join('\n');
    const a = Object.assign(document.createElement('a'),{href:URL.createObjectURL(new Blob(['﻿'+csv],{type:'text/csv'})),download:'inventory.csv'});
    a.click(); URL.revokeObjectURL(a.href);
};

export default function InventoryPage() {
    const [inventory,  setInventory]  = useState([]);
    const [teams,      setTeams]      = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [modal,      setModal]      = useState(null);
    const [form,       setForm]       = useState(empty);
    const [editId,     setEditId]     = useState(null);
    const [error,      setError]      = useState('');
    const [search,     setSearch]     = useState('');
    const [teamFilter, setTeamFilter] = useState('');
    const [condFilter, setCondFilter] = useState('');
    const { isCoach } = useAuth();

    const load = async () => {
        setLoading(true);
        const [ir, tr] = await Promise.all([api.get('/inventory'), api.get('/teams')]);
        setInventory(await ir.json()); setTeams(await tr.json()); setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const tMap = useMemo(() => Object.fromEntries(teams.map(t=>[t.id,t.name])), [teams]);

    const filtered = useMemo(() => {
        let r = [...inventory];
        if (search)     r = r.filter(i => (i.item_name||'').toLowerCase().includes(search.toLowerCase()));
        if (teamFilter) r = r.filter(i => teamFilter==='__none' ? !i.team_id : String(i.team_id)===teamFilter);
        if (condFilter) r = r.filter(i => (i.condition||'').toLowerCase().includes(condFilter.toLowerCase()));
        return r;
    }, [inventory, search, teamFilter, condFilter]);

    const alerts = useMemo(() => ({
        poor: inventory.filter(i => isPoor(i.condition)).length,
        low:  inventory.filter(i => Number(i.quantity)>0 && Number(i.quantity)<=LOW_QTY).length,
        zero: inventory.filter(i => Number(i.quantity)===0).length,
    }), [inventory]);

    const totalQty = useMemo(() => inventory.reduce((s,i)=>s+Number(i.quantity||0),0), [inventory]);

    const set = (f,v) => setForm(p=>({...p,[f]:v}));
    const openCreate = () => { setForm(empty); setError(''); setModal('create'); };
    const openEdit   = (i) => { setForm({item_name:i.item_name||'',quantity:i.quantity,condition:i.condition||'',team_id:i.team_id||''}); setEditId(i.id); setError(''); setModal('edit'); };
    const closeModal = () => setModal(null);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        const res = modal==='create' ? await api.post('/inventory',form) : await api.put(`/inventory/${editId}`,form);
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        closeModal(); load();
    };
    const handleDelete = async (id) => { if (!confirm('Видалити?')) return; await api.delete(`/inventory/${id}`); load(); };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Інвентар</h1>
                    <p className="page-subtitle">{inventory.length} позицій · {totalQty} одиниць загалом</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-secondary" onClick={()=>exportCSV(filtered,tMap)}><Icon d={EXPORT_D}/> CSV</button>
                    {isCoach && <button className="btn btn-primary" onClick={openCreate}><Icon d={PLUS_D}/> Додати</button>}
                </div>
            </div>

            {(alerts.poor>0||alerts.low>0||alerts.zero>0) && (
                <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                    {alerts.poor>0 && <div className="alert alert-error"   style={{marginBottom:0,flex:1,minWidth:200}}><Icon d={WARN_D}/> {alerts.poor} позицій у поганому стані</div>}
                    {alerts.low>0  && <div className="alert alert-warn"    style={{marginBottom:0,flex:1,minWidth:200}}><Icon d={WARN_D}/> {alerts.low} позицій мало (≤{LOW_QTY})</div>}
                    {alerts.zero>0 && <div className="alert alert-error"   style={{marginBottom:0,flex:1,minWidth:200}}><Icon d={WARN_D}/> {alerts.zero} позицій закінчились</div>}
                </div>
            )}

            <div className="toolbar">
                <div className="search-box"><Icon d={SEARCH_D}/><input placeholder="Назва інвентаря..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
                <select className="filter-select" value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}>
                    <option value="">Усі команди</option>
                    {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                    <option value="__none">Загальний</option>
                </select>
                <select className="filter-select" value={condFilter} onChange={e=>setCondFilter(e.target.value)}>
                    <option value="">Будь-який стан</option>
                    <option value="нове">Нове</option>
                    <option value="задовільний">Задовільний</option>
                    <option value="зношене">Зношене</option>
                </select>
                <span className="text-muted" style={{fontSize:13,marginLeft:'auto'}}>{filtered.length} з {inventory.length}</span>
            </div>

            {loading ? <div className="loader"><div className="loader-spinner"/><div>Завантаження...</div></div> : (
                <div className="table-card"><div className="table-scroll">
                    <table>
                        <thead><tr>
                            <th style={{width:48}}>ID</th><th>Назва</th>
                            <th className="td-center">Кількість</th>
                            <th>Стан</th><th>Команда</th>
                            {isCoach && <th style={{width:110}}></th>}
                        </tr></thead>
                        <tbody>
                            {filtered.map(item => {
                                const isLow  = Number(item.quantity)>0 && Number(item.quantity)<=LOW_QTY;
                                const isZero = Number(item.quantity)===0;
                                return (
                                    <tr key={item.id}>
                                        <td className="td-id">{item.id}</td>
                                        <td className="td-strong">{item.item_name}</td>
                                        <td className="td-center">
                                            <span style={{fontWeight:700,color:isZero?'var(--danger)':isLow?'var(--warning)':'var(--text)',fontSize:15}}>{item.quantity}</span>
                                            {isLow&&!isZero && <span className="badge badge-amber" style={{marginLeft:6,fontSize:10}}>мало</span>}
                                            {isZero && <span className="badge badge-red" style={{marginLeft:6,fontSize:10}}>закінчився</span>}
                                        </td>
                                        <td>
                                            <span className={`badge ${condBadge(item.condition)}`}>
                                                <span className={`cond-dot ${condDot(item.condition)}`}/>
                                                {item.condition||'—'}
                                            </span>
                                        </td>
                                        <td>{item.team_id ? <span className="badge badge-indigo">{tMap[item.team_id]||item.team_id}</span> : <span className="td-muted">Загальний</span>}</td>
                                        {isCoach && <td className="td-actions">
                                            <button className="btn-icon-only" onClick={()=>openEdit(item)}><Icon d={EDIT_D}/></button>
                                            <button className="btn-icon-only danger" onClick={()=>handleDelete(item.id)} style={{marginLeft:4}}><Icon d={DEL_D}/></button>
                                        </td>}
                                    </tr>
                                );
                            })}
                            {!filtered.length && <tr><td colSpan="6" className="td-empty">Інвентар не знайдено</td></tr>}
                        </tbody>
                    </table>
                </div></div>
            )}

            {modal && (
                <Modal title={modal==='create'?'Новий запис':'Редагувати запис'} onClose={closeModal}>
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-error">{error}</div>}
                        <div className="form-group"><label>Назва *</label>
                            <input value={form.item_name} onChange={e=>set('item_name',e.target.value)} required autoFocus placeholder="М'яч, конус, жилетка..."/>
                        </div>
                        <div className="form-row">
                            <div className="form-group"><label>Кількість *</label>
                                <input type="number" min="0" value={form.quantity} onChange={e=>set('quantity',e.target.value)} required/>
                            </div>
                            <div className="form-group"><label>Стан</label>
                                <select value={form.condition} onChange={e=>set('condition',e.target.value)}>
                                    <option value="Нове">Нове</option>
                                    <option value="Задовільний">Задовільний</option>
                                    <option value="Зношене">Зношене</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group"><label>Команда</label>
                            <select value={form.team_id} onChange={e=>set('team_id',e.target.value)}>
                                <option value="">— Загальний інвентар —</option>
                                {teams.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
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
