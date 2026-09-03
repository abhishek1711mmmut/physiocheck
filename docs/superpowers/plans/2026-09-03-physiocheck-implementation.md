# PhysioCheck Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Physiotherapy Digital Assessment System where therapists create patients, select from 10 specialties, fill structured assessment forms, track progress, and generate PDF reports.

**Architecture:** Separate frontend (React+Vite) and backend (Express+MongoDB) apps. Backend serves REST API, frontend consumes it. Clinical data (specialties, sections, tests, measures) is seeded into MongoDB. A single dynamic form renderer component handles all 10 specialty pages by reading the specialty's section definitions from the database.

**Tech Stack:** React 18, Vite, React Router 6, Tailwind CSS, Node.js, Express, MongoDB, Mongoose, jsonwebtoken, bcryptjs, jsPDF, Recharts

**Spec:** `docs/superpowers/specs/2026-09-02-physiocheck-design.md`

**Clinical Data Reference:** `PhysioCheck2.txt` — contains all 10 specialties with exact fields, tests, and outcome measures to seed.

## Global Constraints

- Node.js 18+
- MongoDB 6+ running locally on port 27017
- All API routes prefixed with `/api`
- All protected routes require JWT in `Authorization: Bearer <token>` header
- Frontend runs on port 5173 (Vite default), backend on port 5000
- No TypeScript — plain JSX/JS only
- No CSS frameworks beyond Tailwind
- No ORM beyond Mongoose
- **Standard API response format** — every endpoint returns:
  ```json
  {
    "success": true/false,
    "data": {} or null,
    "message": "Human-readable message",
    "error": null or "Error description"
  }
  ```
  Use the `sendResponse` helper from `backend/utils/response.js` in every route.

---

### Task 1: Project Setup

**Files:**
- Create: `backend/package.json`
- Create: `backend/server.js`
- Create: `backend/.env`
- Create: `backend/utils/response.js`
- Create: `frontend/` (via Vite scaffold)
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/main.jsx`

**Interfaces:**
- Produces: Running backend on :5000 with MongoDB connected, running frontend on :5173 with Tailwind configured

- [ ] **Step 1: Initialize backend**

```bash
cd physiocheck
mkdir -p backend
cd backend
npm init -y
npm install express mongoose dotenv cors
npm install --save-dev nodemon
```

- [ ] **Step 2: Create backend/.env**

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/physiocheck
JWT_SECRET=physiocheck_dev_secret_key_2026
```

- [ ] **Step 3: Create backend/utils/response.js**

```javascript
const sendResponse = (res, statusCode, success, data, message, error = null) => {
  res.status(statusCode).json({ success, data, message, error });
};

module.exports = sendResponse;
```

- [ ] **Step 4: Create backend/server.js**

```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const sendResponse = require('./utils/response');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/api/health', (req, res) => {
  sendResponse(res, 200, true, { status: 'ok' }, 'Server is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

- [ ] **Step 5: Add dev script to backend/package.json**

Add to `"scripts"`:
```json
"dev": "nodemon server.js"
```

- [ ] **Step 6: Test backend starts**

```bash
cd backend
npm run dev
```

Expected: "MongoDB connected" and "Server running on port 5000". Visit `http://localhost:5000/api/health` — should return `{"success":true,"data":{"status":"ok"},"message":"Server is running","error":null}`.

- [ ] **Step 7: Initialize frontend with Vite**

```bash
cd physiocheck
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-router-dom axios
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 8: Configure Tailwind in frontend/vite.config.js**

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
});
```

- [ ] **Step 9: Add Tailwind import to frontend/src/index.css**

Replace contents with:
```css
@import "tailwindcss";
```

- [ ] **Step 10: Create minimal frontend/src/App.jsx**

```jsx
function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-center py-10">PhysioCheck</h1>
      <p className="text-center text-gray-600">Physiotherapy Digital Assessment System</p>
    </div>
  );
}

export default App;
```

- [ ] **Step 11: Test frontend starts**

```bash
cd frontend
npm run dev
```

Expected: Browser shows "PhysioCheck" heading with Tailwind styling at `http://localhost:5173`.

- [ ] **Step 12: Commit**

```bash
git init
echo "node_modules\n.env\ndist" > .gitignore
git add .
git commit -m "feat: project setup with Express backend and React+Vite frontend"
```

---

### Task 2: User Authentication — Backend

**Files:**
- Create: `backend/models/User.js`
- Create: `backend/routes/auth.js`
- Create: `backend/middleware/auth.js`

**Interfaces:**
- Consumes: Express app from Task 1
- Produces: `POST /api/auth/register` (body: {name, email, password} → {token, user}), `POST /api/auth/login` (body: {email, password} → {token, user}), `auth` middleware that extracts `req.user = { id }` from JWT

- [ ] **Step 1: Install auth dependencies**

```bash
cd backend
npm install jsonwebtoken bcryptjs
```

- [ ] **Step 2: Create backend/models/User.js**

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

- [ ] **Step 3: Create backend/middleware/auth.js**

```javascript
const jwt = require('jsonwebtoken');
const sendResponse = require('../utils/response');

module.exports = function(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendResponse(res, 401, false, null, 'No token provided', 'No token provided');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return sendResponse(res, 401, false, null, 'Invalid token', 'Invalid token');
  }
};
```

- [ ] **Step 4: Create backend/routes/auth.js**

```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendResponse = require('../utils/response');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, false, null, 'Email already registered', 'Email already registered');
    }

    const user = await User.create({ name, email, password });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    sendResponse(res, 201, true, {
      token,
      user: { id: user._id, name: user.name, email: user.email }
    }, 'Registration successful');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse(res, 400, false, null, 'Invalid credentials', 'Invalid credentials');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendResponse(res, 400, false, null, 'Invalid credentials', 'Invalid credentials');
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    sendResponse(res, 200, true, {
      token,
      user: { id: user._id, name: user.name, email: user.email }
    }, 'Login successful');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

module.exports = router;
```

- [ ] **Step 5: Register auth routes in backend/server.js**

Add before the health check route:
```javascript
app.use('/api/auth', require('./routes/auth'));
```

- [ ] **Step 6: Test auth endpoints**

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
```

Expected: Both return `{ token: "...", user: { id, name, email } }`.

- [ ] **Step 7: Commit**

```bash
git add backend/models/User.js backend/routes/auth.js backend/middleware/auth.js backend/server.js backend/package.json backend/package-lock.json
git commit -m "feat: add user authentication with JWT"
```

---

### Task 3: User Authentication — Frontend

**Files:**
- Create: `frontend/src/context/AuthContext.jsx`
- Create: `frontend/src/services/api.js`
- Create: `frontend/src/components/ProtectedRoute.jsx`
- Create: `frontend/src/components/Navbar.jsx`
- Create: `frontend/src/pages/Login.jsx`
- Create: `frontend/src/pages/Register.jsx`
- Create: `frontend/src/pages/Dashboard.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `POST /api/auth/register`, `POST /api/auth/login` from Task 2
- Produces: `AuthContext` providing `{ user, token, login, register, logout }`, `ProtectedRoute` component, `api` axios instance with auto-attached JWT header

- [ ] **Step 1: Create frontend/src/services/api.js**

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

- [ ] **Step 2: Create frontend/src/context/AuthContext.jsx**

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const { token: newToken, user: userData } = res.data.data;
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

- [ ] **Step 3: Create frontend/src/components/ProtectedRoute.jsx**

```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!token) return <Navigate to="/login" />;

  return children;
}
```

- [ ] **Step 4: Create frontend/src/components/Navbar.jsx**

```jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/dashboard" className="text-xl font-bold text-blue-600">PhysioCheck</Link>
        {user && (
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Hi, {user.name}</span>
            <button onClick={handleLogout} className="text-red-500 hover:text-red-700">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 5: Create frontend/src/pages/Register.jsx**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="Full Name" value={name}
            onChange={(e) => setName(e.target.value)} required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Register
          </button>
        </form>
        <p className="text-center mt-4 text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create frontend/src/pages/Login.jsx**

```jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login to PhysioCheck</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
            Login
          </button>
        </form>
        <p className="text-center mt-4 text-gray-600">
          Don't have an account? <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create frontend/src/pages/Dashboard.jsx**

```jsx
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Welcome, {user?.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Patients</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Assessments</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Recent Activity</h3>
          <p className="text-gray-500 mt-2">No recent activity</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Update frontend/src/App.jsx with routing**

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Navbar />
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 9: Test the full auth flow in browser**

1. Go to `http://localhost:5173` — should redirect to `/login`
2. Click "Register" link — fill form — should redirect to dashboard
3. Click "Logout" — should redirect to login
4. Login with same credentials — should see dashboard with "Welcome, [name]"

- [ ] **Step 10: Commit**

```bash
git add frontend/
git commit -m "feat: add frontend auth with login, register, and protected dashboard"
```

---

### Task 4: Patient CRUD — Backend

**Files:**
- Create: `backend/models/Patient.js`
- Create: `backend/routes/patients.js`
- Modify: `backend/server.js`

**Interfaces:**
- Consumes: `auth` middleware from Task 2
- Produces: `POST /api/patients` (body: {name, age, gender, diagnosis} → patient), `GET /api/patients` (→ [patients]), `GET /api/patients/:id` (→ patient)

- [ ] **Step 1: Create backend/models/Patient.js**

```javascript
const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  diagnosis: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
```

- [ ] **Step 2: Create backend/routes/patients.js**

```javascript
const express = require('express');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const sendResponse = require('../utils/response');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { name, age, gender, diagnosis } = req.body;
    const patient = await Patient.create({
      therapistId: req.user.id,
      name, age, gender, diagnosis
    });
    sendResponse(res, 201, true, patient, 'Patient created successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const patients = await Patient.find({ therapistId: req.user.id }).sort({ createdAt: -1 });
    sendResponse(res, 200, true, patients, 'Patients fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, therapistId: req.user.id });
    if (!patient) return sendResponse(res, 404, false, null, 'Patient not found', 'Patient not found');
    sendResponse(res, 200, true, patient, 'Patient fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

module.exports = router;
```

- [ ] **Step 3: Register patient routes in backend/server.js**

Add after auth routes:
```javascript
app.use('/api/patients', require('./routes/patients'));
```

- [ ] **Step 4: Test patient endpoints**

```bash
# Get token from login first, then:
TOKEN="your_jwt_token_here"

# Create patient
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"John Doe","age":45,"gender":"Male","diagnosis":"Knee OA"}'

# List patients
curl http://localhost:5000/api/patients \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Patient created and listed successfully.

- [ ] **Step 5: Commit**

```bash
git add backend/models/Patient.js backend/routes/patients.js backend/server.js
git commit -m "feat: add patient CRUD API routes"
```

---

### Task 5: Patient Pages — Frontend

**Files:**
- Create: `frontend/src/pages/NewPatient.jsx`
- Create: `frontend/src/pages/PatientDetail.jsx`
- Modify: `frontend/src/pages/Dashboard.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `POST /api/patients`, `GET /api/patients`, `GET /api/patients/:id` from Task 4, `api` from Task 3
- Produces: Patient creation page, patient detail page with assessment history, dashboard with real patient count and recent patients list

- [ ] **Step 1: Create frontend/src/pages/NewPatient.jsx**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function NewPatient() {
  const [form, setForm] = useState({ name: '', age: '', gender: '', diagnosis: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/patients', { ...form, age: Number(form.age) });
      navigate(`/patients/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create patient');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">New Patient</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
          <input type="number" name="age" value={form.age} onChange={handleChange} required min="0" max="150"
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange} required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
          <input type="text" name="diagnosis" value={form.diagnosis} onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
          Create Patient
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Create frontend/src/pages/PatientDetail.jsx**

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, assessmentsRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/assessments/patient/${id}`)
        ]);
        setPatient(patientRes.data.data);
        setAssessments(assessmentsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch patient data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!patient) return <div className="text-center py-10">Patient not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h1 className="text-2xl font-bold mb-4">{patient.name}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Age:</span> {patient.age}</div>
          <div><span className="text-gray-500">Gender:</span> {patient.gender}</div>
          <div><span className="text-gray-500">Diagnosis:</span> {patient.diagnosis || 'N/A'}</div>
          <div><span className="text-gray-500">Date:</span> {new Date(patient.date).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Assessments</h2>
        <Link to={`/patients/${id}/assess`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          New Assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg shadow">No assessments yet.</p>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <Link key={a._id} to={`/patients/${id}/assessments/${a._id}`}
              className="block bg-white p-4 rounded-lg shadow hover:shadow-md">
              <div className="flex justify-between">
                <span className="font-medium">{a.specialtyName || 'Assessment'}</span>
                <span className="text-gray-500 text-sm">{new Date(a.date).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Update frontend/src/pages/Dashboard.jsx with real data**

```jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients');
        setPatients(res.data.data);
      } catch (err) {
        console.error('Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
        <Link to="/patients/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + New Patient
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Patients</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{patients.length}</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Patients</h2>
      {loading ? (
        <p>Loading...</p>
      ) : patients.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg shadow">No patients yet. Create your first patient.</p>
      ) : (
        <div className="space-y-3">
          {patients.slice(0, 10).map((p) => (
            <Link key={p._id} to={`/patients/${p._id}`}
              className="block bg-white p-4 rounded-lg shadow hover:shadow-md">
              <div className="flex justify-between">
                <div>
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-500 ml-3">{p.age}y, {p.gender}</span>
                </div>
                <span className="text-gray-500 text-sm">{p.diagnosis || 'No diagnosis'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add patient routes to frontend/src/App.jsx**

Add imports:
```jsx
import NewPatient from './pages/NewPatient';
import PatientDetail from './pages/PatientDetail';
```

Add routes inside `<Routes>` (before the catch-all):
```jsx
<Route path="/patients/new" element={
  <ProtectedRoute><Navbar /><NewPatient /></ProtectedRoute>
} />
<Route path="/patients/:id" element={
  <ProtectedRoute><Navbar /><PatientDetail /></ProtectedRoute>
} />
```

- [ ] **Step 5: Test in browser**

1. Click "+ New Patient" on dashboard
2. Fill form and submit — should redirect to patient detail page
3. Go back to dashboard — should see patient listed with correct count
4. Click patient — should see detail page with "New Assessment" button

Note: The assessments API call in PatientDetail will 404 for now — that's expected. It will work after Task 8.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/
git commit -m "feat: add patient creation, listing, and detail pages"
```

---

### Task 6: Specialty Model and Seed Script — Backend

**Files:**
- Create: `backend/models/Specialty.js`
- Create: `backend/routes/specialties.js`
- Create: `backend/seed/specialties.js`
- Modify: `backend/server.js`

**Interfaces:**
- Consumes: MongoDB connection from Task 1
- Produces: `GET /api/specialties` (→ [{_id, name, icon}]), `GET /api/specialties/:id` (→ full specialty with sections, tests, measures), seeded database with all 10 specialties

**Clinical data source:** `PhysioCheck2.txt` — all field names, tests, and measures are taken verbatim from this file.

- [ ] **Step 1: Create backend/models/Specialty.js**

```javascript
const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'dropdown', 'checkbox', 'textarea'], default: 'checkbox' },
  options: [String]
}, { _id: false });

const subsectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fields: [fieldSchema]
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subsections: [subsectionSchema]
}, { _id: false });

const testSchema = new mongoose.Schema({
  name: { type: String, required: true },
  resultOptions: { type: [String], default: ['Positive', 'Negative'] }
}, { _id: false });

const testGroupSchema = new mongoose.Schema({
  group: { type: String, required: true },
  tests: [testSchema]
}, { _id: false });

const outcomeMeasureSchema = new mongoose.Schema({
  name: { type: String, required: true },
  maxScore: { type: Number },
  unit: { type: String }
}, { _id: false });

const specialtySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  icon: { type: String },
  sections: [sectionSchema],
  specialTests: [testGroupSchema],
  outcomeMeasures: [outcomeMeasureSchema]
}, { timestamps: true });

module.exports = mongoose.model('Specialty', specialtySchema);
```

- [ ] **Step 2: Create backend/routes/specialties.js**

```javascript
const express = require('express');
const Specialty = require('../models/Specialty');
const auth = require('../middleware/auth');
const sendResponse = require('../utils/response');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const specialties = await Specialty.find({}, 'name icon');
    sendResponse(res, 200, true, specialties, 'Specialties fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const specialty = await Specialty.findById(req.params.id);
    if (!specialty) return sendResponse(res, 404, false, null, 'Specialty not found', 'Specialty not found');
    sendResponse(res, 200, true, specialty, 'Specialty fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

module.exports = router;
```

- [ ] **Step 3: Register specialty routes in backend/server.js**

Add after patient routes:
```javascript
app.use('/api/specialties', require('./routes/specialties'));
```

- [ ] **Step 4: Create backend/seed/specialties.js**

This is the largest file — it contains all 10 specialties with their clinical data from `PhysioCheck2.txt`. Each field defaults to `type: 'checkbox'` (present/absent) unless specified otherwise.

```javascript
const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Specialty = require('../models/Specialty');

const specialties = [
  {
    name: 'Orthopaedic',
    icon: '🦴',
    sections: [
      {
        title: 'Assessment (Subjective)',
        subsections: [
          {
            title: 'Subjective Complaints',
            fields: [
              { label: 'Pain', type: 'checkbox' },
              { label: 'Stiffness', type: 'checkbox' },
              { label: 'Swelling', type: 'checkbox' },
              { label: 'Instability', type: 'checkbox' },
              { label: 'Locking', type: 'checkbox' },
              { label: 'Clicking', type: 'checkbox' },
              { label: 'Giving way', type: 'checkbox' },
              { label: 'Functional limitations', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Trauma/mechanism of injury', type: 'textarea' },
              { label: 'Previous fracture', type: 'checkbox' },
              { label: 'Surgery', type: 'textarea' },
              { label: 'Immobilization', type: 'checkbox' },
              { label: 'Sports/work demands', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Physical Examination',
        subsections: [
          {
            title: 'Observation',
            fields: [
              { label: 'Posture', type: 'textarea' },
              { label: 'Swelling', type: 'checkbox' },
              { label: 'Deformity', type: 'checkbox' },
              { label: 'Muscle wasting', type: 'checkbox' },
              { label: 'Scar', type: 'checkbox' },
              { label: 'Redness', type: 'checkbox' },
              { label: 'Bruising', type: 'checkbox' },
              { label: 'Limb alignment', type: 'textarea' }
            ]
          },
          {
            title: 'Palpation',
            fields: [
              { label: 'Temperature', type: 'dropdown', options: ['Normal', 'Warm', 'Hot'] },
              { label: 'Tenderness', type: 'textarea' },
              { label: 'Swelling', type: 'dropdown', options: ['None', 'Mild', 'Moderate', 'Severe'] },
              { label: 'Bony landmarks', type: 'textarea' },
              { label: 'Muscle spasm', type: 'checkbox' }
            ]
          },
          {
            title: 'ROM',
            fields: [
              { label: 'Active ROM', type: 'textarea' },
              { label: 'Passive ROM', type: 'textarea' },
              { label: 'End-feel', type: 'textarea' },
              { label: 'Painful arc', type: 'checkbox' }
            ]
          },
          {
            title: 'Muscle Examination',
            fields: [
              { label: 'MMT', type: 'textarea' },
              { label: 'Isometric strength', type: 'textarea' },
              { label: 'Functional strength', type: 'textarea' }
            ]
          },
          {
            title: 'Neurological Screening',
            fields: [
              { label: 'Dermatomes', type: 'textarea' },
              { label: 'Myotomes', type: 'textarea' },
              { label: 'Reflexes', type: 'textarea' },
              { label: 'Neural tension', type: 'textarea' }
            ]
          },
          {
            title: 'Functional Assessment',
            fields: [
              { label: 'Walking', type: 'textarea' },
              { label: 'Stairs', type: 'textarea' },
              { label: 'Sit-to-stand', type: 'textarea' },
              { label: 'Squat', type: 'textarea' },
              { label: 'ADLs', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Knee',
        tests: [
          { name: 'Lachman' },
          { name: 'Anterior drawer' },
          { name: 'Posterior drawer' },
          { name: 'McMurray' },
          { name: 'Thessaly' },
          { name: 'Varus stress' },
          { name: 'Valgus stress' },
          { name: 'Patellar apprehension' }
        ]
      },
      {
        group: 'Shoulder',
        tests: [
          { name: 'Neer' },
          { name: 'Hawkins-Kennedy' },
          { name: 'Empty Can/Jobe' },
          { name: 'Drop Arm' },
          { name: 'Apprehension/relocation' },
          { name: "Speed's" }
        ]
      },
      {
        group: 'Hip',
        tests: [
          { name: 'FABER' },
          { name: 'FADIR' },
          { name: 'Thomas test' },
          { name: 'Trendelenburg' }
        ]
      },
      {
        group: 'Spine',
        tests: [
          { name: 'SLR' },
          { name: 'Slump' },
          { name: 'Prone instability' },
          { name: 'Spurling' },
          { name: 'Cervical distraction' }
        ]
      },
      {
        group: 'Ankle',
        tests: [
          { name: 'Anterior drawer' },
          { name: 'Talar tilt' },
          { name: 'Thompson test' }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'LEFS', maxScore: 80 },
      { name: 'DASH/QuickDASH', maxScore: 100 },
      { name: 'SPADI', maxScore: 130 },
      { name: 'WOMAC', maxScore: 96 },
      { name: 'KOOS', maxScore: 100 },
      { name: 'ODI', maxScore: 100, unit: '%' },
      { name: 'NDI', maxScore: 100, unit: '%' }
    ]
  },
  {
    name: 'Neurological',
    icon: '🧠',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Onset', type: 'textarea' },
              { label: 'Progression', type: 'textarea' },
              { label: 'Falls', type: 'checkbox' },
              { label: 'Seizures', type: 'checkbox' },
              { label: 'Sensory symptoms', type: 'textarea' },
              { label: 'Bladder/bowel', type: 'textarea' },
              { label: 'Speech/swallowing problems', type: 'checkbox' },
              { label: 'Mobility level', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Mental Status',
            fields: [
              { label: 'Consciousness', type: 'textarea' },
              { label: 'Orientation', type: 'textarea' },
              { label: 'Memory', type: 'textarea' },
              { label: 'Attention', type: 'textarea' },
              { label: 'Cognition', type: 'textarea' }
            ]
          },
          {
            title: 'Cranial Nerves',
            fields: [
              { label: 'CN I–XII screening', type: 'textarea' }
            ]
          },
          {
            title: 'Motor Examination',
            fields: [
              { label: 'Muscle bulk', type: 'textarea' },
              { label: 'Tone', type: 'textarea' },
              { label: 'Power', type: 'textarea' },
              { label: 'Involuntary movements', type: 'checkbox' }
            ]
          },
          {
            title: 'Tone',
            fields: [
              { label: 'Hypotonia', type: 'checkbox' },
              { label: 'Spasticity', type: 'checkbox' },
              { label: 'Rigidity', type: 'checkbox' }
            ]
          },
          {
            title: 'Reflexes',
            fields: [
              { label: 'Biceps', type: 'dropdown', options: ['0', '1+', '2+', '3+', '4+'] },
              { label: 'Triceps', type: 'dropdown', options: ['0', '1+', '2+', '3+', '4+'] },
              { label: 'Supinator', type: 'dropdown', options: ['0', '1+', '2+', '3+', '4+'] },
              { label: 'Knee', type: 'dropdown', options: ['0', '1+', '2+', '3+', '4+'] },
              { label: 'Ankle', type: 'dropdown', options: ['0', '1+', '2+', '3+', '4+'] },
              { label: 'Plantar response', type: 'dropdown', options: ['Flexor', 'Extensor', 'Equivocal'] }
            ]
          },
          {
            title: 'Sensory',
            fields: [
              { label: 'Light touch', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Pain', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Temperature', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Vibration', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Proprioception', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Cortical sensation', type: 'textarea' }
            ]
          },
          {
            title: 'Coordination',
            fields: [
              { label: 'Finger-to-nose', type: 'dropdown', options: ['Normal', 'Impaired'] },
              { label: 'Heel-to-shin', type: 'dropdown', options: ['Normal', 'Impaired'] },
              { label: 'Rapid alternating movements', type: 'dropdown', options: ['Normal', 'Impaired'] }
            ]
          },
          {
            title: 'Balance',
            fields: [
              { label: 'Sitting', type: 'dropdown', options: ['Independent', 'With support', 'Unable'] },
              { label: 'Standing', type: 'dropdown', options: ['Independent', 'With support', 'Unable'] },
              { label: 'Dynamic balance', type: 'textarea' }
            ]
          },
          {
            title: 'Gait',
            fields: [
              { label: 'Gait pattern', type: 'textarea' },
              { label: 'Step length', type: 'textarea' },
              { label: 'Cadence', type: 'textarea' },
              { label: 'Assistive device', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'General Scales',
        tests: [
          { name: 'Glasgow Coma Scale', resultOptions: ['3-8 Severe', '9-12 Moderate', '13-15 Mild'] },
          { name: 'Modified Ashworth Scale', resultOptions: ['0', '1', '1+', '2', '3', '4'] },
          { name: 'Berg Balance Scale', resultOptions: ['0-20 High fall risk', '21-40 Medium fall risk', '41-56 Low fall risk'] },
          { name: 'TUG', resultOptions: ['<10s Normal', '10-20s Functional', '>20s Impaired'] },
          { name: 'Functional Reach', resultOptions: ['Normal', 'Impaired'] },
          { name: '10-Meter Walk Test', resultOptions: ['Normal', 'Impaired'] },
          { name: '6-Minute Walk Test', resultOptions: ['Normal', 'Impaired'] },
          { name: 'Romberg', resultOptions: ['Positive', 'Negative'] },
          { name: 'Sharpened Romberg', resultOptions: ['Positive', 'Negative'] }
        ]
      },
      {
        group: 'Stroke',
        tests: [
          { name: 'Brunnstrom staging', resultOptions: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5', 'Stage 6'] },
          { name: 'Fugl-Meyer Assessment', resultOptions: ['Severe', 'Moderate', 'Mild'] }
        ]
      },
      {
        group: 'SCI',
        tests: [
          { name: 'ISNCSCI/ASIA examination', resultOptions: ['AIS A', 'AIS B', 'AIS C', 'AIS D', 'AIS E'] }
        ]
      },
      {
        group: 'Parkinsonism',
        tests: [
          { name: 'Hoehn & Yahr', resultOptions: ['Stage 1', 'Stage 1.5', 'Stage 2', 'Stage 2.5', 'Stage 3', 'Stage 4', 'Stage 5'] },
          { name: 'MDS-UPDRS', resultOptions: ['Administered', 'Not administered'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'Berg Balance Scale', maxScore: 56 },
      { name: 'TUG', unit: 'seconds' },
      { name: 'Fugl-Meyer (Upper)', maxScore: 66 },
      { name: 'Fugl-Meyer (Lower)', maxScore: 34 },
      { name: 'Barthel Index', maxScore: 100 },
      { name: '6-Minute Walk Test', unit: 'meters' },
      { name: '10-Meter Walk Test', unit: 'seconds' }
    ]
  },
  {
    name: 'Cardiopulmonary',
    icon: '❤️',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Dyspnoea', type: 'checkbox' },
              { label: 'Cough', type: 'checkbox' },
              { label: 'Sputum', type: 'textarea' },
              { label: 'Chest pain', type: 'checkbox' },
              { label: 'Exercise tolerance', type: 'textarea' },
              { label: 'Smoking/exposure history', type: 'textarea' },
              { label: 'Cardiac history', type: 'textarea' },
              { label: 'Medication', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Vitals',
            fields: [
              { label: 'HR', type: 'number' },
              { label: 'BP', type: 'text' },
              { label: 'RR', type: 'number' },
              { label: 'SpO₂', type: 'number' },
              { label: 'Temperature', type: 'number' }
            ]
          },
          {
            title: 'Observation',
            fields: [
              { label: 'Breathing pattern', type: 'textarea' },
              { label: 'Accessory muscles', type: 'checkbox' },
              { label: 'Cyanosis', type: 'checkbox' },
              { label: 'Clubbing', type: 'checkbox' },
              { label: 'Chest deformity', type: 'checkbox' }
            ]
          },
          {
            title: 'Palpation',
            fields: [
              { label: 'Chest expansion', type: 'textarea' },
              { label: 'Tactile fremitus', type: 'textarea' }
            ]
          },
          {
            title: 'Percussion',
            fields: [
              { label: 'Resonance', type: 'textarea' }
            ]
          },
          {
            title: 'Auscultation',
            fields: [
              { label: 'Breath sounds', type: 'textarea' },
              { label: 'Added sounds', type: 'textarea' }
            ]
          },
          {
            title: 'Exercise Assessment',
            fields: [
              { label: 'Functional capacity', type: 'textarea' },
              { label: 'Exercise response', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Functional Tests',
        tests: [
          { name: '6MWT', resultOptions: ['Normal', 'Below normal'] },
          { name: '2MWT', resultOptions: ['Normal', 'Below normal'] },
          { name: 'Incremental Shuttle Walk Test', resultOptions: ['Completed', 'Stopped early'] },
          { name: 'Sit-to-Stand tests', resultOptions: ['Normal', 'Impaired'] },
          { name: 'Borg exertion/dyspnoea rating', resultOptions: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] }
        ]
      },
      {
        group: 'Respiratory Measures',
        tests: [
          { name: 'Peak flow', resultOptions: ['Normal', 'Reduced'] },
          { name: 'Spirometry results interpretation', resultOptions: ['Normal', 'Obstructive', 'Restrictive', 'Mixed'] },
          { name: 'MIP/MEP', resultOptions: ['Normal', 'Reduced'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: '6MWT distance', unit: 'meters' },
      { name: '2MWT distance', unit: 'meters' },
      { name: 'Borg RPE', maxScore: 10 },
      { name: 'Borg Dyspnoea', maxScore: 10 },
      { name: 'Peak flow', unit: 'L/min' },
      { name: 'FEV1', unit: '%predicted' },
      { name: 'FVC', unit: '%predicted' }
    ]
  },
  {
    name: 'Paediatric',
    icon: '👶',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Antenatal history', type: 'textarea' },
              { label: 'Birth history', type: 'textarea' },
              { label: 'NICU history', type: 'textarea' },
              { label: 'Developmental history', type: 'textarea' },
              { label: 'Milestones', type: 'textarea' },
              { label: 'Family history', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Observation',
            fields: [
              { label: 'Posture', type: 'textarea' },
              { label: 'Head control', type: 'dropdown', options: ['Good', 'Fair', 'Poor', 'Absent'] },
              { label: 'Movement patterns', type: 'textarea' }
            ]
          },
          {
            title: 'Developmental Assessment',
            fields: [
              { label: 'Gross motor milestones', type: 'textarea' },
              { label: 'Fine motor screening', type: 'textarea' },
              { label: 'Functional mobility', type: 'textarea' }
            ]
          },
          {
            title: 'Neurological',
            fields: [
              { label: 'Tone', type: 'textarea' },
              { label: 'Reflexes', type: 'textarea' },
              { label: 'Primitive reflexes', type: 'textarea' },
              { label: 'Postural reactions', type: 'textarea' }
            ]
          },
          {
            title: 'Musculoskeletal',
            fields: [
              { label: 'ROM', type: 'textarea' },
              { label: 'Deformities', type: 'textarea' },
              { label: 'Contractures', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Developmental Scales',
        tests: [
          { name: 'GMFCS', resultOptions: ['Level I', 'Level II', 'Level III', 'Level IV', 'Level V'] },
          { name: 'GMFM', resultOptions: ['Assessed'] },
          { name: 'Modified Ashworth Scale', resultOptions: ['0', '1', '1+', '2', '3', '4'] },
          { name: 'HINE', resultOptions: ['Assessed'] },
          { name: 'AIMS', resultOptions: ['Assessed'] }
        ]
      },
      {
        group: 'Cerebral Palsy',
        tests: [
          { name: 'Spasticity assessment', resultOptions: ['Mild', 'Moderate', 'Severe'] },
          { name: 'Selective motor control', resultOptions: ['Good', 'Fair', 'Poor'] },
          { name: 'Functional classification', resultOptions: ['Level I', 'Level II', 'Level III', 'Level IV', 'Level V'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'GMFM-66', maxScore: 100, unit: '%' },
      { name: 'GMFM-88', maxScore: 100, unit: '%' },
      { name: 'GMFCS Level', maxScore: 5 },
      { name: 'HINE Score', maxScore: 78 }
    ]
  },
  {
    name: 'Geriatric',
    icon: '🧓',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Falls', type: 'textarea' },
              { label: 'Medications', type: 'textarea' },
              { label: 'Mobility', type: 'textarea' },
              { label: 'ADLs', type: 'textarea' },
              { label: 'Previous fractures', type: 'textarea' },
              { label: 'Assistive devices', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Physical Assessment',
            fields: [
              { label: 'Posture', type: 'textarea' },
              { label: 'ROM', type: 'textarea' },
              { label: 'Strength', type: 'textarea' },
              { label: 'Balance', type: 'textarea' },
              { label: 'Gait', type: 'textarea' },
              { label: 'Transfers', type: 'textarea' }
            ]
          },
          {
            title: 'Functional',
            fields: [
              { label: 'Bed mobility', type: 'dropdown', options: ['Independent', 'Supervision', 'Minimal assist', 'Moderate assist', 'Dependent'] },
              { label: 'Sit-to-stand', type: 'dropdown', options: ['Independent', 'Supervision', 'Minimal assist', 'Moderate assist', 'Dependent'] },
              { label: 'Walking', type: 'dropdown', options: ['Independent', 'Supervision', 'Minimal assist', 'Moderate assist', 'Dependent'] },
              { label: 'Stairs', type: 'dropdown', options: ['Independent', 'Supervision', 'Minimal assist', 'Moderate assist', 'Dependent'] }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Balance and Mobility',
        tests: [
          { name: 'TUG', resultOptions: ['<10s Normal', '10-20s Functional', '>20s Impaired'] },
          { name: 'Berg Balance Scale', resultOptions: ['0-20 High risk', '21-40 Medium risk', '41-56 Low risk'] },
          { name: '5 Times Sit-to-Stand', resultOptions: ['Normal', 'Impaired'] },
          { name: '30-Second Chair Stand', resultOptions: ['Normal', 'Below normal'] },
          { name: 'Functional Reach', resultOptions: ['Normal', 'Impaired'] },
          { name: '6MWT', resultOptions: ['Normal', 'Below normal'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'TUG', unit: 'seconds' },
      { name: 'Berg Balance Scale', maxScore: 56 },
      { name: '5 Times Sit-to-Stand', unit: 'seconds' },
      { name: '30-Second Chair Stand', unit: 'repetitions' },
      { name: 'Functional Reach', unit: 'cm' },
      { name: '6MWT', unit: 'meters' }
    ]
  },
  {
    name: 'Sports',
    icon: '🏃',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Sport', type: 'text' },
              { label: 'Position', type: 'text' },
              { label: 'Training volume', type: 'textarea' },
              { label: 'Mechanism of injury', type: 'textarea' },
              { label: 'Previous injuries', type: 'textarea' },
              { label: 'Return-to-sport goal', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Physical Assessment',
            fields: [
              { label: 'Observation', type: 'textarea' },
              { label: 'ROM', type: 'textarea' },
              { label: 'Strength', type: 'textarea' },
              { label: 'Flexibility', type: 'textarea' },
              { label: 'Movement quality', type: 'textarea' }
            ]
          },
          {
            title: 'Functional Assessment',
            fields: [
              { label: 'Squat', type: 'textarea' },
              { label: 'Single-leg squat', type: 'textarea' },
              { label: 'Landing', type: 'textarea' },
              { label: 'Cutting', type: 'textarea' },
              { label: 'Running mechanics', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Knee',
        tests: [
          { name: 'Lachman' },
          { name: 'Pivot shift' },
          { name: 'McMurray' }
        ]
      },
      {
        group: 'Ankle',
        tests: [
          { name: 'Anterior drawer' },
          { name: 'Talar tilt' }
        ]
      },
      {
        group: 'Functional Tests',
        tests: [
          { name: 'Single-leg hop', resultOptions: ['Symmetrical', 'Asymmetrical'] },
          { name: 'Triple hop', resultOptions: ['Symmetrical', 'Asymmetrical'] },
          { name: 'Crossover hop', resultOptions: ['Symmetrical', 'Asymmetrical'] },
          { name: 'Vertical jump', resultOptions: ['Normal', 'Reduced'] },
          { name: 'Y-Balance Test', resultOptions: ['Symmetrical', 'Asymmetrical'] },
          { name: 'Agility tests', resultOptions: ['Normal', 'Impaired'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'Limb Symmetry Index', maxScore: 100, unit: '%' },
      { name: 'Single-leg hop distance', unit: 'cm' },
      { name: 'Y-Balance composite', unit: '%' },
      { name: 'Vertical jump height', unit: 'cm' }
    ]
  },
  {
    name: "Women's Health",
    icon: '🤰',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Obstetric history', type: 'textarea' },
              { label: 'Pregnancy history', type: 'textarea' },
              { label: 'Delivery type', type: 'dropdown', options: ['Normal vaginal', 'Assisted vaginal', 'Caesarean'] },
              { label: 'Pelvic pain', type: 'checkbox' },
              { label: 'Urinary symptoms', type: 'textarea' },
              { label: 'Bowel symptoms', type: 'textarea' },
              { label: 'Sexual symptoms (with consent)', type: 'textarea' },
              { label: 'Menstrual history', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Posture and Alignment',
            fields: [
              { label: 'Posture', type: 'textarea' },
              { label: 'Lumbar spine', type: 'textarea' },
              { label: 'Pelvic alignment', type: 'textarea' }
            ]
          },
          {
            title: 'Musculoskeletal',
            fields: [
              { label: 'ROM', type: 'textarea' },
              { label: 'Strength', type: 'textarea' },
              { label: 'Abdominal muscle function', type: 'textarea' },
              { label: 'Breathing', type: 'textarea' }
            ]
          },
          {
            title: 'Pelvic Floor (with informed consent)',
            fields: [
              { label: 'Ability to contract', type: 'dropdown', options: ['Yes', 'No', 'Partial'] },
              { label: 'Relaxation', type: 'dropdown', options: ['Complete', 'Incomplete'] },
              { label: 'Endurance', type: 'textarea' },
              { label: 'Coordination', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Pelvic Assessments',
        tests: [
          { name: 'Diastasis recti measurement', resultOptions: ['Normal', 'Present'] },
          { name: 'Pelvic girdle pain provocation tests', resultOptions: ['Positive', 'Negative'] },
          { name: 'Active Straight Leg Raise', resultOptions: ['Positive', 'Negative'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'PFDI-20', maxScore: 300 },
      { name: 'Pelvic Floor Impact Questionnaire', maxScore: 300 },
      { name: 'ICIQ-SF', maxScore: 21 },
      { name: 'Diastasis recti width', unit: 'finger widths' }
    ]
  },
  {
    name: 'Hand Rehabilitation',
    icon: '✋',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Hand dominance', type: 'dropdown', options: ['Right', 'Left', 'Ambidextrous'] },
              { label: 'Occupation', type: 'text' },
              { label: 'Mechanism of injury', type: 'textarea' },
              { label: 'Surgery', type: 'textarea' },
              { label: 'Functional limitations', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Observation',
            fields: [
              { label: 'Swelling', type: 'checkbox' },
              { label: 'Scar', type: 'checkbox' },
              { label: 'Deformity', type: 'checkbox' },
              { label: 'Atrophy', type: 'checkbox' }
            ]
          },
          {
            title: 'ROM',
            fields: [
              { label: 'Wrist', type: 'textarea' },
              { label: 'MCP', type: 'textarea' },
              { label: 'PIP', type: 'textarea' },
              { label: 'DIP', type: 'textarea' }
            ]
          },
          {
            title: 'Strength',
            fields: [
              { label: 'Grip strength', type: 'text' },
              { label: 'Pinch strength', type: 'text' }
            ]
          },
          {
            title: 'Sensory',
            fields: [
              { label: 'Light touch', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Two-point discrimination', type: 'text' },
              { label: 'Semmes-Weinstein monofilaments', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Carpal Tunnel',
        tests: [
          { name: 'Phalen' },
          { name: 'Tinel' },
          { name: 'Durkan compression' }
        ]
      },
      {
        group: 'De Quervain',
        tests: [
          { name: 'Finkelstein' }
        ]
      },
      {
        group: 'Thumb',
        tests: [
          { name: 'CMC grind test' }
        ]
      },
      {
        group: 'Tendon',
        tests: [
          { name: 'Tendon gliding assessment', resultOptions: ['Normal', 'Impaired'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'Grip strength', unit: 'kg' },
      { name: 'Pinch strength', unit: 'kg' },
      { name: 'DASH', maxScore: 100 },
      { name: 'QuickDASH', maxScore: 100 }
    ]
  },
  {
    name: 'Burns Rehabilitation',
    icon: '🔥',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Cause of burn', type: 'textarea' },
              { label: 'Date', type: 'text' },
              { label: 'Depth', type: 'dropdown', options: ['Superficial', 'Superficial partial', 'Deep partial', 'Full thickness'] },
              { label: 'Percentage TBSA', type: 'number' },
              { label: 'Surgery/grafting', type: 'textarea' },
              { label: 'Healing stage', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Skin',
            fields: [
              { label: 'Scar', type: 'textarea' },
              { label: 'Pigmentation', type: 'textarea' },
              { label: 'Adhesions', type: 'checkbox' },
              { label: 'Hypertrophic scar', type: 'checkbox' }
            ]
          },
          {
            title: 'ROM',
            fields: [
              { label: 'Joint ROM', type: 'textarea' },
              { label: 'Contractures', type: 'textarea' }
            ]
          },
          {
            title: 'Strength',
            fields: [
              { label: 'MMT', type: 'textarea' },
              { label: 'Functional strength', type: 'textarea' }
            ]
          },
          {
            title: 'Function',
            fields: [
              { label: 'ADL', type: 'textarea' },
              { label: 'Mobility', type: 'textarea' },
              { label: 'Hand function', type: 'textarea' }
            ]
          },
          {
            title: 'Pain',
            fields: [
              { label: 'Resting pain', type: 'number' },
              { label: 'Movement pain', type: 'number' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Scar Assessment',
        tests: [
          { name: 'Vancouver Scar Scale', resultOptions: ['Assessed'] },
          { name: 'POSAS', resultOptions: ['Assessed'] }
        ]
      },
      {
        group: 'Other',
        tests: [
          { name: 'ROM measurement', resultOptions: ['Normal', 'Restricted'] },
          { name: 'Contracture assessment', resultOptions: ['Present', 'Absent'] },
          { name: 'Functional capacity', resultOptions: ['Independent', 'Assisted', 'Dependent'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'Vancouver Scar Scale', maxScore: 13 },
      { name: 'POSAS Observer', maxScore: 60 },
      { name: 'POSAS Patient', maxScore: 60 },
      { name: 'Percentage TBSA healed', maxScore: 100, unit: '%' }
    ]
  },
  {
    name: 'Amputee Rehabilitation',
    icon: '🦿',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Cause of amputation', type: 'textarea' },
              { label: 'Level', type: 'dropdown', options: ['Transtibial', 'Transfemoral', 'Through knee', 'Partial foot', 'Upper limb'] },
              { label: 'Date', type: 'text' },
              { label: 'Surgery', type: 'textarea' },
              { label: 'Comorbidities', type: 'textarea' },
              { label: 'Previous prosthesis', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Residual Limb',
            fields: [
              { label: 'Shape', type: 'dropdown', options: ['Conical', 'Cylindrical', 'Bulbous', 'Other'] },
              { label: 'Length', type: 'text' },
              { label: 'Skin', type: 'textarea' },
              { label: 'Scar', type: 'textarea' },
              { label: 'Swelling', type: 'dropdown', options: ['None', 'Mild', 'Moderate', 'Severe'] },
              { label: 'Tenderness', type: 'checkbox' }
            ]
          },
          {
            title: 'ROM',
            fields: [
              { label: 'Hip flexion contracture', type: 'text' },
              { label: 'Hip abduction contracture', type: 'text' },
              { label: 'Knee flexion contracture', type: 'text' }
            ]
          },
          {
            title: 'Strength',
            fields: [
              { label: 'Trunk', type: 'textarea' },
              { label: 'Hip muscles', type: 'textarea' },
              { label: 'Remaining limb', type: 'textarea' }
            ]
          },
          {
            title: 'Balance',
            fields: [
              { label: 'Sitting', type: 'dropdown', options: ['Independent', 'With support', 'Unable'] },
              { label: 'Standing', type: 'dropdown', options: ['Independent', 'With support', 'Unable'] }
            ]
          },
          {
            title: 'Functional Assessment',
            fields: [
              { label: 'Transfers', type: 'dropdown', options: ['Independent', 'Supervision', 'Minimal assist', 'Moderate assist', 'Dependent'] },
              { label: 'Wheelchair', type: 'dropdown', options: ['Independent', 'Supervision', 'Dependent'] },
              { label: 'Walking', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Amputee Assessments',
        tests: [
          { name: 'Amputee Mobility Predictor', resultOptions: ['Assessed'] },
          { name: 'TUG', resultOptions: ['<10s Normal', '10-20s Functional', '>20s Impaired'] },
          { name: '6MWT', resultOptions: ['Normal', 'Below normal'] },
          { name: '10MWT', resultOptions: ['Normal', 'Impaired'] },
          { name: 'Prosthetic fit and alignment observation', resultOptions: ['Good', 'Fair', 'Poor'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'Amputee Mobility Predictor', maxScore: 47 },
      { name: 'TUG', unit: 'seconds' },
      { name: '6MWT', unit: 'meters' },
      { name: '10MWT', unit: 'seconds' },
      { name: 'K-Level', maxScore: 4 }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    await Specialty.deleteMany({});
    console.log('Cleared existing specialties');

    await Specialty.insertMany(specialties);
    console.log(`Seeded ${specialties.length} specialties`);

    await mongoose.connection.close();
    console.log('Done');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
```

- [ ] **Step 5: Add seed script to backend/package.json**

Add to `"scripts"`:
```json
"seed": "node seed/specialties.js"
```

- [ ] **Step 6: Run the seed script**

```bash
cd backend
npm run seed
```

Expected: "Seeded 10 specialties" and "Done".

- [ ] **Step 7: Test specialty endpoints**

```bash
TOKEN="your_jwt_token_here"

# List all specialties
curl http://localhost:5000/api/specialties \
  -H "Authorization: Bearer $TOKEN"

# Get one specialty's full data (use an _id from the list above)
curl http://localhost:5000/api/specialties/SPECIALTY_ID_HERE \
  -H "Authorization: Bearer $TOKEN"
```

Expected: List shows 10 specialties with name and icon. Detail shows full sections, tests, and measures.

- [ ] **Step 8: Commit**

```bash
git add backend/models/Specialty.js backend/routes/specialties.js backend/seed/specialties.js backend/server.js backend/package.json
git commit -m "feat: add specialty model with seed data for all 10 specialties"
```

---

### Task 7: Select Specialty Page — Frontend

**Files:**
- Create: `frontend/src/pages/SelectSpecialty.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `GET /api/specialties` from Task 6
- Produces: Page showing 10 specialty cards, clicking one navigates to `/patients/:id/assess/:specialtyId`

- [ ] **Step 1: Create frontend/src/pages/SelectSpecialty.jsx**

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function SelectSpecialty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const res = await api.get('/specialties');
        setSpecialties(res.data.data);
      } catch (err) {
        console.error('Failed to fetch specialties');
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialties();
  }, []);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Select Specialty</h1>
      <p className="text-gray-600 mb-6">Choose a specialty to begin the assessment</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {specialties.map((s) => (
          <button key={s._id} onClick={() => navigate(`/patients/${id}/assess/${s._id}`)}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md text-center cursor-pointer border-2 border-transparent hover:border-blue-500">
            <span className="text-3xl block mb-2">{s.icon}</span>
            <span className="font-medium text-gray-800">{s.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add route to frontend/src/App.jsx**

Add import:
```jsx
import SelectSpecialty from './pages/SelectSpecialty';
```

Add route:
```jsx
<Route path="/patients/:id/assess" element={
  <ProtectedRoute><Navbar /><SelectSpecialty /></ProtectedRoute>
} />
```

- [ ] **Step 3: Test in browser**

1. Go to a patient detail page → click "New Assessment"
2. Should see 10 specialty cards with icons
3. Click one — should navigate to `/patients/:id/assess/:specialtyId` (will show blank page for now)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/SelectSpecialty.jsx frontend/src/App.jsx
git commit -m "feat: add select specialty page with 10 specialty cards"
```

---

### Task 8: Assessment Form Page and Assessment API — Full Assessment Flow

**Files:**
- Create: `backend/models/Assessment.js`
- Create: `backend/routes/assessments.js`
- Create: `frontend/src/pages/AssessmentForm.jsx`
- Create: `frontend/src/pages/AssessmentDetail.jsx`
- Modify: `backend/server.js`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Consumes: `GET /api/specialties/:id` from Task 6, `auth` middleware from Task 2, Patient from Task 4
- Produces: `POST /api/assessments`, `GET /api/assessments/patient/:patientId`, `GET /api/assessments/:id`, AssessmentForm page that renders dynamic form from specialty data, AssessmentDetail page that displays a filled assessment

- [ ] **Step 1: Create backend/models/Assessment.js**

```javascript
const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true },
  specialtyName: { type: String, required: true },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  commonFields: {
    patientName: String,
    age: Number,
    gender: String,
    diagnosis: String,
    vas: Number,
    nprs: Number
  },
  findings: { type: mongoose.Schema.Types.Mixed, default: {} },
  specialTestResults: { type: mongoose.Schema.Types.Mixed, default: {} },
  outcomeScores: { type: mongoose.Schema.Types.Mixed, default: {} },
  problemList: [String],
  goals: {
    shortTerm: [String],
    longTerm: [String]
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Assessment', assessmentSchema);
```

- [ ] **Step 2: Create backend/routes/assessments.js**

```javascript
const express = require('express');
const Assessment = require('../models/Assessment');
const auth = require('../middleware/auth');
const sendResponse = require('../utils/response');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const assessment = await Assessment.create({
      ...req.body,
      therapistId: req.user.id
    });
    sendResponse(res, 201, true, assessment, 'Assessment saved successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const assessments = await Assessment.find({
      patientId: req.params.patientId,
      therapistId: req.user.id
    }).sort({ date: -1 });
    sendResponse(res, 200, true, assessments, 'Assessments fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const assessment = await Assessment.findOne({
      _id: req.params.id,
      therapistId: req.user.id
    });
    if (!assessment) return sendResponse(res, 404, false, null, 'Assessment not found', 'Assessment not found');
    sendResponse(res, 200, true, assessment, 'Assessment fetched successfully');
  } catch (err) {
    sendResponse(res, 500, false, null, 'Server error', err.message);
  }
});

module.exports = router;
```

- [ ] **Step 3: Register assessment routes in backend/server.js**

Add after specialty routes:
```javascript
app.use('/api/assessments', require('./routes/assessments'));
```

- [ ] **Step 4: Create frontend/src/pages/AssessmentForm.jsx**

```jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function AssessmentForm() {
  const { id: patientId, specialtyId } = useParams();
  const navigate = useNavigate();
  const [specialty, setSpecialty] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [commonFields, setCommonFields] = useState({
    patientName: '', age: '', gender: '', diagnosis: '', vas: '', nprs: ''
  });
  const [findings, setFindings] = useState({});
  const [specialTestResults, setSpecialTestResults] = useState({});
  const [outcomeScores, setOutcomeScores] = useState({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [specRes, patRes] = await Promise.all([
          api.get(`/specialties/${specialtyId}`),
          api.get(`/patients/${patientId}`)
        ]);
        setSpecialty(specRes.data.data);
        setPatient(patRes.data.data);
        setCommonFields({
          patientName: patRes.data.data.name,
          age: patRes.data.data.age,
          gender: patRes.data.data.gender,
          diagnosis: patRes.data.data.diagnosis || '',
          vas: '',
          nprs: ''
        });
      } catch (err) {
        console.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId, specialtyId]);

  const updateFinding = (sectionTitle, subsectionTitle, fieldLabel, value) => {
    const key = `${sectionTitle}|${subsectionTitle}|${fieldLabel}`;
    setFindings(prev => ({ ...prev, [key]: value }));
  };

  const updateTestResult = (testName, value) => {
    setSpecialTestResults(prev => ({ ...prev, [testName]: value }));
  };

  const updateOutcomeScore = (measureName, value) => {
    setOutcomeScores(prev => ({ ...prev, [measureName]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const assessment = await api.post('/assessments', {
        patientId,
        specialtyId,
        specialtyName: specialty.name,
        commonFields: {
          ...commonFields,
          age: Number(commonFields.age),
          vas: commonFields.vas ? Number(commonFields.vas) : null,
          nprs: commonFields.nprs ? Number(commonFields.nprs) : null
        },
        findings,
        specialTestResults,
        outcomeScores,
        notes
      });
      navigate(`/patients/${patientId}/assessments/${assessment.data.data._id}`);
    } catch (err) {
      console.error('Failed to save assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (sectionTitle, subsectionTitle, field) => {
    const key = `${sectionTitle}|${subsectionTitle}|${field.label}`;
    const value = findings[key] || '';

    switch (field.type) {
      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!value}
              onChange={(e) => updateFinding(sectionTitle, subsectionTitle, field.label, e.target.checked)}
              className="w-4 h-4 text-blue-600" />
            <span className="text-sm">{field.label}</span>
          </label>
        );
      case 'dropdown':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <select value={value}
              onChange={(e) => updateFinding(sectionTitle, subsectionTitle, field.label, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );
      case 'textarea':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <textarea value={value} rows={2}
              onChange={(e) => updateFinding(sectionTitle, subsectionTitle, field.label, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        );
      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input type="number" value={value}
              onChange={(e) => updateFinding(sectionTitle, subsectionTitle, field.label, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        );
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input type="text" value={value}
              onChange={(e) => updateFinding(sectionTitle, subsectionTitle, field.label, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        );
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!specialty || !patient) return <div className="text-center py-10">Not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">{specialty.icon} {specialty.name} Assessment</h1>
      <p className="text-gray-600 mb-6">Patient: {patient.name}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Common Fields */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={commonFields.patientName} readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" value={commonFields.age} readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <input type="text" value={commonFields.gender} readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
              <input type="text" value={commonFields.diagnosis}
                onChange={(e) => setCommonFields(prev => ({ ...prev, diagnosis: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAS (0-10)</label>
              <input type="number" min="0" max="10" value={commonFields.vas}
                onChange={(e) => setCommonFields(prev => ({ ...prev, vas: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NPRS (0-10)</label>
              <input type="number" min="0" max="10" value={commonFields.nprs}
                onChange={(e) => setCommonFields(prev => ({ ...prev, nprs: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Dynamic Sections */}
        {specialty.sections.map((section) => (
          <div key={section.title} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
            {section.subsections.map((sub) => (
              <div key={sub.title} className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-3 border-b pb-1">{sub.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sub.fields.map((field) => (
                    <div key={field.label}>
                      {renderField(section.title, sub.title, field)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Special Tests */}
        {specialty.specialTests.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Special Tests</h2>
            {specialty.specialTests.map((group) => (
              <div key={group.group} className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-3 border-b pb-1">{group.group}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.tests.map((test) => (
                    <div key={test.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{test.name}</label>
                      <select value={specialTestResults[test.name] || ''}
                        onChange={(e) => updateTestResult(test.name, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Not tested</option>
                        {test.resultOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Outcome Measures */}
        {specialty.outcomeMeasures.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Outcome Measures</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specialty.outcomeMeasures.map((measure) => (
                <div key={measure.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {measure.name}
                    {measure.maxScore && <span className="text-gray-400"> (max: {measure.maxScore})</span>}
                    {measure.unit && <span className="text-gray-400"> ({measure.unit})</span>}
                  </label>
                  <input type="number" value={outcomeScores[measure.name] || ''}
                    onChange={(e) => updateOutcomeScore(measure.name, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Therapist Notes</h2>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400">
          {submitting ? 'Saving...' : 'Submit Assessment'}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Create frontend/src/pages/AssessmentDetail.jsx**

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

export default function AssessmentDetail() {
  const { id: patientId, assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await api.get(`/assessments/${assessmentId}`);
        setAssessment(res.data.data);
      } catch (err) {
        console.error('Failed to fetch assessment');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [assessmentId]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!assessment) return <div className="text-center py-10">Assessment not found</div>;

  const { commonFields, findings, specialTestResults, outcomeScores, notes } = assessment;

  const filledFindings = Object.entries(findings || {}).filter(([, v]) => v && v !== false);
  const filledTests = Object.entries(specialTestResults || {}).filter(([, v]) => v);
  const filledScores = Object.entries(outcomeScores || {}).filter(([, v]) => v);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{assessment.specialtyName} Assessment</h1>
          <p className="text-gray-600">{new Date(assessment.date).toLocaleDateString()}</p>
        </div>
        <Link to={`/patients/${patientId}`} className="text-blue-600 hover:underline">Back to Patient</Link>
      </div>

      {/* Patient Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Patient Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Name:</span> {commonFields?.patientName}</div>
          <div><span className="text-gray-500">Age:</span> {commonFields?.age}</div>
          <div><span className="text-gray-500">Gender:</span> {commonFields?.gender}</div>
          <div><span className="text-gray-500">Diagnosis:</span> {commonFields?.diagnosis || 'N/A'}</div>
          <div><span className="text-gray-500">VAS:</span> {commonFields?.vas ?? 'N/A'}/10</div>
          <div><span className="text-gray-500">NPRS:</span> {commonFields?.nprs ?? 'N/A'}/10</div>
        </div>
      </div>

      {/* Findings */}
      {filledFindings.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Assessment Findings</h2>
          <div className="space-y-2 text-sm">
            {filledFindings.map(([key, value]) => {
              const parts = key.split('|');
              const label = parts[parts.length - 1];
              const section = parts[0];
              return (
                <div key={key} className="flex justify-between border-b pb-1">
                  <span className="text-gray-600">{section} &gt; {label}</span>
                  <span className="font-medium">{value === true ? 'Present' : value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Special Tests */}
      {filledTests.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Special Test Results</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {filledTests.map(([name, result]) => (
              <div key={name} className="flex justify-between border-b pb-1">
                <span className="text-gray-600">{name}</span>
                <span className="font-medium">{result}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outcome Scores */}
      {filledScores.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Outcome Measure Scores</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {filledScores.map(([name, score]) => (
              <div key={name} className="flex justify-between border-b pb-1">
                <span className="text-gray-600">{name}</span>
                <span className="font-medium">{score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Therapist Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Add routes to frontend/src/App.jsx**

Add imports:
```jsx
import AssessmentForm from './pages/AssessmentForm';
import AssessmentDetail from './pages/AssessmentDetail';
```

Add routes:
```jsx
<Route path="/patients/:id/assess/:specialtyId" element={
  <ProtectedRoute><Navbar /><AssessmentForm /></ProtectedRoute>
} />
<Route path="/patients/:id/assessments/:assessmentId" element={
  <ProtectedRoute><Navbar /><AssessmentDetail /></ProtectedRoute>
} />
```

- [ ] **Step 7: Test the full assessment flow in browser**

1. Go to patient detail → "New Assessment"
2. Select a specialty (e.g., Orthopaedic)
3. Should see: patient info at top, then Assessment (Subjective), History, Physical Examination with all subsections, Special Tests grouped by body region, Outcome Measures, Notes
4. Fill some fields → Submit
5. Should redirect to Assessment Detail showing all filled data
6. Go back to patient detail — assessment should appear in the list

- [ ] **Step 8: Commit**

```bash
git add backend/models/Assessment.js backend/routes/assessments.js backend/server.js frontend/src/
git commit -m "feat: add full assessment flow - dynamic form, save, and view"
```

---

### Task 9: Problem List Generator and Goal Templates

**Files:**
- Modify: `frontend/src/pages/AssessmentForm.jsx`
- Modify: `frontend/src/pages/AssessmentDetail.jsx`

**Interfaces:**
- Consumes: Assessment form state from Task 8
- Produces: Auto-suggested problem list based on findings, editable short-term and long-term goal templates

- [ ] **Step 1: Add problem list and goals section to AssessmentForm.jsx**

Add state variables after the `notes` state:
```jsx
const [problemList, setProblemList] = useState([]);
const [goals, setGoals] = useState({ shortTerm: [''], longTerm: [''] });
```

Add a function to generate suggested problems (place after `updateOutcomeScore`):
```jsx
const generateProblems = () => {
  const problems = [];
  const vas = Number(commonFields.vas);
  const nprs = Number(commonFields.nprs);

  if (vas >= 7 || nprs >= 7) problems.push('Severe pain');
  else if (vas >= 4 || nprs >= 4) problems.push('Moderate pain');
  else if (vas >= 1 || nprs >= 1) problems.push('Mild pain');

  Object.entries(findings).forEach(([key, value]) => {
    const label = key.split('|').pop();
    if (value === true) {
      if (['Swelling', 'Muscle wasting', 'Deformity', 'Stiffness', 'Instability'].includes(label)) {
        problems.push(label);
      }
      if (['Spasticity', 'Rigidity', 'Hypotonia'].includes(label)) {
        problems.push(`Abnormal tone - ${label}`);
      }
    }
    if (typeof value === 'string' && value.toLowerCase().includes('impaired')) {
      problems.push(`Impaired ${label.toLowerCase()}`);
    }
    if (typeof value === 'string' && value.toLowerCase().includes('reduced')) {
      problems.push(`Reduced ${label.toLowerCase()}`);
    }
  });

  Object.entries(specialTestResults).forEach(([name, result]) => {
    if (result === 'Positive') problems.push(`Positive ${name}`);
  });

  setProblemList(prev => [...new Set([...prev, ...problems])]);
};

const addProblem = () => setProblemList(prev => [...prev, '']);
const updateProblem = (index, value) => setProblemList(prev => prev.map((p, i) => i === index ? value : p));
const removeProblem = (index) => setProblemList(prev => prev.filter((_, i) => i !== index));

const addGoal = (type) => setGoals(prev => ({ ...prev, [type]: [...prev[type], ''] }));
const updateGoal = (type, index, value) => setGoals(prev => ({
  ...prev, [type]: prev[type].map((g, i) => i === index ? value : g)
}));
const removeGoal = (type, index) => setGoals(prev => ({
  ...prev, [type]: prev[type].filter((_, i) => i !== index)
}));
```

Add the problem list and goals sections in the form JSX (before the Notes section):
```jsx
{/* Problem List */}
<div className="bg-white p-6 rounded-lg shadow">
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-lg font-semibold">Problem List</h2>
    <div className="flex gap-2">
      <button type="button" onClick={generateProblems}
        className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200">
        Auto-Suggest
      </button>
      <button type="button" onClick={addProblem}
        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">
        + Add
      </button>
    </div>
  </div>
  {problemList.map((problem, i) => (
    <div key={i} className="flex gap-2 mb-2">
      <span className="text-sm text-gray-500 py-2">{i + 1}.</span>
      <input type="text" value={problem}
        onChange={(e) => updateProblem(i, e.target.value)}
        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <button type="button" onClick={() => removeProblem(i)}
        className="text-red-500 hover:text-red-700 text-sm px-2">Remove</button>
    </div>
  ))}
</div>

{/* Goals */}
<div className="bg-white p-6 rounded-lg shadow">
  <h2 className="text-lg font-semibold mb-4">Treatment Goals</h2>
  <div className="mb-4">
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-md font-medium text-gray-700">Short-term Goals</h3>
      <button type="button" onClick={() => addGoal('shortTerm')}
        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">+ Add</button>
    </div>
    {goals.shortTerm.map((goal, i) => (
      <div key={i} className="flex gap-2 mb-2">
        <input type="text" value={goal} placeholder="e.g., Reduce pain to 4/10"
          onChange={(e) => updateGoal('shortTerm', i, e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="button" onClick={() => removeGoal('shortTerm', i)}
          className="text-red-500 hover:text-red-700 text-sm px-2">Remove</button>
      </div>
    ))}
  </div>
  <div>
    <div className="flex justify-between items-center mb-2">
      <h3 className="text-md font-medium text-gray-700">Long-term Goals</h3>
      <button type="button" onClick={() => addGoal('longTerm')}
        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">+ Add</button>
    </div>
    {goals.longTerm.map((goal, i) => (
      <div key={i} className="flex gap-2 mb-2">
        <input type="text" value={goal} placeholder="e.g., Independent walking without aid"
          onChange={(e) => updateGoal('longTerm', i, e.target.value)}
          className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="button" onClick={() => removeGoal('longTerm', i)}
          className="text-red-500 hover:text-red-700 text-sm px-2">Remove</button>
      </div>
    ))}
  </div>
</div>
```

Update the `handleSubmit` to include problemList and goals in the POST body:
```jsx
problemList: problemList.filter(p => p.trim()),
goals: {
  shortTerm: goals.shortTerm.filter(g => g.trim()),
  longTerm: goals.longTerm.filter(g => g.trim())
},
```

- [ ] **Step 2: Add problem list and goals display to AssessmentDetail.jsx**

Add before the Notes section:
```jsx
{/* Problem List */}
{assessment.problemList?.length > 0 && (
  <div className="bg-white p-6 rounded-lg shadow mb-6">
    <h2 className="text-lg font-semibold mb-3">Problem List</h2>
    <ol className="list-decimal list-inside text-sm space-y-1">
      {assessment.problemList.map((p, i) => <li key={i}>{p}</li>)}
    </ol>
  </div>
)}

{/* Goals */}
{(assessment.goals?.shortTerm?.length > 0 || assessment.goals?.longTerm?.length > 0) && (
  <div className="bg-white p-6 rounded-lg shadow mb-6">
    <h2 className="text-lg font-semibold mb-3">Treatment Goals</h2>
    {assessment.goals.shortTerm?.length > 0 && (
      <div className="mb-3">
        <h3 className="text-md font-medium text-gray-700 mb-1">Short-term</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          {assessment.goals.shortTerm.map((g, i) => <li key={i}>{g}</li>)}
        </ul>
      </div>
    )}
    {assessment.goals.longTerm?.length > 0 && (
      <div>
        <h3 className="text-md font-medium text-gray-700 mb-1">Long-term</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          {assessment.goals.longTerm.map((g, i) => <li key={i}>{g}</li>)}
        </ul>
      </div>
    )}
  </div>
)}
```

- [ ] **Step 3: Test in browser**

1. Start a new assessment, fill some fields (set VAS to 8, check Swelling, set a special test to Positive)
2. Click "Auto-Suggest" on the Problem List — should populate problems
3. Add/edit/remove problems manually
4. Add short-term and long-term goals
5. Submit — assessment detail should show problems and goals

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/AssessmentForm.jsx frontend/src/pages/AssessmentDetail.jsx
git commit -m "feat: add problem list generator and editable goal templates"
```

---

### Task 10: Progress Tracking with Charts

**Files:**
- Modify: `frontend/src/pages/PatientDetail.jsx`

**Interfaces:**
- Consumes: `GET /api/assessments/patient/:patientId` from Task 8
- Produces: Comparison table and Recharts line charts on patient detail page showing VAS, NPRS, and outcome scores over time

- [ ] **Step 1: Install Recharts**

```bash
cd frontend
npm install recharts
```

- [ ] **Step 2: Update frontend/src/pages/PatientDetail.jsx**

Replace the full component with:

```jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, assessmentsRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/assessments/patient/${id}`)
        ]);
        setPatient(patientRes.data.data);
        setAssessments(assessmentsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch patient data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!patient) return <div className="text-center py-10">Patient not found</div>;

  const sortedAssessments = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));

  const painChartData = sortedAssessments
    .filter(a => a.commonFields?.vas != null || a.commonFields?.nprs != null)
    .map(a => ({
      date: new Date(a.date).toLocaleDateString(),
      VAS: a.commonFields?.vas,
      NPRS: a.commonFields?.nprs
    }));

  const allOutcomeNames = [...new Set(sortedAssessments.flatMap(a => Object.keys(a.outcomeScores || {})))];
  const outcomeChartData = sortedAssessments.map(a => {
    const row = { date: new Date(a.date).toLocaleDateString() };
    allOutcomeNames.forEach(name => {
      if (a.outcomeScores?.[name]) row[name] = Number(a.outcomeScores[name]);
    });
    return row;
  });

  const colors = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#f59e0b', '#06b6d4', '#ec4899'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h1 className="text-2xl font-bold mb-4">{patient.name}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Age:</span> {patient.age}</div>
          <div><span className="text-gray-500">Gender:</span> {patient.gender}</div>
          <div><span className="text-gray-500">Diagnosis:</span> {patient.diagnosis || 'N/A'}</div>
          <div><span className="text-gray-500">Date:</span> {new Date(patient.date).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Progress Charts */}
      {painChartData.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Pain Progress</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={painChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis domain={[0, 10]} fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="VAS" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="NPRS" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {outcomeChartData.length > 1 && allOutcomeNames.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Outcome Measures Progress</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={outcomeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              {allOutcomeNames.map((name, i) => (
                <Line key={name} type="monotone" dataKey={name}
                  stroke={colors[i % colors.length]} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparison Table */}
      {sortedAssessments.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Assessment Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Parameter</th>
                  {sortedAssessments.map((a, i) => (
                    <th key={a._id} className="text-center py-2 px-2">
                      {i === 0 ? 'Initial' : `Visit ${i + 1}`}<br />
                      <span className="text-xs text-gray-500">{new Date(a.date).toLocaleDateString()}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4 text-gray-600">VAS</td>
                  {sortedAssessments.map(a => (
                    <td key={a._id} className="text-center py-2">{a.commonFields?.vas ?? '-'}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 text-gray-600">NPRS</td>
                  {sortedAssessments.map(a => (
                    <td key={a._id} className="text-center py-2">{a.commonFields?.nprs ?? '-'}</td>
                  ))}
                </tr>
                {allOutcomeNames.map(name => (
                  <tr key={name} className="border-b">
                    <td className="py-2 pr-4 text-gray-600">{name}</td>
                    {sortedAssessments.map(a => (
                      <td key={a._id} className="text-center py-2">{a.outcomeScores?.[name] ?? '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Assessments</h2>
        <Link to={`/patients/${id}/assess`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          New Assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg shadow">No assessments yet.</p>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <Link key={a._id} to={`/patients/${id}/assessments/${a._id}`}
              className="block bg-white p-4 rounded-lg shadow hover:shadow-md">
              <div className="flex justify-between">
                <span className="font-medium">{a.specialtyName}</span>
                <span className="text-gray-500 text-sm">{new Date(a.date).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Test in browser**

1. Create 2+ assessments for the same patient (with VAS/NPRS and outcome scores)
2. Go to patient detail page
3. Should see: Pain Progress chart (VAS and NPRS lines), Outcome Measures chart, Comparison table
4. Charts should only appear when there are 2+ assessments

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/PatientDetail.jsx frontend/package.json frontend/package-lock.json
git commit -m "feat: add progress tracking with comparison table and Recharts"
```

---

### Task 11: PDF Report Generation

**Files:**
- Create: `frontend/src/utils/pdfGenerator.js`
- Modify: `frontend/src/pages/AssessmentDetail.jsx`

**Interfaces:**
- Consumes: Assessment data from Task 8
- Produces: `generatePDF(assessment)` function that creates and downloads a PDF report, "Download PDF" button on AssessmentDetail page

- [ ] **Step 1: Install jsPDF**

```bash
cd frontend
npm install jspdf
```

- [ ] **Step 2: Create frontend/src/utils/pdfGenerator.js**

```javascript
import jsPDF from 'jspdf';

export function generatePDF(assessment) {
  const doc = new jsPDF();
  let y = 20;
  const pageHeight = 280;
  const margin = 20;

  const checkPageBreak = (needed = 10) => {
    if (y + needed > pageHeight) {
      doc.addPage();
      y = 20;
    }
  };

  const addTitle = (text) => {
    checkPageBreak(15);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(text, margin, y);
    y += 8;
    doc.setDrawColor(200);
    doc.line(margin, y, 190, y);
    y += 5;
  };

  const addSubTitle = (text) => {
    checkPageBreak(10);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(text, margin, y);
    y += 6;
  };

  const addRow = (label, value) => {
    checkPageBreak(8);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`${label}: ${value}`, margin + 5, y);
    y += 5;
  };

  // Header
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('PhysioCheck Assessment Report', margin, y);
  y += 10;
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`${assessment.specialtyName} Assessment`, margin, y);
  y += 6;
  doc.text(`Date: ${new Date(assessment.date).toLocaleDateString()}`, margin, y);
  y += 10;

  // Patient Info
  addTitle('Patient Information');
  const cf = assessment.commonFields || {};
  addRow('Name', cf.patientName || 'N/A');
  addRow('Age', cf.age || 'N/A');
  addRow('Gender', cf.gender || 'N/A');
  addRow('Diagnosis', cf.diagnosis || 'N/A');
  addRow('VAS', cf.vas != null ? `${cf.vas}/10` : 'N/A');
  addRow('NPRS', cf.nprs != null ? `${cf.nprs}/10` : 'N/A');
  y += 5;

  // Findings
  const filledFindings = Object.entries(assessment.findings || {}).filter(([, v]) => v && v !== false);
  if (filledFindings.length > 0) {
    addTitle('Assessment Findings');
    let currentSection = '';
    filledFindings.forEach(([key, value]) => {
      const parts = key.split('|');
      const section = parts[0];
      const label = parts[parts.length - 1];
      if (section !== currentSection) {
        currentSection = section;
        addSubTitle(section);
      }
      addRow(label, value === true ? 'Present' : value);
    });
    y += 5;
  }

  // Special Tests
  const filledTests = Object.entries(assessment.specialTestResults || {}).filter(([, v]) => v);
  if (filledTests.length > 0) {
    addTitle('Special Test Results');
    filledTests.forEach(([name, result]) => addRow(name, result));
    y += 5;
  }

  // Outcome Scores
  const filledScores = Object.entries(assessment.outcomeScores || {}).filter(([, v]) => v);
  if (filledScores.length > 0) {
    addTitle('Outcome Measure Scores');
    filledScores.forEach(([name, score]) => addRow(name, score));
    y += 5;
  }

  // Problem List
  if (assessment.problemList?.length > 0) {
    addTitle('Problem List');
    assessment.problemList.forEach((p, i) => {
      checkPageBreak(8);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`${i + 1}. ${p}`, margin + 5, y);
      y += 5;
    });
    y += 5;
  }

  // Goals
  if (assessment.goals?.shortTerm?.length > 0 || assessment.goals?.longTerm?.length > 0) {
    addTitle('Treatment Goals');
    if (assessment.goals.shortTerm?.length > 0) {
      addSubTitle('Short-term Goals');
      assessment.goals.shortTerm.forEach(g => addRow('-', g));
    }
    if (assessment.goals.longTerm?.length > 0) {
      addSubTitle('Long-term Goals');
      assessment.goals.longTerm.forEach(g => addRow('-', g));
    }
    y += 5;
  }

  // Notes
  if (assessment.notes) {
    addTitle('Therapist Notes');
    checkPageBreak(15);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const lines = doc.splitTextToSize(assessment.notes, 170);
    lines.forEach(line => {
      checkPageBreak(6);
      doc.text(line, margin + 5, y);
      y += 5;
    });
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Generated by PhysioCheck | Page ${i} of ${pageCount}`, margin, 290);
  }

  const patientName = (cf.patientName || 'patient').replace(/\s+/g, '_');
  doc.save(`PhysioCheck_${patientName}_${assessment.specialtyName}_${new Date(assessment.date).toISOString().split('T')[0]}.pdf`);
}
```

- [ ] **Step 3: Add PDF button to AssessmentDetail.jsx**

Add import at top:
```jsx
import { generatePDF } from '../utils/pdfGenerator';
```

Add a "Download PDF" button next to the "Back to Patient" link in the header:
```jsx
<div className="flex gap-3">
  <button onClick={() => generatePDF(assessment)}
    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
    Download PDF
  </button>
  <Link to={`/patients/${patientId}`} className="text-blue-600 hover:underline py-2">Back to Patient</Link>
</div>
```

- [ ] **Step 4: Test in browser**

1. Go to a completed assessment detail page
2. Click "Download PDF"
3. PDF should download with patient name, specialty, and date in filename
4. Open the PDF — should have all sections: patient info, findings, tests, scores, problems, goals, notes
5. Test with a long assessment to verify page breaks work

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/pdfGenerator.js frontend/src/pages/AssessmentDetail.jsx frontend/package.json frontend/package-lock.json
git commit -m "feat: add PDF report generation with jsPDF"
```

---
