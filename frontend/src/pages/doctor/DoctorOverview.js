import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function DoctorOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [statsError, setStatsError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let done = 0;
    const finish = () => { done++; if (done === 2) setLoading(false); };

    api.get('/patients/stats')
      .then(({ data }) => setStats(data))
      .catch(() => setStatsError('Could not load stats.'))
      .finally(finish);

    api.get('/records/recent')
      .then(({ data }) => setRecentRecords(data.records))
      .catch(() => {}) // non-critical, empty list is fine
      .finally(finish);
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ').find(p => !p.startsWith('Dr')) || user?.name?.split(' ')[0];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div className="spinner spinner-dark" />
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div className="page-title">{greeting}, {firstName}</div>
        <div className="page-sub">{today} · {user?.clinic || 'MediRecord Clinic'}</div>
      </div>
      <div className="content">
        {statsError && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{statsError}</div>}

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Total Patients</div>
            <div className="stat-val">{stats?.total ?? '—'}</div>
            <span className="badge badge-green" style={{ marginTop: 6 }}>Registered</span>
          </div>
          <div className="stat-card">
            <div className="stat-label">Stable</div>
            <div className="stat-val">{stats?.stable ?? '—'}</div>
            <span className="badge badge-green" style={{ marginTop: 6 }}>All good</span>
          </div>
          <div className="stat-card">
            <div className="stat-label">Critical</div>
            <div className="stat-val">{stats?.critical ?? '—'}</div>
            <span className={`badge ${stats?.critical > 0 ? 'badge-red' : 'badge-gray'}`} style={{ marginTop: 6 }}>
              {stats?.critical > 0 ? 'Needs attention' : 'None'}
            </span>
          </div>
          <div className="stat-card">
            <div className="stat-label">Records This Month</div>
            <div className="stat-val">{stats?.recordsThisMonth ?? '—'}</div>
            <span className="badge badge-blue" style={{ marginTop: 6 }}>Added</span>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Activity</div>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/doctor/patients')}>View all</button>
            </div>
            <div className="card-body">
              {recentRecords.length === 0 ? (
                <div className="empty-state">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                  <p style={{ fontSize: 13 }}>No records yet. Add your first patient to get started.</p>
                </div>
              ) : recentRecords.map(r => (
                <div key={r._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--slate-border)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.patient?.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--slate-mid)' }}>{r.diagnosis} · {r.visitType}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--slate-mid)', whiteSpace: 'nowrap' }}>
                    {new Date(r.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => navigate(`/doctor/patients/${r.patient?._id}/records`)}
                    style={{ flexShrink: 0 }}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Quick Actions</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="btn btn-primary" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/doctor/patients')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add New Patient
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/doctor/patients')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Search Patients
              </button>
              <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }} onClick={() => navigate('/doctor/appointments')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                View Appointments
              </button>
              {stats?.critical > 0 && (
                <div className="alert alert-error" style={{ margin: 0 }}>
                  ⚠ {stats.critical} patient{stats.critical > 1 ? 's' : ''} marked critical — review soon.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
