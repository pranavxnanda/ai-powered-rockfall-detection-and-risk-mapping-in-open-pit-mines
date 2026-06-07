import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, CheckCircle, X } from 'lucide-react';
import { acknowledgeAlert } from '../../redux/slices/alertSlice';
import { getRiskBadgeClass, formatTimestamp } from '../../utils/riskHelpers';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import AllAlertsPanel from './AllAlertsPanel';

const NotificationPanel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const alerts = useSelector((state) => state.alerts.alerts);
  const unreadCount = useSelector((state) => state.alerts.unreadCount);
  const user = useSelector((state) => state.auth.user);
  const [isOpen, setIsOpen] = useState(false);
  const [allAlertsOpen, setAllAlertsOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAcknowledge = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/acknowledge`);
      dispatch(acknowledgeAlert(alertId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    if (user?.role === 'miner') navigate('/miner/alerts');
    else setAllAlertsOpen(true);
  };

  return (
    <>
      <div style={{ position: 'relative' }} ref={panelRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'relative',
            background: 'transparent',
            border: '1px solid var(--cyan-border)',
            borderRadius: 8,
            padding: '0.4rem',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0,229,255,0.08)';
            e.currentTarget.style.color = 'var(--cyan)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: 'var(--red)',
                border: '1px solid var(--bg-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: '#fff',
                boxShadow: '0 0 8px rgba(255,26,75,0.5)',
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '2.5rem',
              width: 360,
              maxHeight: 380,
              background: 'var(--bg-card)',
              border: '1px solid var(--cyan-border)',
              borderRadius: 12,
              boxShadow: '0 0 40px rgba(0,0,0,0.6), 0 0 20px rgba(0,229,255,0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 100,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid rgba(0,229,255,0.1)',
                background: 'rgba(0,229,255,0.03)',
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: 'var(--font-head)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  NOTIFICATIONS
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.62rem',
                    color: 'var(--text-muted)',
                    margin: 0,
                  }}
                >
                  {unreadCount} UNREAD
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={15} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {alerts.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2.5rem 1rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <CheckCircle size={36} style={{ marginBottom: '0.5rem', opacity: 0.4 }} />
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      letterSpacing: '0.08em',
                    }}
                  >
                    ALL CLEAR
                  </p>
                </div>
              ) : (
                alerts.slice(0, 10).map((alert) => (
                  <div
                    key={alert._id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderBottom: '1px solid rgba(0,229,255,0.06)',
                      background: !alert.acknowledged ? 'rgba(0,229,255,0.03)' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <span className={getRiskBadgeClass(alert.alertLevel)}>
                        {alert.alertLevel?.toUpperCase()}
                      </span>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(alert._id)}
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.62rem',
                            color: 'var(--cyan)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            letterSpacing: '0.06em',
                          }}
                        >
                          MARK READ
                        </button>
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: '0.8rem',
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
                ))
              )}
            </div>

            {alerts.length > 0 && (
              <div
                style={{
                  padding: '0.6rem 1rem',
                  borderTop: '1px solid rgba(0,229,255,0.1)',
                  background: 'rgba(0,229,255,0.02)',
                }}
              >
                <button
                  onClick={handleViewAll}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.65rem',
                    color: 'var(--cyan)',
                    letterSpacing: '0.1em',
                  }}
                >
                  VIEW ALL ALERTS →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <AllAlertsPanel isOpen={allAlertsOpen} onClose={() => setAllAlertsOpen(false)} />
    </>
  );
};
export default NotificationPanel;
