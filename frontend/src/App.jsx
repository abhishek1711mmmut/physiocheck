import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewPatient from './pages/NewPatient';
import PatientDetail from './pages/PatientDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Navbar /><Dashboard /></ProtectedRoute>
          } />
          <Route path="/patients/new" element={
            <ProtectedRoute><Navbar /><NewPatient /></ProtectedRoute>
          } />
          <Route path="/patients/:id" element={
            <ProtectedRoute><Navbar /><PatientDetail /></ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
