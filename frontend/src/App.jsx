import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NewPatient from './pages/NewPatient';
import AllPatients from './pages/AllPatients';
import PatientDetail from './pages/PatientDetail';
import SelectSpecialty from './pages/SelectSpecialty';
import AssessmentForm from './pages/AssessmentForm';
import AssessmentDetail from './pages/AssessmentDetail';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-center" toastOptions={{ duration: 1500 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Navbar /><Dashboard /></ProtectedRoute>
          } />
          <Route path="/patients" element={
            <ProtectedRoute><Navbar /><AllPatients /></ProtectedRoute>
          } />
          <Route path="/patients/new" element={
            <ProtectedRoute><Navbar /><NewPatient /></ProtectedRoute>
          } />
          <Route path="/patients/:id" element={
            <ProtectedRoute><Navbar /><PatientDetail /></ProtectedRoute>
          } />
          <Route path="/patients/:id/assess" element={
            <ProtectedRoute><Navbar /><SelectSpecialty /></ProtectedRoute>
          } />
          <Route path="/patients/:id/assess/:specialtyId" element={
            <ProtectedRoute><Navbar /><AssessmentForm /></ProtectedRoute>
          } />
          <Route path="/patients/:id/assessments/:assessmentId" element={
            <ProtectedRoute><Navbar /><AssessmentDetail /></ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
