import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/records/followups')
      .then(({ data }) => setRecords(data.records))
      .catch(() => setError('Could not load appointments.'))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  // Normalize to start of today for date-only comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcoming = records.filter(r => new Date(r.followUpDate) >= today);
  const past = records.filter(r => new Date(r.followUpDate) < today);

  const ApptRow = ({ r }) => {
    const d = new Date(r.followUpDate);
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = d.toDateString() === new Date(today.getTime() + 86400000).toDateString();

    let dateLabel = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    let subLabel = d.toLocaleDateString('en-IN', { weekday: 'short' });
    if (isToday) subLabel = 'Today';
    else if (isTomorrow) subLabel = 'Tomorrow';

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: '1px solid var(--slate-border)' }}>
        <div style={{ minWidth: 64, textAlign: 'center', background: isToday ? 'var(--teal-light)' : 'var(--slate-light)', borderRadius: 8, padding: '6px 8px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? 'var(--teal)' : 'var(--slate-mid)' }}>{dateLabel}</div>
          <div style={{ fontSize: 11, color: isToday ? 'var(--teal)' : 'var(--slate-mid)', fontWeight: isToday ? 600 : 400 }}>{subLabel}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--slate)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {r.patient?.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--slate-mid)' }}>
            Follow-up: {r.diagnosis}
            {r.visitType && ` · ${r.visitType}`}
          </div>
          {r.followUpNotes && (
            <div style={{ fontSize: 11, color: 'var(--slate-mid)', marginTop: 2, fontStyle: 'italic' }}>
              {r.followUpNotes}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isToday && <span className="badge badge-blue">Today</span>}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/doctor/patients/${r.patient?._id}/records`)}
          >
            View
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">Appointments</div>
        <div className="page-sub">Follow-up appointments derived from visit records</div>
      </div>
      <div className="content">
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner spinner-dark" />
          </div>
        ) : records.length === 0 ? (
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p style={{ fontSize: 13 }}>
                  No follow-up appointments yet. When you add a visit record with a follow-up date, it will appear here.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <div className="card-title">Upcoming ({upcoming.length})</div>
                {upcoming.filter(r => new Date(r.followUpDate).toDateString() === now.toDateString()).length > 0 && (
                  <span className="badge badge-blue">
                    {upcoming.filter(r => new Date(r.followUpDate).toDateString() === now.toDateString()).length} today
                  </span>
                )}
              </div>
              <div className="card-body">
                {upcoming.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--slate-mid)', padding: '0.5rem 0' }}>No upcoming appointments.</div>
                ) : upcoming.map(r => <ApptRow key={r._id} r={r} />)}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Past ({past.length})</div>
              </div>
              <div className="card-body">
                {past.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--slate-mid)', padding: '0.5rem 0' }}>No past appointments.</div>
                ) : past.map(r => <ApptRow key={r._id} r={r} />)}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
