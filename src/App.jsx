import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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

function App() {
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
