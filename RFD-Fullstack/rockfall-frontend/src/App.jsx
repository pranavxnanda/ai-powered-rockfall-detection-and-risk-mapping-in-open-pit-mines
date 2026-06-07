import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { verifyToken } from './redux/slices/authSlice';
import ProfileSettings from './pages/settings/ProfileSettings';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Unauthorized from './pages/auth/Unauthorized';
import MinerDashboard from './pages/miner/MinerDashboard';
import MinerAlerts from './pages/miner/MinerAlerts';
import MinerIncidentReport from './pages/miner/MinerIncidentReport';
import PlannerDashboard from './pages/planner/PlannerDashboard';
import PlannerReports from './pages/planner/PlannerReports';
import WorkAssignments from './pages/planner/WorkAssignments';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import SensorManagement from './pages/admin/SensorManagement';
import SystemHealth from './pages/admin/SystemHealth';
import useSocket from './hooks/useSocket';
import { ROLES } from './constants';

const AppLayout = ({ children }) => (
  <div style={{ minHeight: '100vh', background: 'var(--bg-deep)' }}>
    <Navbar />
    <main
      style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem', paddingTop: '5.5rem' }}
    >
      {children}
    </main>
  </div>
);

const App = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch, token]);

  useSocket(token);
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--cyan-border)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
          },
          success: { iconTheme: { primary: 'var(--green)', secondary: 'var(--bg-card)' } },
          error: { iconTheme: { primary: 'var(--red)', secondary: 'var(--bg-card)' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route
          path="/miner/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.MINER]}>
              <AppLayout>
                <Routes>
                  <Route path="dashboard" element={<MinerDashboard />} />
                  <Route path="alerts" element={<MinerAlerts />} />
                  <Route path="report" element={<MinerIncidentReport />} />
                  <Route path="profile" element={<ProfileSettings />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/planner/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.PLANNER]}>
              <AppLayout>
                <Routes>
                  <Route path="dashboard" element={<PlannerDashboard />} />
                  <Route path="assignments" element={<WorkAssignments />} />
                  <Route path="reports" element={<PlannerReports />} />
                  <Route path="profile" element={<ProfileSettings />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
              <AppLayout>
                <Routes>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="sensors" element={<SensorManagement />} />
                  <Route path="health" element={<SystemHealth />} />
                  <Route path="profile" element={<ProfileSettings />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};
export default App;
