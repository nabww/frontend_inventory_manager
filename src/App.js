// App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, ThemeProvider } from './contexts';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/common';

import LoginPage        from './pages/LoginPage';
import DashboardPage    from './pages/DashboardPage';
import DeviceListPage   from './pages/DeviceListPage';
import DeviceDetailPage from './pages/DeviceDetailPage';
import { VerifyPage, FacilitiesPage, UsersPage, AuditLogPage } from './pages/OtherPages';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"       element={<GuestRoute><LoginPage/></GuestRoute>} />
            <Route path="/dashboard"   element={<ProtectedRoute><DashboardPage/></ProtectedRoute>} />
            <Route path="/devices"     element={<ProtectedRoute><DeviceListPage/></ProtectedRoute>} />
            <Route path="/devices/:id" element={<ProtectedRoute><DeviceDetailPage/></ProtectedRoute>} />
            <Route path="/verify"      element={<ProtectedRoute><VerifyPage/></ProtectedRoute>} />
            <Route path="/facilities"  element={<ProtectedRoute><FacilitiesPage/></ProtectedRoute>} />
            <Route path="/users"       element={<AdminRoute><UsersPage/></AdminRoute>} />
            <Route path="/audit-log"   element={<AdminRoute><AuditLogPage/></AdminRoute>} />
            <Route path="/"            element={<Navigate to="/dashboard" replace/>} />
            <Route path="*"            element={<Navigate to="/dashboard" replace/>} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          duration: 4000,
          style: { background:'var(--bg-card)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:'10px', fontSize:'.845rem', boxShadow:'var(--shadow-md)' },
          success: { iconTheme:{ primary:'#10b981', secondary:'white' } },
          error:   { iconTheme:{ primary:'#ef4444', secondary:'white' } },
        }}/>
      </AuthProvider>
    </ThemeProvider>
  );
}
