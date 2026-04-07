# MediRecord 🩺

A full-stack web application for medical professionals to securely store and access patient health records. Built with the **MERN stack** (MongoDB, Express, React, Node.js) as a college project for the *Web Development Using MERN Stack* course.

---

## Features

### Doctor Dashboard
- **Overview** — live stats (total patients, critical cases, records this month), recent activity feed
- **Patient Management** — add, search (debounced), and delete patients with full demographic and medical info
- **Visit Records** — log diagnosis, vitals (BP, weight, SpO₂, blood sugar, temp, heart rate), prescriptions, clinical notes, and follow-up dates
- **Portal Linking** — link a patient's self-registered account by email so they can access their own records
- **Status Management** — mark patients as `stable`, `monitor`, or `critical`
- **Appointments** — real-time follow-up schedule derived from visit records

### Patient Portal
- **Health Summary** — personal banner, active conditions, allergies
- **Latest Vitals** — most recent visit vitals in a clean grid
- **Visit History** — full chronological history with diagnoses, notes, and prescriptions
- **Prescriptions** — all medications across all visits with dosage and frequency
- **Appointments** — upcoming and past follow-ups with doctor attribution

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6 |
| HTTP Client | Axios (with JWT interceptor) |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JSON Web Tokens (JWT), bcryptjs |
| Styling | Custom CSS design system (DM Serif Display + DM Sans) |

---

## Project Structure

```
medirecord/
├── backend/
│   ├── middleware/
│   │   └── auth.js              # JWT protect middleware + restrictTo() role guard
│   ├── models/
│   │   ├── User.js              # Doctor & patient accounts, bcrypt hashing
│   │   ├── Patient.js           # Patient profiles, age virtual, lastVisit hook
│   │   └── Record.js            # Visit records with embedded vitals & prescriptions
│   ├── routes/
│   │   ├── auth.js              # /register, /login, /me
│   │   ├── patients.js          # Full CRUD + link/unlink account
│   │   └── records.js           # CRUD + /recent + /followups
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── api/
    │   │   └── axios.js         # Axios instance with JWT interceptor
    │   ├── context/
    │   │   └── AuthContext.js   # Global auth state, session restore on refresh
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Register.js
    │   │   ├── doctor/
    │   │   │   ├── DoctorLayout.js
    │   │   │   ├── DoctorOverview.js
    │   │   │   ├── DoctorPatients.js
    │   │   │   ├── DoctorPatientRecord.js
    │   │   │   └── DoctorAppointments.js
    │   │   └── patient/
    │   │       ├── PatientLayout.js
    │   │       ├── PatientRecords.js
    │   │       ├── PatientPrescriptions.js
    │   │       └── PatientAppointments.js
    │   ├── index.css            # Full custom design system
    │   ├── index.js
    │   └── App.js               # Routes + protected route wrappers
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm
- MongoDB Atlas account (free tier works fine)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/medirecord.git
cd medirecord
```

### 2. Set up the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in your values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/medirecord?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

Then install and run:

```bash
npm install
npm run dev        # uses nodemon for hot-reload
```

The API will be available at `http://localhost:5000`.

### 3. Set up the frontend

```bash
cd ../frontend
npm install
npm start
```

The React app will open at `http://localhost:3000` and proxy API calls to port 5000 automatically.

---

## API Reference

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register doctor or patient account |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Auth | Get current user (used to restore session) |

### Patients

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/patients` | Doctor | List all patients (supports `?search=`) |
| GET | `/api/patients/stats` | Doctor | Dashboard stats |
| GET | `/api/patients/:id` | Doctor / Patient | Get single patient |
| POST | `/api/patients` | Doctor | Create patient |
| PATCH | `/api/patients/:id` | Doctor | Update patient info or status |
| PATCH | `/api/patients/:id/link-account` | Doctor | Link patient portal by email |
| PATCH | `/api/patients/:id/unlink-account` | Doctor | Remove portal access |
| DELETE | `/api/patients/:id` | Doctor | Delete patient + all records |

### Records

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/records/recent` | Doctor | 10 most recent records |
| GET | `/api/records/followups` | Doctor | All follow-up appointments |
| GET | `/api/records/patient/:id` | Doctor / Patient | All records for a patient |
| GET | `/api/records/:id` | Doctor / Patient | Single record |
| POST | `/api/records` | Doctor | Create visit record |
| PATCH | `/api/records/:id` | Doctor | Update record |
| DELETE | `/api/records/:id` | Doctor | Delete record |

---

## How Patient Portal Access Works

Patient accounts are **not automatically linked** to a medical record. The workflow is:

1. Patient registers at `/register` with role = Patient, using their email
2. Doctor goes to the patient's record page → clicks **"Link Patient Account"**
3. Doctor enters the patient's registered email → clicks Link
4. Patient can now log in and view their records, prescriptions, and appointments (read-only)

The doctor can unlink at any time to revoke access.

---

## Security

- Passwords hashed with **bcryptjs** (12 salt rounds)
- **JWT** authentication on all routes except `/register` and `/login`
- **Role-based middleware** — patients cannot write, doctors cannot access other doctors' data
- **Ownership checks** on every record fetch — no data leakage via direct ID access
- **Cascade delete** — removing a patient deletes all records and unlinks their user account

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Backend server port (default: 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWTs — keep this private |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`) |

---

## Screenshots

> UI prototype built before backend integration:

- **Doctor Dashboard** — stats, recent activity, quick actions
- **Patient List** — searchable, color-coded status badges
- **Visit Record** — vitals grid, prescription list, follow-up date
- **Patient Portal** — health banner, vitals, visit history

---

## Future Scope

- Appointment booking with time slots (dedicated `Appointment` model)
- PDF export of patient visit summaries
- File upload for lab reports and X-rays (Firebase Storage / S3)
- Email/SMS reminders for follow-up appointments
- Multi-clinic support with clinic-scoped patient access

---

## License

This project is built for educational purposes as part of a B.Tech CSE college assignment.
