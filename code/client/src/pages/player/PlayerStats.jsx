import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uk-UA',{day:'2-digit',month:'short',year:'numeric'}) : '—';

export default function PlayerStats() {
    const [stats,   setStats]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/profile/stats')
            .then(r => r.ok ? r.json() : [])
            .then(s => { setStats(s||[]); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const totalGoals  = stats.reduce((s,r)=>s+Number(r.goals||0),0);
    const avgRating   = stats.length ? (stats.filter(r=>r.rating!=null).reduce((s,r)=>s+Number(r.rating),0)/(stats.filter(r=>r.rating!=null).length||1)).toFixed(1) : null;
    const bestGame    = stats.reduce((b,r)=>Number(r.goals)>Number(b?.goals||0)?r:b, null);

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Моя статистика</h1><p className="page-subtitle">Показники по кожному матчу</p></div>
            </div>

            {/* Summary */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
                {[
                    ['Матчів',stats.length,'var(--primary)','var(--primary-light)'],
                    ['Голів',totalGoals,'#2563eb','#eff6ff'],
                    ['Рейтинг',avgRating??'—','#d97706','#fffbeb'],
                    ['Кращий матч',bestGame?`${bestGame.goals} г`:'—','#059669','#ecfdf5'],
                ].map(([l,v,color,bg])=>(
                    <div key={l} style={{background:bg,borderRadius:'var(--r-lg)',padding:'20px',border:'1px solid var(--border)'}}>
                        <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',color,opacity:.7,marginBottom:6}}>{l}</div>
                        <div style={{fontSize:28,fontWeight:800,color,letterSpacing:'-1px'}}>{v}</div>
                    </div>
                ))}
            </div>

            {loading ? <div className="loader"><div className="loader-spinner"/></div> : (
                stats.length === 0
                    ? <div className="empty-state" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)'}}>Статистика відсутня</div>
                    : <div className="table-card"><div className="table-scroll">
                        <table>
                            <thead><tr>
                                <th>Подія</th><th>Дата</th>
                                <th className="td-center">Голи</th>
                                <th className="td-center">Рейтинг</th>
                                <th>Коментар тренера</th>
                            </tr></thead>
                            <tbody>
                                {stats.map(s => (
                                    <tr key={s.id}>
                                        <td className="td-strong">{s.event_title}</td>
                                        <td className="td-nowrap td-muted">{fmtDate(s.event_date)}</td>
                                        <td className="td-center">
                                            <span style={{fontSize:16,fontWeight:800,color:'var(--primary)'}}>{s.goals}</span>
                                        </td>
                                        <td className="td-center">
                                            {s.rating!=null ? (
                                                <div style={{display:'flex',alignItems:'center',gap:8}}>
                                                    <div style={{flex:1,height:5,background:'var(--border)',borderRadius:4,overflow:'hidden',minWidth:60}}>
                                                        <div style={{height:'100%',width:`${(s.rating/10)*100}%`,background:'var(--primary)',borderRadius:4}}/>
                                                    </div>
                                                    <span style={{fontWeight:700,fontSize:13,minWidth:24}}>{s.rating}</span>
                                                </div>
                                            ) : <span className="td-muted">—</span>}
                                        </td>
                                        <td className="td-muted" style={{maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                            {s.coach_comment || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div></div>
            )}
        </div>
    );
}
