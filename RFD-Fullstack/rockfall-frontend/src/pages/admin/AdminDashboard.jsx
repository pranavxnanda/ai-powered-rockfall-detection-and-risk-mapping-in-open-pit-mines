import { useState, useEffect } from 'react';
import { Activity, Users, Cpu, AlertTriangle } from 'lucide-react';
import RiskTrendChart from '../../components/charts/RiskTrendChart';
import IncidentChart from '../../components/charts/IncidentChart';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, accentColor = 'var(--cyan)' }) => (
  <div
    className="panel"
    style={{ padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${accentColor}18`,
        border: `1px solid ${accentColor}40`,
      }}
    >
      <Icon size={18} style={{ color: accentColor }} />
    </div>
    <div>
      <p className="cyber-label">{label}</p>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '1.5rem',
          color: accentColor,
          lineHeight: 1.1,
          marginTop: '0.2rem',
        }}
      >
        {value}
      </p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSensors: 0,
    totalSensors: 0,
    unresolvedAlerts: 0,
    systemUptime: '99.8%',
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [usersRes, sensorsRes, alertsRes] = await Promise.all([
        api.get('/users'),
        api.get('/sensors'),
        api.get('/alerts'),
      ]);

      const users = usersRes.data.users || [];
      const sensors = sensorsRes.data.sensors || [];
      const alerts = alertsRes.data.alerts || [];

      setStats({
        totalUsers: users.length,
        activeSensors: sensors.filter(s => s.status === 'active').length,
        totalSensors: sensors.length,
        unresolvedAlerts: alerts.filter(a => a.acknowledgments.length === 0).length,
        systemUptime: '99.8%', 
      });
    } catch (error) {
      toast.error('Failed to fetch dashboard stats.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        paddingTop: '0.5rem',
        paddingBottom: '2rem',
      }}
    >
      <div>
        <h1 className="cyber-title" style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>
          ADMIN DASHBOARD
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
          }}
        >
          SYSTEM OVERVIEW — REAL-TIME PERFORMANCE METRICS
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem' }}>
        <StatCard
          icon={Users}
          label="Total Users"
          value={loading ? '...' : stats.totalUsers}
          accentColor="var(--cyan)"
        />
        <StatCard
          icon={Cpu}
          label="Active Sensors"
          value={loading ? '...' : `${stats.activeSensors}/${stats.totalSensors}`}
          accentColor="var(--green)"
        />
        <StatCard
          icon={AlertTriangle}
          label="Unresolved Alerts"
          value={loading ? '...' : stats.unresolvedAlerts}
          accentColor="var(--red)"
        />
        <StatCard
          icon={Activity}
          label="System Uptime"
          value={stats.systemUptime}
          accentColor="var(--amber)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="panel" style={{ padding: '1.25rem', height: 280 }}>
          <p className="cyber-label" style={{ marginBottom: '1rem' }}>
            RISK TREND — LAST 7 DAYS
          </p>
          <RiskTrendChart />
        </div>
        <div className="panel" style={{ padding: '1.25rem', height: 280 }}>
          <p className="cyber-label" style={{ marginBottom: '1rem' }}>
            INCIDENT HISTORY
          </p>
          <IncidentChart />
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
