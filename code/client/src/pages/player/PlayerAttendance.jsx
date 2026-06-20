import { useState, useEffect } from 'react';
import { api } from '../../utils/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('uk-UA',{day:'2-digit',month:'long',year:'numeric'}) : '—';

const STATUS_CFG = {
    present:{ label:'Присутній', bg:'var(--success-bg)', color:'var(--success)', icon:'✓' },
    absent: { label:'Відсутній', bg:'var(--danger-bg)',  color:'var(--danger)',  icon:'✗' },
    late:   { label:'Запізнився',bg:'var(--warning-bg)', color:'var(--warning)', icon:'~' },
};

export default function PlayerAttendance() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/profile/attendance')
            .then(r => r.ok ? r.json() : [])
            .then(a => { setRecords(a||[]); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const total   = records.length;
    const present = records.filter(r=>r.status==='present').length;
    const absent  = records.filter(r=>r.status==='absent').length;
    const late    = records.filter(r=>r.status==='late').length;
    const pct     = total > 0 ? Math.round(100*present/total) : null;

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Моя відвідуваність</h1><p className="page-subtitle">Історія участі в подіях</p></div>
            </div>

            {/* Summary */}
            {total > 0 && (
                <div style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-xl)',padding:'24px',marginBottom:24,boxShadow:'var(--shadow-sm)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:24,flexWrap:'wrap'}}>
                        <div style={{flex:1,minWidth:200}}>
                            <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                                <span style={{fontSize:14,fontWeight:700}}>Загальна явка</span>
                                <span style={{fontSize:20,fontWeight:800,color:pct>=80?'var(--success)':pct>=50?'var(--warning)':'var(--danger)'}}>{pct}%</span>
                            </div>
                            <div style={{height:10,background:'var(--border-2)',borderRadius:6,overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${pct}%`,background:pct>=80?'var(--success)':pct>=50?'var(--warning)':'var(--danger)',borderRadius:6,transition:'width .6s ease'}}/>
                            </div>
                        </div>
                        <div style={{display:'flex',gap:20}}>
                            {[['Присутній',present,'var(--success)'],['Відсутній',absent,'var(--danger)'],['Запізнився',late,'var(--warning)']].map(([l,v,c])=>(
                                <div key={l} style={{textAlign:'center'}}>
                                    <div style={{fontSize:24,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
                                    <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{l}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {loading ? <div className="loader"><div className="loader-spinner"/></div> : (
                records.length === 0
                    ? <div className="empty-state" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)'}}>Записів відвідуваності немає</div>
                    : <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        {records.map(r => {
                            const cfg = STATUS_CFG[r.status]||{label:r.status,bg:'#f1f5f9',color:'var(--text-3)',icon:'?'};
                            return (
                                <div key={r.id} style={{
                                    background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)',
                                    padding:'14px 20px',display:'flex',alignItems:'center',gap:14,
                                    boxShadow:'var(--shadow-xs)',
                                }}>
                                    <div style={{
                                        width:36,height:36,borderRadius:'50%',flexShrink:0,
                                        background:cfg.bg,color:cfg.color,
                                        display:'flex',alignItems:'center',justifyContent:'center',
                                        fontSize:16,fontWeight:800,
                                    }}>{cfg.icon}</div>
                                    <div style={{flex:1}}>
                                        <div style={{fontSize:14,fontWeight:600,color:'var(--text)'}}>{r.title}</div>
                                        <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>
                                            {fmtDate(r.event_date)}{r.location ? ` · ${r.location}` : ''}
                                        </div>
                                    </div>
                                    <span style={{padding:'4px 14px',borderRadius:20,fontSize:12,fontWeight:600,background:cfg.bg,color:cfg.color,whiteSpace:'nowrap'}}>{cfg.label}</span>
                                </div>
                            );
                        })}
                    </div>
            )}
        </div>
    );
}
