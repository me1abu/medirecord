import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import Login from './pages/Login';
import Register from './pages/Register';

// Doctor pages
import DoctorLayout from './pages/doctor/DoctorLayout';
import DoctorOverview from './pages/doctor/DoctorOverview';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorPatientRecord from './pages/doctor/DoctorPatientRecord';
import DoctorAppointments from './pages/doctor/DoctorAppointments';

// Patient pages
import PatientLayout from './pages/patient/PatientLayout';
import PatientRecords from './pages/patient/PatientRecords';
import PatientPrescriptions from './pages/patient/PatientPrescriptions';
import PatientAppointments from './pages/patient/PatientAppointments';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner spinner-dark" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'doctor' ? '/doctor' : '/patient'} replace />;
  return children;
};

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'doctor' ? '/doctor' : '/patient'} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Doctor routes */}
          <Route path="/doctor" element={<ProtectedRoute role="doctor"><DoctorLayout /></ProtectedRoute>}>
            <Route index element={<DoctorOverview />} />
            <Route path="patients" element={<DoctorPatients />} />
            <Route path="patients/:patientId/records" element={<DoctorPatientRecord />} />
            <Route path="appointments" element={<DoctorAppointments />} />
          </Route>

          {/* Patient routes */}
          <Route path="/patient" element={<ProtectedRoute role="patient"><PatientLayout /></ProtectedRoute>}>
            <Route index element={<PatientRecords />} />
            <Route path="prescriptions" element={<PatientPrescriptions />} />
            <Route path="appointments" element={<PatientAppointments />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
