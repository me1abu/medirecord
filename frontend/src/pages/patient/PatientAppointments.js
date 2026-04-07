import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function PatientAppointments() {
  const { patientProfileId } = useAuth();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patientProfileId) {
      setLoading(false);
      setError('No patient profile linked. Ask your doctor to link your account.');
      return;
    }
    api.get(`/records/patient/${patientProfileId}`)
      .then(({ data }) => {
        const fu = data.records
          .filter(r => r.followUpDate)
          .map(r => ({
            date: r.followUpDate,
            notes: r.followUpNotes,
            diagnosis: r.diagnosis,
            visitType: r.visitType,
            doctorName: r.doctor?.name,
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // most recent first within each section
        setFollowUps(fu);
      })
      .catch(() => setError('Could not load appointments.'))
      .finally(() => setLoading(false));
  }, [patientProfileId]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcoming = followUps
    .filter(f => new Date(f.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // upcoming: soonest first
  const past = followUps.filter(f => new Date(f.date) < today); // past: most recent first

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div className="spinner spinner-dark" />
    </div>
  );

  const ApptCard = ({ f }) => {
    const d = new Date(f.date);
    const isToday = d.toDateString() === now.toDateString();
    const isTomorrow = d.toDateString() === new Date(today.getTime() + 86400000).toDateString();
    const isPast = d < today;

    return (
      <div
        className="visit-item"
        style={{
          borderLeftColor: isToday ? 'var(--blue)' : isPast ? 'var(--slate-mid)' : 'var(--teal-mid)',
          marginBottom: 10,
          opacity: isPast ? 0.8 : 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="visit-date">
              {d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {isToday && <span className="badge badge-blue" style={{ marginLeft: 8 }}>Today</span>}
              {isTomorrow && <span className="badge badge-green" style={{ marginLeft: 8 }}>Tomorrow</span>}
            </div>
            <div className="visit-diag">Follow-up: {f.diagnosis}</div>
            {f.visitType && <div className="visit-note">{f.visitType}</div>}
            {f.notes && <div className="visit-note" style={{ marginTop: 2 }}>{f.notes}</div>}
            {f.doctorName && (
              <div style={{ fontSize: 11, color: 'var(--slate-mid)', marginTop: 4 }}>
                Dr. {f.doctorName}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">Appointments</div>
        <div className="page-sub">Follow-up appointments scheduled by your doctor</div>
      </div>
      <div className="content">
        {error && <div className="alert alert-error">{error}</div>}

        {followUps.length === 0 && !error ? (
          <div className="card">
            <div className="card-body">
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p style={{ fontSize: 13 }}>No follow-up appointments scheduled yet.</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                  <div className="card-title">Upcoming ({upcoming.length})</div>
                  {upcoming.some(f => new Date(f.date).toDateString() === now.toDateString()) && (
                    <span className="badge badge-blue">Appointment today</span>
                  )}
                </div>
                <div className="card-body">
                  {upcoming.map((f, i) => <ApptCard key={i} f={f} />)}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Past ({past.length})</div>
                </div>
                <div className="card-body">
                  {past.map((f, i) => <ApptCard key={i} f={f} />)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
