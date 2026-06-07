import { useSelector, useDispatch } from 'react-redux';
import { acknowledgeAlertAsync, fetchMyAlerts } from '../../redux/slices/alertSlice';
import { getRiskBadgeClass, formatTimestamp } from '../../utils/riskHelpers';
import { Bell, CheckCircle } from 'lucide-react';
import { useEffect } from 'react';

const levelColor = {
  critical: 'var(--red)',
  danger: 'var(--amber)',
  high: 'var(--amber)',
  moderate: '#ffc800',
  low: 'var(--green)',
};

const MinerAlerts = () => {
  const dispatch = useDispatch();
  const alerts = useSelector((state) => state.alerts.alerts);

  useEffect(() => {
    dispatch(fetchMyAlerts());
  }, [dispatch]);

  const sorted = [...alerts].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          paddingTop: '0.5rem',
        }}
      >
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
          <Bell size={16} style={{ color: 'var(--cyan)' }} />
        </div>
        <div>
          <h1 className="cyber-title" style={{ fontSize: '1.3rem', margin: 0 }}>
            MY ALERTS
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              margin: 0,
              letterSpacing: '0.08em',
            }}
          >
            ALL ALERTS ASSIGNED TO YOUR LOCATION
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            padding: '5rem 1rem',
          }}
        >
          <CheckCircle size={40} style={{ color: 'var(--green)', opacity: 0.5 }} />
          <p
            style={{
              fontFamily: 'var(--font-head)',
              fontSize: '1.1rem',
              color: 'var(--text-secondary)',
              letterSpacing: '0.1em',
            }}
          >
            ALL CLEAR
          </p>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
            }}
          >
            YOUR AREA IS CURRENTLY SAFE. STAY ALERT.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {sorted.map((alert) => {
            const color = levelColor[alert.alertLevel] || 'var(--cyan)';
            return (
              <div
                key={alert._id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  background: 'var(--bg-card)',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: `3px solid ${color}`,
                  padding: '0.9rem 1rem',
                  boxShadow: `0 0 16px ${color}12`,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.4rem',
                    }}
                  >
                    <span className={getRiskBadgeClass(alert.alertLevel)}>
                      {alert.alertLevel.toUpperCase()}
                    </span>
                    {alert.acknowledged && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.62rem',
                          color: 'var(--green)',
                        }}
                      >
                        <CheckCircle size={11} /> ACKNOWLEDGED
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                      margin: '0 0 0.25rem',
                    }}
                  >
                    {alert.alertMessage}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.62rem',
                      color: 'var(--text-muted)',
                      margin: 0,
                    }}
                  >
                    {formatTimestamp(alert.generatedAt)}
                  </p>
                </div>
                {!alert.acknowledged && (
                  <button
                    onClick={() => dispatch(acknowledgeAlertAsync(alert._id))}
                    className="btn-cyber"
                    style={{ padding: '0.3rem 0.7rem', fontSize: '0.68rem', flexShrink: 0 }}
                  >
                    ACKNOWLEDGE
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default MinerAlerts;
