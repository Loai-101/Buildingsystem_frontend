import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import { LanguageDirection } from './components/LanguageDirection';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Accounts } from './pages/Accounts';
import { AccountsMonth } from './pages/AccountsMonth';
import { Maintenance } from './pages/Maintenance';
import { MajlisBooking } from './pages/MajlisBooking';
import { UserManagement } from './pages/UserManagement';

function RoleBasedRedirect() {
  const role = useAuthStore((s) => s.role);
  return <Navigate to={role === 'Resident' ? '/accounts' : '/dashboard'} replace />;
}

function useBackendHealthCheck() {
  const warned = useRef(false);
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_URL || '';
    if (!apiBase.includes('localhost') || warned.current) return;
    const healthUrl = apiBase.replace(/\/api\/?$/, '') + '/api/health';
    axios.get(healthUrl, { timeout: 3000 }).catch(() => {
      if (!warned.current) {
        warned.current = true;
        toast.error('Backend not reachable. Start it to see data: in Buildingsystem_backend run "npm run dev"', { duration: 6000 });
      }
    });
  }, []);
}

function App() {
  useBackendHealthCheck();
  return (
    <BrowserRouter>
      <LanguageDirection />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleBasedRedirect />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="accounts/:year/:month" element={<AccountsMonth />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="majlis-booking" element={<MajlisBooking />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
        <Route path="*" element={<RoleBasedRedirect />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
