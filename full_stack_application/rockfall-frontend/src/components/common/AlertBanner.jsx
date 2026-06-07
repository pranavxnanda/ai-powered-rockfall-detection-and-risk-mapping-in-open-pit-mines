import { getRiskBadgeClass, formatTimestamp } from '../../utils/riskHelpers';
import { useDispatch, useSelector } from 'react-redux';
import { acknowledgeAlertAsync } from '../../redux/slices/alertSlice';

const levelBorder = {
  critical: 'var(--red)',
  danger: 'var(--amber)',
  high: 'var(--amber)',
  moderate: '#ffc800',
  low: 'var(--green)',
};

const AlertBanner = ({ alert, onAcknowledge }) => {
  const dispatch = useDispatch();
  const color = levelBorder[alert.alertLevel] || 'var(--cyan)';

  const handleAck = async () => {
    const result = await dispatch(acknowledgeAlertAsync(alert._id));
    if (acknowledgeAlertAsync.fulfilled.match(result)) {
      // Tell the dashboard to mute siren for this alert
      onAcknowledge?.();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '0.75rem 0.9rem',
        marginBottom: '0.5rem',
        background: 'rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `3px solid ${color}`,
        borderRadius: 8,
        boxShadow: `0 0 12px ${color}18`,
      }}
    >
      <div style={{ flex: 1 }}>
        <span className={getRiskBadgeClass(alert.alertLevel)}>
          {alert.alertLevel?.toUpperCase()}
        </span>
        <p
          style={{
            margin: '0.45rem 0 0.2rem',
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
            lineHeight: 1.4,
          }}
        >
          {alert.alertMessage}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
          }}
        >
          {formatTimestamp(alert.generatedAt)}
        </p>
      </div>
      {!alert.acknowledged && (
        <button
          onClick={handleAck}
          className="btn-cyber"
          style={{
            padding: '0.25rem 0.6rem',
            fontSize: '0.65rem',
            marginLeft: '0.5rem',
            flexShrink: 0,
          }}
        >
          ACK
        </button>
      )}
    </div>
  );
};

export default AlertBanner;
