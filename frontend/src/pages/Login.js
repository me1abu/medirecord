import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('doctor');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'doctor' ? '/doctor' : '/patient');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a2e25 0%, #0F6E56 60%, #1D9E75 100%)', padding: '2rem' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 420 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--teal)', marginBottom: 4 }}>MediRecord</div>
        <div style={{ fontSize: 13, color: 'var(--slate-mid)', marginBottom: '2rem' }}>Secure patient records management</div>

        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
          {['doctor', 'patient'].map(r => (
            <button key={r} onClick={() => setRole(r)} style={{ flex: 1, padding: '10px', border: `1.5px solid ${role === r ? 'var(--teal)' : 'var(--slate-border)'}`, borderRadius: 8, background: role === r ? 'var(--teal-light)' : 'none', color: role === r ? 'var(--teal)' : 'var(--slate-mid)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 500, fontSize: 13, textTransform: 'capitalize' }}>
              {r}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder={role === 'doctor' ? 'doctor@clinic.com' : 'patient@email.com'} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Your password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 8 }}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: 'var(--slate-mid)' }}>
          Don't have an account? <Link to="/register" style={{ color: 'var(--teal)', fontWeight: 600 }}>Register</Link>
        </div>
      </div>
    </div>
  );
}
