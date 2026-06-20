import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Modal from '../../components/Modal';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uk-UA') : '—';
const toInput  = (d) => d ? new Date(d).toISOString().slice(0,10) : '';
const daysAgo  = (d) => d ? Math.max(0,Math.floor((Date.now()-new Date(d))/86400000)) : 0;
const DONE     = ['Одужав','recovered'];

const statusColor = (s) => DONE.includes(s) ? {bg:'var(--success-bg)',color:'var(--success)'} : s==='Спостереження' ? {bg:'var(--warning-bg)',color:'var(--warning)'} : {bg:'var(--danger-bg)',color:'var(--danger)'};

const Icon = ({ d }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
    </svg>
);
const PLUS_D  = 'M12 5v14M5 12h14';
const EDIT_D  = ['M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7','M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'];

export default function PlayerMedical() {
    const [injuries, setInjuries] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [modal,    setModal]    = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form,     setForm]     = useState({ injury_type:'', incident_date:'', expected_recovery_date:'', status:'Лечится', notes:'' });
    const [error,    setError]    = useState('');
    const [success,  setSuccess]  = useState('');

    const load = () => {
        api.get('/profile')
            .then(r => r.ok ? r.json() : r.text().then(t => { throw new Error(t); }))
            .then(p => { setInjuries(p.injuries||[]); setLoading(false); })
            .catch(() => setLoading(false));
    };
    useEffect(() => { load(); }, []);

    const set = (f,v) => setForm(p=>({...p,[f]:v}));

    const openNew  = () => { setForm({injury_type:'',incident_date:new Date().toISOString().slice(0,10),expected_recovery_date:'',status:'Лечится',notes:''}); setEditItem(null); setError(''); setModal(true); };
    const openEdit = (inj) => { setForm({injury_type:inj.injury_type||'',incident_date:toInput(inj.incident_date),expected_recovery_date:toInput(inj.expected_recovery_date),status:inj.status,notes:''}); setEditItem(inj); setError(''); setModal(true); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        const payload = { user_id: null, ...form }; // backend gets user_id from token
        // Use injuries endpoint - player submits for themselves
        const res = editItem
            ? await api.put(`/injuries/${editItem.id}`, { ...form, user_id: editItem.user_id })
            : await api.post('/injuries', form);
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setModal(false); setSuccess(editItem ? 'Запис оновлено' : 'Звернення надіслано тренеру'); load();
        setTimeout(()=>setSuccess(''),3000);
    };

    const active   = injuries.filter(i => !DONE.includes(i.status));
    const resolved = injuries.filter(i =>  DONE.includes(i.status));

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Медпункт</h1>
                    <p className="page-subtitle">Реєстрація травм та звернень до лікаря</p>
                </div>
                <button className="btn btn-primary" onClick={openNew}><Icon d={PLUS_D}/> Нове звернення</button>
            </div>

            {success && <div className="alert alert-success">{success}</div>}

            {/* Active */}
            {active.length > 0 && (
                <div style={{marginBottom:24}}>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--danger)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10}}>
                        Активні травми ({active.length})
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        {active.map(inj => {
                            const sc = statusColor(inj.status);
                            return (
                                <div key={inj.id} style={{background:'var(--card)',border:'1.5px solid var(--danger-border)',borderRadius:'var(--r-lg)',padding:'18px 20px',display:'flex',alignItems:'flex-start',gap:16,boxShadow:'var(--shadow-sm)'}}>
                                    <div style={{width:48,height:48,borderRadius:'var(--r)',background:'var(--danger-bg)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                        <span style={{fontSize:16,fontWeight:800,color:'var(--danger)',lineHeight:1}}>{daysAgo(inj.incident_date)}</span>
                                        <span style={{fontSize:9,color:'var(--danger)',fontWeight:600}}>ДНІВ</span>
                                    </div>
                                    <div style={{flex:1,minWidth:0}}>
                                        <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:4}}>{inj.injury_type}</div>
                                        <div style={{fontSize:13,color:'var(--text-3)',display:'flex',gap:12,flexWrap:'wrap'}}>
                                            <span>Від: {fmtDate(inj.incident_date)}</span>
                                            {inj.expected_recovery_date && <span>Одужання: {fmtDate(inj.expected_recovery_date)}</span>}
                                        </div>
                                    </div>
                                    <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                                        <span style={{padding:'4px 12px',borderRadius:20,fontSize:12,fontWeight:600,background:sc.bg,color:sc.color}}>{inj.status}</span>
                                        <button className="btn-icon-only" onClick={()=>openEdit(inj)}><Icon d={EDIT_D}/></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Info banner if no active */}
            {active.length === 0 && !loading && (
                <div style={{background:'var(--success-bg)',border:'1px solid var(--success-border)',borderRadius:'var(--r-lg)',padding:'20px 24px',marginBottom:24,display:'flex',alignItems:'center',gap:14}}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>
                    </svg>
                    <div>
                        <div style={{fontWeight:700,color:'var(--success)',fontSize:14}}>Ви здорові!</div>
                        <div style={{color:'var(--success)',fontSize:13,opacity:.8}}>Активних травм немає. Якщо щось болить — надішліть звернення.</div>
                    </div>
                </div>
            )}

            {/* Form tips */}
            <div style={{background:'var(--primary-light)',border:'1px solid var(--primary)',borderRadius:'var(--r-lg)',padding:'16px 20px',marginBottom:24}}>
                <div style={{fontSize:13,fontWeight:700,color:'var(--primary)',marginBottom:6}}>Як це працює?</div>
                <ul style={{margin:0,paddingLeft:18,fontSize:13,color:'var(--primary)',opacity:.9,lineHeight:1.8}}>
                    <li>Натисніть "Нове звернення" та заповніть форму</li>
                    <li>Тренер отримає сповіщення та оновить ваш статус</li>
                    <li>Ви можете відслідковувати стан тут або у "Мій огляд"</li>
                </ul>
            </div>

            {/* History */}
            {resolved.length > 0 && (
                <div>
                    <div style={{fontSize:13,fontWeight:700,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:10}}>
                        Історія ({resolved.length})
                    </div>
                    <div className="table-card"><div className="table-scroll">
                        <table>
                            <thead><tr><th>Тип травми</th><th>Дата</th><th>Одужання</th><th>Статус</th></tr></thead>
                            <tbody>
                                {resolved.map(inj => {
                                    const sc = statusColor(inj.status);
                                    return <tr key={inj.id}>
                                        <td className="td-strong">{inj.injury_type}</td>
                                        <td className="td-nowrap">{fmtDate(inj.incident_date)}</td>
                                        <td className="td-muted">{fmtDate(inj.expected_recovery_date)}</td>
                                        <td><span style={{padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:sc.bg,color:sc.color}}>{inj.status}</span></td>
                                    </tr>;
                                })}
                            </tbody>
                        </table>
                    </div></div>
                </div>
            )}

            {modal && (
                <Modal title={editItem?'Редагувати звернення':'Нове звернення до медпункту'} onClose={()=>setModal(false)}>
                    <form onSubmit={handleSubmit}>
                        {error && <div className="alert alert-error">{error}</div>}
                        <div className="form-group">
                            <label>Що болить / тип травми *</label>
                            <input value={form.injury_type} onChange={e=>set('injury_type',e.target.value)} required autoFocus
                                placeholder="Розтягнення, біль у коліні, головний біль..."/>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Дата виникнення *</label>
                                <input type="date" value={form.incident_date} onChange={e=>set('incident_date',e.target.value)} required/>
                            </div>
                            <div className="form-group">
                                <label>Очікуване одужання</label>
                                <input type="date" value={form.expected_recovery_date} onChange={e=>set('expected_recovery_date',e.target.value)}/>
                            </div>
                        </div>
                        {editItem && (
                            <div className="form-group">
                                <label>Статус</label>
                                <select value={form.status} onChange={e=>set('status',e.target.value)}>
                                    <option value="Лечится">Лікується</option>
                                    <option value="Спостереження">Спостереження</option>
                                    <option value="Одужав">Одужав</option>
                                </select>
                            </div>
                        )}
                        <div style={{background:'var(--warning-bg)',border:'1px solid var(--warning-border)',borderRadius:'var(--r)',padding:'10px 12px',fontSize:12,color:'var(--warning)',marginBottom:16}}>
                            Після подачі звернення тренер/тренерський штаб отримає доступ до інформації.
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={()=>setModal(false)}>Скасувати</button>
                            <button type="submit" className="btn btn-primary">{editItem?'Зберегти':'Надіслати звернення'}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}
