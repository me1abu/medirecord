import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export default function PatientRecords() {
  const { patientProfileId } = useAuth();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patientProfileId) {
      setLoading(false);
      setError('No patient profile linked to your account. Please ask your doctor to link your account.');
      return;
    }
    Promise.all([
      api.get(`/patients/${patientProfileId}`),
      api.get(`/records/patient/${patientProfileId}`),
    ])
      .then(([pRes, rRes]) => {
        setPatient(pRes.data.patient);
        setRecords(rRes.data.records);
      })
      .catch(() => setError('Could not load your records. Please try again.'))
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
        <div className="page-title">My Health Records</div>
        <div className="page-sub">Read-only · Managed by your doctor</div>
      </div>
      <div className="content">
        {error && <div className="alert alert-error">{error}</div>}

        {patient && (
          <>
            <div className="health-banner">
              <div className="avatar avatar-lg" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 20, flexShrink: 0 }}>
                {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 22, marginBottom: 4 }}>{patient.name}</div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  DOB: {new Date(patient.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}{patient.gender}
                  {' · '}Blood Group: {patient.bloodGroup}
                </div>
                {patient.phone && (
                  <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>📞 {patient.phone}</div>
                )}
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Latest Vitals</div>
                  {records[0] && (
                    <span style={{ fontSize: 11, color: 'var(--slate-mid)' }}>
                      {new Date(records[0].visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
                <div className="card-body">
                  {records[0]?.vitals && Object.values(records[0].vitals).some(Boolean) ? (
                    <div className="vitals-grid">
                      {[
                        ['BP', records[0].vitals.bp],
                        ['Heart Rate', records[0].vitals.heartRate ? `${records[0].vitals.heartRate} bpm` : null],
                        ['Temperature', records[0].vitals.temperature ? `${records[0].vitals.temperature}°C` : null],
                        ['Weight', records[0].vitals.weight ? `${records[0].vitals.weight} kg` : null],
                        ['SpO2', records[0].vitals.spo2 ? `${records[0].vitals.spo2}%` : null],
                        ['Blood Sugar', records[0].vitals.bloodSugar ? `${records[0].vitals.bloodSugar} mg/dL` : null],
                      ].filter(([, v]) => v).map(([label, val]) => (
                        <div key={label} className="vital-box">
                          <div className="vital-val">{val}</div>
                          <div className="vital-label">{label}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state" style={{ padding: '1rem' }}>
                      <p style={{ fontSize: 13 }}>No vitals recorded yet.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">Conditions & Allergies</div></div>
                <div className="card-body">
                  {patient.existingConditions?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)', textTransform: 'uppercase', marginBottom: 6 }}>Conditions</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {patient.existingConditions.map(c => <span key={c} className="badge badge-amber">{c}</span>)}
                      </div>
                    </div>
                  )}
                  {patient.allergies?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)', textTransform: 'uppercase', marginBottom: 6 }}>Allergies</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {patient.allergies.map(a => <span key={a} className="badge badge-red">{a}</span>)}
                      </div>
                    </div>
                  )}
                  {!patient.existingConditions?.length && !patient.allergies?.length && (
                    <div style={{ fontSize: 13, color: 'var(--slate-mid)' }}>None on record.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="card">
          <div className="card-header">
            <div className="card-title">Visit History ({records.length})</div>
          </div>
          <div className="card-body">
            {records.length === 0 ? (
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                </svg>
                <p style={{ fontSize: 13 }}>No visit records yet.</p>
              </div>
            ) : records.map(r => (
              <div key={r._id} className="visit-item" style={{ marginBottom: 12 }}>
                <div className="visit-date">
                  {new Date(r.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {' · '}{r.visitType}
                  {r.doctor?.name && ` · Dr. ${r.doctor.name}`}
                </div>
                <div className="visit-diag">{r.diagnosis}</div>
                {r.symptoms && <div className="visit-note">Symptoms: {r.symptoms}</div>}
                {r.notes && <div className="visit-note" style={{ marginTop: 4 }}>{r.notes}</div>}
                {r.prescriptions?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {r.prescriptions.map((rx, i) => (
                      <div key={i} className="rx-item" style={{ padding: '6px 10px', marginBottom: 4 }}>
                        <div className="rx-dot" />
                        <div style={{ fontSize: 12 }}>
                          <strong>{rx.drug}</strong> — {rx.dosage}{rx.frequency && ` · ${rx.frequency}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {r.followUpDate && (
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--blue)' }}>
                    Follow-up: {new Date(r.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {r.followUpNotes && ` — ${r.followUpNotes}`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
