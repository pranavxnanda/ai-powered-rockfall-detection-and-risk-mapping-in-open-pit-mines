import { Cpu, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { formatTimestamp } from '../../utils/riskHelpers';

const mockSensors = [
  {
    _id: '1',
    sensorId: 'LDR-001',
    sensorType: 'lidar',
    status: 'active',
    lastCommunication: new Date().toISOString(),
  },
  {
    _id: '2',
    sensorId: 'LDR-002',
    sensorType: 'lidar',
    status: 'maintenance',
    lastCommunication: new Date(Date.now() - 36e5).toISOString(),
  },
  {
    _id: '3',
    sensorId: 'SES-001',
    sensorType: 'seismic',
    status: 'active',
    lastCommunication: new Date().toISOString(),
  },
  {
    _id: '4',
    sensorId: 'SES-002',
    sensorType: 'seismic',
    status: 'inactive',
    lastCommunication: new Date(Date.now() - 72e5).toISOString(),
  },
  {
    _id: '5',
    sensorId: 'SES-003',
    sensorType: 'seismic',
    status: 'active',
    lastCommunication: new Date().toISOString(),
  },
];

const statusStyle = {
  active: {
    color: 'var(--green)',
    bg: 'rgba(0,255,136,0.1)',
    border: 'rgba(0,255,136,0.25)',
    icon: CheckCircle,
  },
  maintenance: {
    color: '#ffc800',
    bg: 'rgba(255,200,0,0.1)',
    border: 'rgba(255,200,0,0.25)',
    icon: Clock,
  },
  inactive: {
    color: 'var(--red)',
    bg: 'rgba(255,26,75,0.1)',
    border: 'rgba(255,26,75,0.25)',
    icon: AlertCircle,
  },
};

const SensorManagement = () => {
  const active = mockSensors.filter((s) => s.status === 'active').length;
  const maintenance = mockSensors.filter((s) => s.status === 'maintenance').length;
  const inactive = mockSensors.filter((s) => s.status === 'inactive').length;

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
          <Cpu size={16} style={{ color: 'var(--cyan)' }} />
        </div>
        <div>
          <h1 className="cyber-title" style={{ fontSize: '1.3rem', margin: 0 }}>
            SENSOR MANAGEMENT
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            MONITOR AND CONFIGURE LIDAR & SEISMIC SENSORS
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
        {[
          ['ACTIVE', active, 'var(--green)'],
          ['MAINTENANCE', maintenance, '#ffc800'],
          ['INACTIVE', inactive, 'var(--red)'],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="panel"
            style={{
              padding: '1rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
            <div>
              <p className="cyber-label">{label}</p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.5rem',
                  color,
                  lineHeight: 1.1,
                  marginTop: '0.15rem',
                }}
              >
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="panel" style={{ overflow: 'hidden' }}>
        <table className="cyber-table">
          <thead>
            <tr>
              <th>Sensor ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Last Communication</th>
            </tr>
          </thead>
          <tbody>
            {mockSensors.map((s) => {
              const st = statusStyle[s.status];
              const Icon = st.icon;
              return (
                <tr key={s._id}>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--cyan)',
                      fontSize: '0.82rem',
                    }}
                  >
                    {s.sensorId}
                  </td>
                  <td
                    style={{
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                    }}
                  >
                    {s.sensorType}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.65rem',
                        letterSpacing: '0.06em',
                        color: st.color,
                        background: st.bg,
                        border: `1px solid ${st.border}`,
                        borderRadius: 4,
                        padding: '0.2rem 0.6rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      <Icon size={11} /> {s.status}
                    </span>
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {formatTimestamp(s.lastCommunication)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default SensorManagement;
