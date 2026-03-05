import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts';
import { getMsg } from '../api';
import { ErrAlert, Spinner } from '../components/common';
import { RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]     = useState({ email:'', password:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const set = f => e => setForm(p => ({...p, [f]: e.target.value}));

  const submit = async e => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Email and password are required'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      setError(getMsg(err, 'Invalid credentials'));
    } finally { setLoading(false); }
  };

  return (
    <div className="login-page">
      <div className="login-blob" /><div className="login-blob2" />
      <div className="login-card">
        <div className="login-logo">💊</div>
        <h1 style={{textAlign:'center',fontSize:'1.45rem',marginBottom:4}}>EMR Inventory</h1>
        <p style={{textAlign:'center',color:'var(--text-3)',fontSize:'.845rem',marginBottom:28}}>
          Device &amp; SIM Management Portal
        </p>
        <ErrAlert message={error} />
        <form onSubmit={submit}>
          <div className="fg">
            <label className="label">Email address</label>
            <input className="input" type="email" placeholder="you@org.org"
              value={form.email} onChange={set('email')} autoFocus autoComplete="email" />
          </div>
          <div className="fg">
            <label className="label">Password</label>
            <div className="pw-wrap">
              <input className="input" type={showPw?'text':'password'} placeholder="••••••••"
                value={form.password} onChange={set('password')} autoComplete="current-password" />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(s=>!s)}>
                {showPw ? <RiEyeOffLine size={15}/> : <RiEyeLine size={15}/>}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{width:'100%',justifyContent:'center',marginTop:6,padding:'10px'}}>
            {loading ? <><Spinner size={14}/> Signing in…</> : 'Sign in'}
          </button>
        </form>
        <p style={{textAlign:'center',marginTop:22,fontSize:'.75rem',color:'var(--text-3)'}}>
          Contact your administrator to get access.
        </p>
      </div>
    </div>
  );
}
