import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function PlayerProfile() {
    const [data,    setData]    = useState(null);
    const [loading, setLoading] = useState(true);
    const [form,    setForm]    = useState({ first_name:'', last_name:'', password:'', password2:'' });
    const [saving,  setSaving]  = useState(false);
    const [error,   setError]   = useState('');
    const [success, setSuccess] = useState('');
    const { user, login } = useAuth();

    const load = () => {
        api.get('/profile')
            .then(r => r.ok ? r.json() : {})
            .then(d => {
                setData(d||{});
                setForm(f=>({...f, first_name:d?.user?.first_name||'', last_name:d?.user?.last_name||''}));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };
    useEffect(()=>{ load(); },[]);

    const set = (f,v) => setForm(p=>({...p,[f]:v}));

    const handleSave = async (e) => {
        e.preventDefault(); setError(''); setSuccess('');
        if (form.password && form.password !== form.password2) { setError('Паролі не збігаються'); return; }
        if (form.password && form.password.length < 6) { setError('Пароль мінімум 6 символів'); return; }
        setSaving(true);
        const payload = { first_name: form.first_name, last_name: form.last_name };
        if (form.password) payload.password = form.password;
        const res  = await api.put('/profile', payload);
        const resp = await res.json();
        setSaving(false);
        if (!res.ok) { setError(resp.error); return; }
        // Update auth context
        const token = localStorage.getItem('token');
        login({ ...user, first_name: resp.first_name, last_name: resp.last_name }, token);
        setSuccess('Профіль оновлено!');
        setForm(f=>({...f, password:'', password2:''}));
        load();
        setTimeout(()=>setSuccess(''),3000);
    };

    if (loading) return <div className="page"><div className="loader"><div className="loader-spinner"/></div></div>;

    const { user: u, stats: s, attendance: a } = data||{};
    const attPct = a?.total > 0 ? Math.round(100*a.present/a.total) : null;

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Мій профіль</h1><p className="page-subtitle">Особиста інформація та налаштування</p></div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:24,alignItems:'start'}}>

                {/* Left — info card */}
                <div style={{display:'flex',flexDirection:'column',gap:16}}>

                    {/* Avatar + name */}
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',padding:'28px 20px',textAlign:'center',boxShadow:'var(--shadow-sm)'}}>
                        <div style={{width:72,height:72,borderRadius:'50%',background:'var(--primary)',color:'#fff',fontSize:24,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',textTransform:'uppercase'}}>
                            {u?.first_name?.[0]}{u?.last_name?.[0]}
                        </div>
                        <div style={{fontSize:18,fontWeight:700}}>{u?.first_name} {u?.last_name}</div>
                        <div style={{fontSize:13,color:'var(--text-3)',marginTop:4}}>{u?.email}</div>
                        <div style={{marginTop:10}}>
                            <span style={{padding:'4px 14px',borderRadius:20,fontSize:12,fontWeight:600,background:'var(--info-bg)',color:'var(--info)'}}>Гравець</span>
                        </div>
                        {u?.team_name && (
                            <div style={{marginTop:12,padding:'8px 12px',background:'var(--primary-light)',borderRadius:'var(--r)',fontSize:13,fontWeight:600,color:'var(--primary)'}}>
                                {u.team_name} · {u.team_category}
                            </div>
                        )}
                    </div>

                    {/* Stats summary */}
                    <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:20,boxShadow:'var(--shadow-sm)'}}>
                        <div style={{fontSize:13,fontWeight:700,marginBottom:14,color:'var(--text-2)'}}>Моя статистика</div>
                        {[
                            ['Матчів зіграно', s?.games_played ?? 0],
                            ['Голів',          s?.total_goals  ?? 0],
                            ['Середній рейтинг', s?.avg_rating  ?? '—'],
                        ].map(([l,v]) => (
                            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border-2)',fontSize:13}}>
                                <span style={{color:'var(--text-3)'}}>{l}</span>
                                <span style={{fontWeight:700,color:'var(--text)'}}>{v}</span>
                            </div>
                        ))}
                        <div style={{marginTop:12}}>
                            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:6}}>
                                <span style={{color:'var(--text-3)'}}>Явка</span>
                                <span style={{fontWeight:700}}>{attPct != null ? `${attPct}%` : '—'}</span>
                            </div>
                            {attPct != null && (
                                <div style={{height:6,background:'var(--border-2)',borderRadius:4,overflow:'hidden'}}>
                                    <div style={{height:'100%',width:`${attPct}%`,background:attPct>=80?'var(--success)':attPct>=50?'var(--warning)':'var(--danger)',borderRadius:4}}/>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right — edit form */}
                <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',boxShadow:'var(--shadow-sm)',overflow:'hidden'}}>
                    <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border-2)'}}>
                        <div style={{fontSize:15,fontWeight:700}}>Редагувати профіль</div>
                        <div style={{fontSize:13,color:'var(--text-3)',marginTop:2}}>Змінити ім'я та пароль</div>
                    </div>
                    <form onSubmit={handleSave} style={{padding:24}}>
                        {error   && <div className="alert alert-error"  >{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',color:'var(--text-3)',marginBottom:10}}>Особисті дані</div>
                        <div className="form-row">
                            <div className="form-group"><label>Ім'я *</label><input value={form.first_name} onChange={e=>set('first_name',e.target.value)} required/></div>
                            <div className="form-group"><label>Прізвище *</label><input value={form.last_name} onChange={e=>set('last_name',e.target.value)} required/></div>
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input value={u?.email||''} disabled style={{background:'var(--bg)',cursor:'not-allowed',color:'var(--text-3)'}}/>
                            <span style={{fontSize:11,color:'var(--text-4)',marginTop:3}}>Email змінює адміністратор</span>
                        </div>

                        <div className="divider"/>
                        <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',color:'var(--text-3)',marginBottom:10}}>Зміна пароля</div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Новий пароль</label>
                                <input type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="мін. 6 символів"/>
                            </div>
                            <div className="form-group">
                                <label>Підтвердження пароля</label>
                                <input type="password" value={form.password2} onChange={e=>set('password2',e.target.value)} placeholder="повторіть пароль"/>
                            </div>
                        </div>
                        {form.password && form.password2 && form.password!==form.password2 && (
                            <div style={{fontSize:12,color:'var(--danger)',marginTop:-8,marginBottom:12}}>Паролі не збігаються</div>
                        )}

                        <div className="form-actions" style={{paddingTop:16}}>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving?'Збереження...':'Зберегти зміни'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
