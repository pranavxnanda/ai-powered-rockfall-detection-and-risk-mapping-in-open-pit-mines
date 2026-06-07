import { useState, useEffect } from 'react';
import { Activity, Server, Database, Wifi } from 'lucide-react';
import { useSelector } from 'react-redux';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const logLevelStyle = { INFO: 'var(--cyan)', WARN: '#ffc800', ERROR: 'var(--red)' };

const HealthCard = ({ icon: Icon, label, value, status }) => {
  const statusColor =
    status === 'Healthy' ? 'var(--green)' : status === 'Warning' ? '#ffc800' : 'var(--red)';
  return (
    <div
      className="panel"
      style={{ padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          background: `${statusColor}15`,
          border: `1px solid ${statusColor}35`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={16} style={{ color: statusColor }} />
      </div>
      <div style={{ flex: 1 }}>
        <p className="cyber-label">{label}</p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.1rem',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
            marginTop: '0.15rem',
          }}
        >
          {value}
        </p>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          letterSpacing: '0.08em',
          color: statusColor,
          background: `${statusColor}15`,
          border: `1px solid ${statusColor}30`,
          borderRadius: 4,
          padding: '0.15rem 0.5rem',
        }}
      >
        {status.toUpperCase()}
      </span>
    </div>
  );
};

const SystemHealth = () => {
  const connected = useSelector((state) => state.socket.connected);
  const [metrics, setMetrics] = useState({
    cpuUsage: '0%',
    memoryUsage: '0%',
    dbResponseTime: '0ms',
    apiResponseTime: '0ms',
    activeSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const response = await api.get('/health');
      setMetrics(response.data);
    } catch (error) {
      toast.error('Failed to fetch system health.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'rgba(0,229,255,0.1)',
            border: '1px solid var(--cyan-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Activity size={16} style={{ color: 'var(--cyan)' }} />
        </div>
        <div>
          <h1 className="cyber-title" style={{ fontSize: '1.3rem', margin: 0 }}>
            SYSTEM HEALTH
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            SERVER & DATABASE PERFORMANCE METRICS
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <HealthCard
          icon={Server}
          label="CPU USAGE"
          value={loading ? '...' : metrics.cpuUsage}
          status={parseInt(metrics.cpuUsage) > 80 ? 'Warning' : 'Healthy'}
        />
        <HealthCard
          icon={Server}
          label="MEMORY USAGE"
          value={loading ? '...' : metrics.memoryUsage}
          status={parseInt(metrics.memoryUsage) > 80 ? 'Warning' : 'Healthy'}
        />
        <HealthCard
          icon={Database}
          label="DB RESPONSE"
          value={loading ? '...' : metrics.dbResponseTime}
          status={parseInt(metrics.dbResponseTime.replace('ms', '')) > 100 ? 'Warning' : 'Healthy'}
        />
        <HealthCard
          icon={Activity}
          label="API RESPONSE"
          value={loading ? '...' : metrics.apiResponseTime}
          status={parseInt(metrics.apiResponseTime.replace('ms', '')) > 200 ? 'Warning' : 'Healthy'}
        />
        <HealthCard
          icon={Wifi}
          label="WEBSOCKET"
          value={connected ? 'Connected' : 'Disconnected'}
          status={connected ? 'Healthy' : 'Critical'}
        />
        <HealthCard
          icon={Activity}
          label="ACTIVE SESSIONS"
          value={loading ? '...' : metrics.activeSessions}
          status="Healthy"
        />
      </div>

      {/* System Log */}
      <div className="panel" style={{ padding: '1.25rem' }}>
        <p className="cyber-label" style={{ marginBottom: '1rem' }}>
          // SYSTEM LOGS
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {[
            { time: '14:32:01', level: 'INFO', msg: 'Risk assessment completed for Zone A' },
            { time: '14:31:45', level: 'INFO', msg: 'LiDAR data ingested from sensor LDR-001' },
            { time: '14:30:12', level: 'WARN', msg: 'Sensor SES-002 missed heartbeat' },
            { time: '14:29:55', level: 'INFO', msg: 'Alert generated for Zone C — High Risk' },
            { time: '14:28:30', level: 'INFO', msg: 'User arjun_m acknowledged alert #ALT-084' },
          ].map((log, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '1rem',
                padding: '0.4rem 0',
                borderBottom: '1px solid rgba(0,229,255,0.05)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                }}
              >
                {log.time}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: logLevelStyle[log.level],
                  flexShrink: 0,
                  minWidth: 40,
                }}
              >
                [{log.level}]
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                }}
              >
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default SystemHealth;
