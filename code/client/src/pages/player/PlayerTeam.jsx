import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function PlayerTeam() {
    const [team,    setTeam]    = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/profile/team').then(r=>r.ok?r.json():[]),
            api.get('/profile').then(r=>r.ok?r.json():{}),
        ]).then(([t,p])=>{ setTeam(t||[]); setProfile(p||{}); setLoading(false); })
          .catch(()=>setLoading(false));
    }, []);

    const coaches = team.filter(m=>m.role==='coach');
    const players = team.filter(m=>m.role==='player');
    const u = profile?.user;

    if (loading) return <div className="page"><div className="loader"><div className="loader-spinner"/></div></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Моя команда</h1>
                    <p className="page-subtitle">
                        {u?.team_name ? `${u.team_name} · ${u.team_category}` : 'Ви не приєднані до команди'}
                    </p>
                </div>
                {u?.team_name && (
                    <div style={{display:'flex',gap:10}}>
                        <span className="badge badge-indigo" style={{fontSize:13,padding:'6px 16px'}}>{u.team_name}</span>
                        <span className="badge badge-slate"  style={{fontSize:13,padding:'6px 16px'}}>{u.team_category}</span>
                    </div>
                )}
            </div>

            {!u?.team_name && (
                <div className="alert alert-warn">Ви ще не призначені до жодної команди. Зверніться до тренера.</div>
            )}

            {/* Me card */}
            <div style={{background:'linear-gradient(135deg, var(--primary-light) 0%, #e0e7ff 100%)',border:'1.5px solid var(--primary)',borderRadius:'var(--r-xl)',padding:'20px 24px',marginBottom:24,display:'flex',alignItems:'center',gap:16}}>
                <div style={{width:52,height:52,borderRadius:'50%',background:'var(--primary)',color:'#fff',fontSize:18,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',textTransform:'uppercase'}}>
                    {u?.first_name?.[0]}{u?.last_name?.[0]}
                </div>
                <div>
                    <div style={{fontSize:16,fontWeight:700,color:'var(--text)'}}>{u?.first_name} {u?.last_name} <span style={{fontSize:13,color:'var(--primary)',fontWeight:600}}>(Ви)</span></div>
                    <div style={{fontSize:13,color:'var(--text-3)'}}>{u?.email} · Гравець</div>
                </div>
            </div>

            {/* Coaches */}
            {coaches.length > 0 && (
                <div style={{marginBottom:24}}>
                    <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--success)',marginBottom:12}}>Тренерський штаб ({coaches.length})</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
                        {coaches.map(m=>(
                            <div key={m.id} style={{background:'var(--card)',border:'1px solid var(--success-border)',borderRadius:'var(--r-lg)',padding:'16px',display:'flex',alignItems:'center',gap:14,boxShadow:'var(--shadow-sm)'}}>
                                <div style={{width:44,height:44,borderRadius:'50%',background:'var(--success-bg)',color:'var(--success)',fontSize:15,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    {m.first_name?.[0]}{m.last_name?.[0]}
                                </div>
                                <div>
                                    <div style={{fontWeight:700,fontSize:14}}>{m.first_name} {m.last_name}</div>
                                    <div style={{fontSize:12,color:'var(--text-3)'}}>{m.email}</div>
                                    <span style={{fontSize:11,fontWeight:700,color:'var(--success)'}}>ТРЕНЕР</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Players */}
            {players.length > 0 && (
                <div>
                    <div style={{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--info)',marginBottom:12}}>Гравці ({players.length+1})</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:10}}>
                        {players.map(m=>(
                            <div key={m.id} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',padding:'14px 16px',display:'flex',alignItems:'center',gap:12,boxShadow:'var(--shadow-xs)'}}>
                                <div style={{width:38,height:38,borderRadius:'50%',background:'#eff6ff',color:'var(--info)',fontSize:13,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                                    {m.first_name?.[0]}{m.last_name?.[0]}
                                </div>
                                <div style={{minWidth:0}}>
                                    <div style={{fontWeight:600,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.first_name} {m.last_name}</div>
                                    <div style={{fontSize:11,color:'var(--text-4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.email}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {team.length === 0 && (
                <div className="empty-state" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)'}}>
                    Команда порожня або не призначена
                </div>
            )}
        </div>
    );
}
