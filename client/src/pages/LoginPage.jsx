import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

const ShieldIcon = () => (
    <svg width='28' height='28' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
        <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/>
    </svg>
);

export default function LoginPage() {
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try {
            const res  = await api.post('/auth/login', { email, password });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Помилка входу'); }
            else { login(data.user, data.token); navigate('/dashboard'); }
        } catch { setError('Не вдалось підключитись до сервера'); }
        finally  { setLoading(false); }
    };

    return (
        <div className='login-page'>
            <div className='login-card'>
                <div className='login-logo-wrap'>
                    <div className='login-logo'><ShieldIcon /></div>
                    <h1 className='login-title'>SportManager</h1>
                    <p className='login-sub'>Система управління спортивним клубом</p>
                </div>
                <form onSubmit={handleSubmit}>
                    {error && <div className='alert alert-error'>{error}</div>}
                    <div className='form-group'>
                        <label>Email</label>
                        <input type='email' value={email} onChange={e=>setEmail(e.target.value)} placeholder='admin@club.com' required autoFocus />
                    </div>
                    <div className='form-group'>
                        <label>Пароль</label>
                        <input type='password' value={password} onChange={e=>setPassword(e.target.value)} placeholder='••••••••' required />
                    </div>
                    <button type='submit' className='btn btn-primary btn-full' disabled={loading} style={{marginTop:8}}>
                        {loading ? 'Вхід...' : 'Увійти'}
                    </button>
                </form>
                <p className='login-hint'>За замовчуванням: admin@club.com / admin123</p>
            </div>
        </div>
    );
}
