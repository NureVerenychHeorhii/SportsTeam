import { useState, useEffect, useMemo } from 'react';
import { api } from '../../utils/api';

const fmtDT = (d) => d ? new Date(d).toLocaleString('uk-UA',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const isUpcoming = (d) => d && new Date(d) >= new Date();
const daysUntil  = (d) => d ? Math.ceil((new Date(d)-Date.now())/86400000) : null;

const Icon = ({ d }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
    </svg>
);
const SRCH_D = 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z';

export default function PlayerEvents() {
    const [events,  setEvents]  = useState([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState('');
    const [filter,  setFilter]  = useState('upcoming');

    useEffect(() => {
        api.get('/profile/events')
            .then(r => r.ok ? r.json() : [])
            .then(ev => { setEvents(ev||[]); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        let r = [...events];
        if (search) r = r.filter(e => `${e.title} ${e.location||''}`.toLowerCase().includes(search.toLowerCase()));
        if (filter==='upcoming') r = r.filter(e => isUpcoming(e.event_date));
        if (filter==='past')     r = r.filter(e => !isUpcoming(e.event_date));
        return r.sort((a,b)=>new Date(a.event_date)-new Date(b.event_date));
    }, [events, search, filter]);

    const upcoming = events.filter(e=>isUpcoming(e.event_date));
    const next = upcoming[0];

    return (
        <div className="page">
            <div className="page-header">
                <div><h1 className="page-title">Мої події</h1><p className="page-subtitle">Тренування та матчі команди</p></div>
            </div>

            {/* Next event banner */}
            {next && (
                <div style={{background:'linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%)',borderRadius:'var(--r-xl)',padding:'24px 28px',marginBottom:24,color:'#fff',display:'flex',alignItems:'center',gap:20}}>
                    <div style={{background:'rgba(255,255,255,.15)',borderRadius:'var(--r-lg)',padding:'12px 16px',textAlign:'center',flexShrink:0}}>
                        <div style={{fontSize:28,fontWeight:800,lineHeight:1}}>{daysUntil(next.event_date)}</div>
                        <div style={{fontSize:11,fontWeight:600,opacity:.8}}>ДНІВ</div>
                    </div>
                    <div style={{flex:1}}>
                        <div style={{fontSize:11,fontWeight:600,opacity:.7,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:4}}>Наступна подія</div>
                        <div style={{fontSize:20,fontWeight:800,marginBottom:4}}>{next.title}</div>
                        <div style={{fontSize:13,opacity:.8}}>{fmtDT(next.event_date)} · {next.location||'Локація уточнюється'}</div>
                    </div>
                    {next.team_name && <span style={{padding:'6px 16px',background:'rgba(255,255,255,.2)',borderRadius:20,fontSize:12,fontWeight:700}}>{next.team_name}</span>}
                </div>
            )}

            {/* Tabs + search */}
            <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
                <div style={{display:'flex',gap:4,background:'var(--card)',padding:4,borderRadius:'var(--r)',border:'1px solid var(--border)'}}>
                    {[['upcoming',`Майбутні (${upcoming.length})`],['past','Минулі'],['all','Всі']].map(([v,l])=>(
                        <button key={v} onClick={()=>setFilter(v)} style={{
                            padding:'6px 14px',borderRadius:'var(--r-sm)',border:'none',cursor:'pointer',
                            fontWeight:600,fontSize:12.5,whiteSpace:'nowrap',
                            background:filter===v?'var(--primary)':'transparent',
                            color:filter===v?'#fff':'var(--text-3)',transition:'all .13s'}}>
                            {l}
                        </button>
                    ))}
                </div>
                <div className="search-box" style={{flex:1,maxWidth:300}}>
                    <Icon d={SRCH_D}/>
                    <input placeholder="Пошук..." value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
            </div>

            {loading ? <div className="loader"><div className="loader-spinner"/></div> : (
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {filtered.map(e => {
                        const up   = isUpcoming(e.event_date);
                        const days = daysUntil(e.event_date);
                        return (
                            <div key={e.id} style={{
                                background:'var(--card)',border:'1px solid '+(up?'var(--border)':'var(--border-2)'),
                                borderRadius:'var(--r-lg)',padding:'16px 20px',
                                display:'flex',alignItems:'center',gap:16,
                                boxShadow:up?'var(--shadow-sm)':'none',
                                opacity:up?1:.75,
                            }}>
                                <div style={{
                                    width:52,height:52,flexShrink:0,borderRadius:'var(--r)',
                                    background:up?'var(--primary-light)':'#f1f5f9',
                                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                                }}>
                                    <span style={{fontSize:16,fontWeight:800,lineHeight:1,color:up?'var(--primary)':'var(--text-3)'}}>
                                        {up&&days>=0?days:'✓'}
                                    </span>
                                    {up && days>=0 && <span style={{fontSize:9,fontWeight:600,color:'var(--primary)'}}>днів</span>}
                                </div>
                                <div style={{flex:1,minWidth:0}}>
                                    <div style={{fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:3}}>{e.title}</div>
                                    <div style={{fontSize:13,color:'var(--text-3)',display:'flex',gap:14,flexWrap:'wrap'}}>
                                        <span>{fmtDT(e.event_date)}</span>
                                        {e.location && <span>📍 {e.location}</span>}
                                    </div>
                                    {e.description && <div style={{fontSize:12,color:'var(--text-4)',marginTop:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:500}}>{e.description}</div>}
                                </div>
                                <div style={{display:'flex',gap:8,flexShrink:0}}>
                                    {e.team_name && <span className="badge badge-indigo">{e.team_name}</span>}
                                    <span className={`badge ${up?'badge-green':'badge-slate'}`}>{up?'Майбутня':'Минула'}</span>
                                </div>
                            </div>
                        );
                    })}
                    {!filtered.length && <div className="empty-state" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r-lg)'}}>Подій не знайдено</div>}
                </div>
            )}
        </div>
    );
}
