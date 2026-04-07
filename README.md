# MediRecord 

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

## How Patient Portal Access Works

Patient accounts are **not automatically linked** to a medical record. The workflow is:

1. Patient registers at `/register` with role = Patient, using their email
2. Doctor goes to the patient's record page → clicks **"Link Patient Account"**
3. Doctor enters the patient's registered email → clicks Link
4. Patient can now log in and view their records, prescriptions, and appointments (read-only)

The doctor can unlink at any time to revoke access.

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Backend server port (default: 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWTs — keep this private |
| `JWT_EXPIRES_IN` | Token expiry duration (e.g. `7d`) |

---

## License

This project is built for educational purposes.
