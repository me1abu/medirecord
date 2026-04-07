import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const EMPTY_RECORD = {
  visitDate: new Date().toISOString().split('T')[0],
  visitType: 'Routine Checkup',
  symptoms: '',
  diagnosis: '',
  vitals: { bp: '', heartRate: '', temperature: '', weight: '', spo2: '', bloodSugar: '' },
  prescriptions: [{ drug: '', dosage: '', frequency: '', duration: '' }],
  notes: '',
  followUpDate: '',
  followUpNotes: '',
};

export default function DoctorPatientRecord() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  // Record form
  const [form, setForm] = useState(EMPTY_RECORD);
  const [saving, setSaving] = useState(false);
  const [recordError, setRecordError] = useState('');

  // Link account form
  const [linkEmail, setLinkEmail] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');

  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, rRes] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get(`/records/patient/${patientId}`),
      ]);
      setPatient(pRes.data.patient);
      setRecords(rRes.data.records);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [patientId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Record form helpers
  const setVital = (f) => (e) => setForm(p => ({ ...p, vitals: { ...p.vitals, [f]: e.target.value } }));
  const setRx = (i, f) => (e) => {
    const rxs = [...form.prescriptions];
    rxs[i] = { ...rxs[i], [f]: e.target.value };
    setForm(p => ({ ...p, prescriptions: rxs }));
  };
  const addRx = () => setForm(p => ({ ...p, prescriptions: [...p.prescriptions, { drug: '', dosage: '', frequency: '', duration: '' }] }));
  const removeRx = (i) => setForm(p => ({ ...p, prescriptions: p.prescriptions.filter((_, idx) => idx !== i) }));

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setRecordError('');
    setSaving(true);
    try {
      await api.post('/records', {
        patientId,
        ...form,
        prescriptions: form.prescriptions.filter(rx => rx.drug),
      });
      setShowRecordModal(false);
      setForm(EMPTY_RECORD);
      fetchAll();
    } catch (err) {
      setRecordError(err.response?.data?.message || 'Failed to save record.');
    } finally { setSaving(false); }
  };

  const handleLinkAccount = async (e) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    setLinking(true);
    try {
      const { data } = await api.patch(`/patients/${patientId}/link-account`, { email: linkEmail });
      setLinkSuccess(data.message);
      setPatient(data.patient);
      setLinkEmail('');
    } catch (err) {
      setLinkError(err.response?.data?.message || 'Failed to link account.');
    } finally { setLinking(false); }
  };

  const handleUnlinkAccount = async () => {
    if (!window.confirm('Remove this patient\'s portal access? They will no longer be able to log in and view their records.')) return;
    try {
      await api.patch(`/patients/${patientId}/unlink-account`);
      setPatient(p => ({ ...p, userAccount: null }));
      setLinkSuccess('');
      setLinkError('');
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (status) => {
    setStatusUpdating(true);
    try {
      await api.patch(`/patients/${patientId}`, { status });
      setPatient(p => ({ ...p, status }));
    } catch (e) { console.error(e); }
    finally { setStatusUpdating(false); }
  };

  const deleteRecord = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    await api.delete(`/records/${id}`);
    fetchAll();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner spinner-dark" /></div>;
  if (!patient) return <div className="content"><div className="alert alert-error">Patient not found.</div></div>;

  const statusBadge = { stable: 'badge-green', monitor: 'badge-amber', critical: 'badge-red' }[patient.status];
  const isLinked = !!patient.userAccount;

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/doctor/patients')} style={{ marginBottom: 8 }}>← Back to Patients</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="page-title">{patient.name}</div>
            <span className={`badge ${statusBadge}`}>{patient.status}</span>
          </div>
          <div className="page-sub">{patient.age}y · {patient.gender} · {patient.bloodGroup} · {patient.phone}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={() => { setShowLinkModal(true); setLinkError(''); setLinkSuccess(''); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            {isLinked ? 'Manage Portal Access' : 'Link Patient Account'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowRecordModal(true)}>+ Add Visit Record</button>
        </div>
      </div>

      <div className="content">
        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Patient Info */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Patient Info</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['stable', 'monitor', 'critical'].map(s => (
                  <button key={s} className={`btn btn-sm ${patient.status === s ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => updateStatus(s)} disabled={statusUpdating} style={{ textTransform: 'capitalize' }}>{s}</button>
                ))}
              </div>
            </div>
            <div className="card-body" style={{ fontSize: 13 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                {[['Age', `${patient.age} years`], ['Gender', patient.gender], ['Blood Group', patient.bloodGroup], ['Phone', patient.phone]].map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)', textTransform: 'uppercase', marginBottom: 2 }}>{l}</div>
                    <div>{v}</div>
                  </div>
                ))}
                {patient.email && <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)', textTransform: 'uppercase', marginBottom: 2 }}>Email</div>
                  <div>{patient.email}</div>
                </div>}
              </div>

              {/* Portal access status */}
              <div style={{ borderTop: '1px solid var(--slate-border)', paddingTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)', textTransform: 'uppercase', marginBottom: 6 }}>Patient Portal Access</div>
                {isLinked ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-green">Linked</span>
                    <span style={{ fontSize: 13 }}>{patient.userAccount.email}</span>
                    <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={handleUnlinkAccount}>Unlink</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-gray">Not linked</span>
                    <span style={{ fontSize: 12, color: 'var(--slate-mid)' }}>Patient cannot view records online</span>
                  </div>
                )}
              </div>

              {patient.existingConditions?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)', textTransform: 'uppercase', marginBottom: 4 }}>Conditions</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {patient.existingConditions.map(c => <span key={c} className="badge badge-amber">{c}</span>)}
                  </div>
                </div>
              )}
              {patient.allergies?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-mid)', textTransform: 'uppercase', marginBottom: 4 }}>Allergies</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {patient.allergies.map(a => <span key={a} className="badge badge-red">{a}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Latest Vitals */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Latest Vitals</div>
              {records[0] && <span style={{ fontSize: 11, color: 'var(--slate-mid)' }}>
                {new Date(records[0].visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>}
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
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <p style={{ fontSize: 13 }}>No vitals recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Visit History */}
        <div className="card">
          <div className="card-header"><div className="card-title">Visit History ({records.length})</div></div>
          <div className="card-body">
            {records.length === 0 ? (
              <div className="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                <p style={{ fontSize: 13 }}>No visit records yet. Click "Add Visit Record" to start.</p>
              </div>
            ) : records.map(r => (
              <div key={r._id} className="visit-item" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div className="visit-date">
                      {new Date(r.visitDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · {r.visitType}
                    </div>
                    <div className="visit-diag">{r.diagnosis}</div>
                    {r.symptoms && <div className="visit-note">Symptoms: {r.symptoms}</div>}
                    {r.notes && <div className="visit-note" style={{ marginTop: 4 }}>{r.notes}</div>}
                    {r.prescriptions?.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        {r.prescriptions.map((rx, i) => (
                          <div key={i} className="rx-item" style={{ padding: '6px 10px', marginBottom: 4 }}>
                            <div className="rx-dot" />
                            <div style={{ fontSize: 12 }}><strong>{rx.drug}</strong> — {rx.dosage}{rx.frequency && ` · ${rx.frequency}`}{rx.duration && ` · ${rx.duration}`}</div>
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
                  <button className="btn btn-danger btn-sm" onClick={() => deleteRecord(r._id)} style={{ marginLeft: 12, flexShrink: 0 }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LINK ACCOUNT MODAL */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowLinkModal(false)}>
          <div className="modal" style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div className="modal-title">Patient Portal Access</div>
              <button className="modal-close" onClick={() => setShowLinkModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Current status */}
              <div style={{ background: 'var(--slate-light)', borderRadius: 8, padding: '12px 14px', marginBottom: '1.25rem', fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Current status</div>
                {isLinked ? (
                  <div>
                    <span className="badge badge-green" style={{ marginRight: 8 }}>Linked</span>
                    {patient.userAccount.name} · {patient.userAccount.email}
                  </div>
                ) : (
                  <div style={{ color: 'var(--slate-mid)' }}>
                    <span className="badge badge-gray" style={{ marginRight: 8 }}>Not linked</span>
                    This patient cannot log in to view their records yet.
                  </div>
                )}
              </div>

              {/* How it works */}
              <div style={{ fontSize: 12, color: 'var(--slate-mid)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--slate)' }}>How it works:</strong> Ask the patient to register at <em>MediRecord → Register → Patient</em> using their email. Then enter that email below to link their account so they can view records, prescriptions, and appointments online.
              </div>

              {linkError && <div className="alert alert-error">{linkError}</div>}
              {linkSuccess && <div className="alert alert-success">{linkSuccess}</div>}

              {/* Link form */}
              {!linkSuccess && (
                <form onSubmit={handleLinkAccount}>
                  <div className="form-group">
                    <label className="form-label">Patient's registered email</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="patient@email.com"
                      value={linkEmail}
                      onChange={e => setLinkEmail(e.target.value)}
                      required
                    />
                    <div className="form-hint">Must match exactly what the patient used to register.</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowLinkModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={linking}>
                      {linking ? <span className="spinner" /> : 'Link Account'}
                    </button>
                  </div>
                </form>
              )}

              {/* Unlink option when already linked */}
              {isLinked && (
                <div style={{ borderTop: '1px solid var(--slate-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                  <div style={{ fontSize: 12, color: 'var(--slate-mid)', marginBottom: 8 }}>
                    To remove this patient's portal access, unlink their account. They will no longer be able to log in.
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => { handleUnlinkAccount(); setShowLinkModal(false); }}>
                    Unlink Account
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD RECORD MODAL */}
      {showRecordModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowRecordModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Add Visit Record — {patient.name}</div>
              <button className="modal-close" onClick={() => setShowRecordModal(false)}>×</button>
            </div>
            <form onSubmit={handleSaveRecord}>
              <div className="modal-body">
                {recordError && <div className="alert alert-error">{recordError}</div>}

                <div className="form-row" style={{ marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">Visit Date *</label>
                    <input className="form-input" type="date" value={form.visitDate} onChange={e => setForm(p => ({ ...p, visitDate: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="form-label">Visit Type</label>
                    <select className="form-input" value={form.visitType} onChange={e => setForm(p => ({ ...p, visitType: e.target.value }))}>
                      {['Routine Checkup', 'Follow-up', 'Emergency', 'Consultation', 'Lab Review'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Chief Complaint / Symptoms</label>
                  <input className="form-input" placeholder="What brought the patient in?" value={form.symptoms} onChange={e => setForm(p => ({ ...p, symptoms: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Diagnosis *</label>
                  <input className="form-input" placeholder="e.g. Viral fever, Hypertension review" value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} required />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ marginBottom: 8 }}>Vitals</label>
                  <div className="form-row" style={{ marginBottom: 8 }}>
                    <div><label className="form-label" style={{ fontSize: 10 }}>BP (mmHg)</label><input className="form-input" placeholder="120/80" value={form.vitals.bp} onChange={setVital('bp')} /></div>
                    <div><label className="form-label" style={{ fontSize: 10 }}>Heart Rate (bpm)</label><input className="form-input" type="number" placeholder="72" value={form.vitals.heartRate} onChange={setVital('heartRate')} /></div>
                  </div>
                  <div className="form-row" style={{ marginBottom: 8 }}>
                    <div><label className="form-label" style={{ fontSize: 10 }}>Temperature (°C)</label><input className="form-input" type="number" step="0.1" placeholder="36.8" value={form.vitals.temperature} onChange={setVital('temperature')} /></div>
                    <div><label className="form-label" style={{ fontSize: 10 }}>Weight (kg)</label><input className="form-input" type="number" placeholder="70" value={form.vitals.weight} onChange={setVital('weight')} /></div>
                  </div>
                  <div className="form-row">
                    <div><label className="form-label" style={{ fontSize: 10 }}>SpO2 (%)</label><input className="form-input" type="number" placeholder="98" value={form.vitals.spo2} onChange={setVital('spo2')} /></div>
                    <div><label className="form-label" style={{ fontSize: 10 }}>Blood Sugar (mg/dL)</label><input className="form-input" type="number" placeholder="110" value={form.vitals.bloodSugar} onChange={setVital('bloodSugar')} /></div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label className="form-label" style={{ margin: 0 }}>Prescriptions</label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addRx}>+ Add Drug</button>
                  </div>
                  {form.prescriptions.map((rx, i) => (
                    <div key={i} style={{ border: '1px solid var(--slate-border)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
                      <div className="form-row" style={{ marginBottom: 6 }}>
                        <div><label className="form-label" style={{ fontSize: 10 }}>Drug Name</label><input className="form-input" placeholder="Metformin" value={rx.drug} onChange={setRx(i, 'drug')} /></div>
                        <div><label className="form-label" style={{ fontSize: 10 }}>Dosage</label><input className="form-input" placeholder="500mg" value={rx.dosage} onChange={setRx(i, 'dosage')} /></div>
                      </div>
                      <div className="form-row">
                        <div><label className="form-label" style={{ fontSize: 10 }}>Frequency</label><input className="form-input" placeholder="Twice daily after meals" value={rx.frequency} onChange={setRx(i, 'frequency')} /></div>
                        <div><label className="form-label" style={{ fontSize: 10 }}>Duration</label><input className="form-input" placeholder="7 days" value={rx.duration} onChange={setRx(i, 'duration')} /></div>
                      </div>
                      {form.prescriptions.length > 1 && (
                        <button type="button" className="btn btn-danger btn-sm" style={{ marginTop: 6 }} onClick={() => removeRx(i)}>Remove</button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Doctor's Notes</label>
                  <textarea className="form-input" rows={3} placeholder="Clinical observations, treatment plan, referrals..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <div className="form-row">
                  <div>
                    <label className="form-label">Follow-up Date</label>
                    <input className="form-input" type="date" value={form.followUpDate} onChange={e => setForm(p => ({ ...p, followUpDate: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Follow-up Notes</label>
                    <input className="form-input" placeholder="e.g. Bring lab reports" value={form.followUpNotes} onChange={e => setForm(p => ({ ...p, followUpNotes: e.target.value }))} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowRecordModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <span className="spinner" /> : 'Save Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
