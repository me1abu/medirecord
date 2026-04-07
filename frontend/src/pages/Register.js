import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('doctor');
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: '', clinic: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      navigate(user.role === 'doctor' ? '/doctor' : '/patient');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a2e25 0%, #0F6E56 60%, #1D9E75 100%)', padding: '2rem' }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 440 }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, color: 'var(--teal)', marginBottom: 4 }}>MediRecord</div>
        <div style={{ fontSize: 13, color: 'var(--slate-mid)', marginBottom: '2rem' }}>Create your account</div>

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
            <label className="form-label">Full Name</label>
            <input className="form-input" placeholder={role === 'doctor' ? 'Dr. Ananya Sharma' : 'Rajesh Kumar'} value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="Minimum 6 characters" value={form.password} onChange={set('password')} required />
          </div>

          {role === 'doctor' && (
            <div className="form-row" style={{ marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Specialization</label>
                <input className="form-input" placeholder="General Physician" value={form.specialization} onChange={set('specialization')} />
              </div>
              <div>
                <label className="form-label">Clinic / Hospital</label>
                <input className="form-input" placeholder="Apollo Clinic" value={form.clinic} onChange={set('clinic')} />
              </div>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 8 }}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: 13, color: 'var(--slate-mid)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--teal)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
