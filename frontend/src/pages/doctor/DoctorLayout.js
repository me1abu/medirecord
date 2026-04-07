import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const initials = (name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR';

export default function DoctorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">MediRecord</div>
        <div className="sidebar-user">
          <div className="avatar">{initials(user?.name)}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.specialization || 'Doctor'}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/doctor" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            Overview
          </NavLink>
          <NavLink to="/doctor/patients" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>
            Patients
          </NavLink>
          <NavLink to="/doctor/appointments" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Appointments
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div style={{ fontSize: 11, color: 'var(--slate-mid)', marginBottom: 8, paddingLeft: 4 }}>
            {user?.clinic || 'MediRecord Clinic'}
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Sign out
          </button>
        </div>
      </aside>
      <main className="main-area">
        <Outlet />
      </main>
    </div>
  );
}
