import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Reception } from './pages/Reception';
import { Appointments } from './pages/Appointments';
import { MedicalRecords } from './pages/MedicalRecords';
import { Prescriptions } from './pages/Prescriptions';
import { Vaccinations } from './pages/Vaccinations';
import { PDV } from './pages/PDV';
import { Settings } from './pages/Settings';
import { TutorPortal } from './pages/TutorPortal';
import { TutorLogin } from './pages/TutorLogin';
import Veterinarians from './pages/Veterinarians';
import VeterinarianLogin from './pages/VeterinarianLogin';
import VeterinarianPortal from './pages/VeterinarianPortal';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/tutor" element={<TutorPortal />} />
          <Route path="/tutor/login" element={<TutorLogin />} />
          <Route path="/veterinarian-login" element={<VeterinarianLogin />} />
          <Route path="/veterinarian-portal" element={<VeterinarianPortal />} />

          <Route
            path="/clinic/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinic/reception"
            element={
              <ProtectedRoute>
                <Reception />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinic/appointments"
            element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinic/medical-records"
            element={
              <ProtectedRoute>
                <MedicalRecords />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinic/prescriptions"
            element={
              <ProtectedRoute>
                <Prescriptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinic/vaccinations"
            element={
              <ProtectedRoute>
                <Vaccinations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinic/pdv"
            element={
              <ProtectedRoute>
                <PDV />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinic/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinic/veterinarians"
            element={
              <ProtectedRoute>
                <Veterinarians />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
