import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function PatientPrescriptions() {
  const { patientProfileId } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
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
        // Flatten all prescriptions across all records, preserving visit context
        const allRx = data.records.flatMap(r =>
          (r.prescriptions || []).map(rx => ({
            ...rx,
            visitDate: r.visitDate,
            diagnosis: r.diagnosis,
            doctorName: r.doctor?.name,
          }))
        );
        setPrescriptions(allRx);
      })
      .catch(() => setError('Could not load prescriptions.'))
      .finally(() => setLoading(false));
  }, [patientProfileId]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <div className="spinner spinner-dark" />
    </div>
  );

  return (
    <>
      <div className="page-header">
        <div className="page-title">Prescriptions</div>
        <div className="page-sub">All medications prescribed across your visits</div>
      </div>
      <div className="content">
        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          <div className="card-header">
            <div className="card-title">All Prescriptions ({prescriptions.length})</div>
          </div>
          <div className="card-body">
            {prescriptions.length === 0 && !error ? (
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
                <p style={{ fontSize: 13 }}>No prescriptions on record yet.</p>
              </div>
            ) : prescriptions.map((rx, i) => (
              <div key={i} className="rx-item">
                <div className="rx-dot" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{rx.drug} — {rx.dosage}</div>
                  {rx.frequency && (
                    <div style={{ fontSize: 12, color: 'var(--slate-mid)', marginTop: 2 }}>
                      {rx.frequency}{rx.duration && ` · ${rx.duration}`}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--slate-mid)', marginTop: 4 }}>
                    For: {rx.diagnosis}
                    {' · '}
                    {new Date(rx.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {rx.doctorName && ` · Dr. ${rx.doctorName}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
