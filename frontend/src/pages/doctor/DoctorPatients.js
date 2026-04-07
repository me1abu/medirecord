import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?';
const statusBadge = (s) => ({ stable: 'badge-green', monitor: 'badge-amber', critical: 'badge-red' }[s] || 'badge-gray');
const avatarStyle = (s) => ({
  monitor: { background: 'var(--amber-light)', color: 'var(--amber)' },
  critical: { background: 'var(--red-light)', color: 'var(--red)' },
}[s] || {});

const EMPTY_FORM = {
  name: '', dob: '', gender: 'Male', phone: '',
  email: '', bloodGroup: 'Unknown', allergies: '', existingConditions: '', address: '',
};

export default function DoctorPatients() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const debounceRef = useRef(null);

  // Debounce search — wait 350ms after user stops typing
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(searchInput), 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/patients', {
        params: debouncedSearch ? { search: debouncedSearch } : {},
      });
      setPatients(data.patients);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/patients', {
        ...form,
        allergies: form.allergies.split(',').map(s => s.trim()).filter(Boolean),
        existingConditions: form.existingConditions.split(',').map(s => s.trim()).filter(Boolean),
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      fetchPatients();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add patient.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/patients/${id}`);
      setDeleteId(null);
      fetchPatients();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">Patients</div>
        <div className="page-sub">{patients.length} patient{patients.length !== 1 ? 's' : ''} found</div>
      </div>
      <div className="content">
        <div className="search-bar">
          <input
            className="search-input"
            placeholder="Search by name, condition, phone..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => { setError(''); setShowModal(true); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Patient
          </button>
        </div>

        <div className="card">
          <div className="card-body">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}><div className="spinner spinner-dark" /></div>
            ) : patients.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                </svg>
                <p style={{ fontSize: 13 }}>
                  {debouncedSearch ? `No patients matching "${debouncedSearch}".` : 'No patients yet. Add your first patient.'}
                </p>
              </div>
            ) : patients.map(p => (
              <div key={p._id} className="patient-row">
                <div className="avatar" style={avatarStyle(p.status)}>{initials(p.name)}</div>
                <div className="patient-info">
                  <div className="patient-name">{p.name}</div>
                  <div className="patient-meta">
                    {p.age}y · {p.gender} · {p.bloodGroup} · {p.existingConditions?.join(', ') || 'No conditions listed'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--slate-mid)', marginTop: 2 }}>
                    {p.phone}
                    {p.userAccount
                      ? <span style={{ color: 'var(--teal)', marginLeft: 8 }}>● Portal linked</span>
                      : <span style={{ color: 'var(--slate-mid)', marginLeft: 8 }}>○ No portal</span>
                    }
                    {' · '}Last visit: {p.lastVisit
                      ? new Date(p.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Never'}
                  </div>
                </div>
                <span className={`badge ${statusBadge(p.status)}`}>{p.status}</span>
                <div className="patient-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/doctor/patients/${p._id}/records`)}>
                    View Records
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADD PATIENT MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add New Patient</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-row" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" placeholder="Rajesh Kumar" value={form.name} onChange={set('name')} required />
                  </div>
                  <div>
                    <label className="form-label">Date of Birth *</label>
                    <input className="form-input" type="date" value={form.dob} onChange={set('dob')} required />
                  </div>
                </div>
                <div className="form-row" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Gender *</label>
                    <select className="form-input" value={form.gender} onChange={set('gender')}>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Blood Group</label>
                    <select className="form-input" value={form.bloodGroup} onChange={set('bloodGroup')}>
                      {['Unknown','A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Phone *</label>
                    <input className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} required />
                  </div>
                  <div>
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="patient@email.com" value={form.email} onChange={set('email')} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Known Allergies</label>
                  <input className="form-input" placeholder="Penicillin, Aspirin (comma separated)" value={form.allergies} onChange={set('allergies')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Existing Conditions</label>
                  <input className="form-input" placeholder="Hypertension, Diabetes (comma separated)" value={form.existingConditions} onChange={set('existingConditions')} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="form-input" rows={2} placeholder="Patient's home address" value={form.address} onChange={set('address')} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <span className="spinner" /> : 'Save Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header"><div className="modal-title">Delete Patient?</div></div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--slate-mid)' }}>
                This will permanently delete the patient and <strong>all their visit records</strong>. This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
