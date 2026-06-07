import { useEffect, useState, useRef, useCallback, useReducer } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RiskMap from '../../components/map/RiskMap';
import AlertBanner from '../../components/common/AlertBanner';
import AIAssistant from '../../components/chatbot/AIAssistant';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { setZones } from '../../redux/slices/riskSlice';
import { setAlerts } from '../../redux/slices/alertSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import {
  Bot,
  X,
  AlertTriangle,
  Clock,
  Map,
  Calendar,
  X as CloseIcon,
  Volume2,
  VolumeX,
} from 'lucide-react';

// ─── Siren State Machine ─────────────────────────────────────────────────────
//
//  Phases:
//    idle          → no critical/danger alert active
//    ringing       → unacknowledged alert, siren playing + overlay blinking
//    muted_overlay → user dismissed overlay (siren off, overlay still blinks)
//    muted_ack     → user acknowledged from panel (siren off, overlay still blinks)
//
//  Transitions enforced here — nothing else touches siren phase directly.

const SIREN_ACTIONS = {
  NEW_ALERT: 'NEW_ALERT', // brand-new alert _id arrived
  ACK_ALERT: 'ACK_ALERT', // user acknowledged from left panel
  MUTE_OVERLAY: 'MUTE_OVERLAY', // user clicked outside overlay
  TOGGLE_SIREN: 'TOGGLE_SIREN', // siren on/off button inside overlay
  CLEAR: 'CLEAR', // no critical/danger alerts remain → full reset
};

const initialSirenState = {
  phase: 'idle', // 'idle' | 'ringing' | 'muted_overlay' | 'muted_ack'
  activeAlertId: null,
  seenAlertIds: new Set(),
};

function sirenReducer(state, action) {
  switch (action.type) {
    case SIREN_ACTIONS.NEW_ALERT: {
      const { alertId } = action.payload;
      // Always ring on a genuinely new alert — even if currently muted
      if (state.seenAlertIds.has(alertId)) return state;
      return {
        phase: 'ringing',
        activeAlertId: alertId,
        seenAlertIds: new Set([...state.seenAlertIds, alertId]),
      };
    }

    case SIREN_ACTIONS.ACK_ALERT: {
      // Silence siren for this alert; overlay keeps blinking
      if (state.phase === 'idle') return state;
      return { ...state, phase: 'muted_ack' };
    }

    case SIREN_ACTIONS.MUTE_OVERLAY: {
      // Dismissed overlay — mute siren, keep overlay blinking
      if (state.phase === 'idle') return state;
      return { ...state, phase: 'muted_overlay' };
    }

    case SIREN_ACTIONS.TOGGLE_SIREN: {
      if (state.phase === 'ringing') return { ...state, phase: 'muted_overlay' };
      if (state.phase === 'muted_overlay' || state.phase === 'muted_ack') {
        return { ...state, phase: 'ringing' };
      }
      return state;
    }

    case SIREN_ACTIONS.CLEAR: {
      // Zone is safe — full reset
      return { ...initialSirenState, seenAlertIds: new Set() };
    }

    default:
      return state;
  }
}

// ─── useSiren hook ────────────────────────────────────────────────────────────
// Owns all Web Audio API logic. Purely driven by the `active` boolean.
// No siren state leaks into the dashboard component.

function useSiren(active) {
  const audioContextRef = useRef(null);
  const sirenActiveRef = useRef(false);
  const timeoutRef = useRef(null);

  const getAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        return null;
      }
    }
    if (audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch {
        return null;
      }
    }
    return audioContextRef.current.state === 'running' ? audioContextRef.current : null;
  }, []);

  const playTone = useCallback((ctx, frequency, startTime, duration) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(frequency, startTime);
    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }, []);

  const stopSiren = useCallback(() => {
    sirenActiveRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const playCycle = useCallback(async () => {
    if (!sirenActiveRef.current) return;
    const ctx = await getAudioContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    playTone(ctx, 1100, t, 0.3);
    playTone(ctx, 700, t + 0.3, 0.2);
    playTone(ctx, 1100, t + 0.5, 0.2);
    timeoutRef.current = setTimeout(() => {
      if (sirenActiveRef.current) playCycle();
    }, 1000);
  }, [getAudioContext, playTone]);

  const startSiren = useCallback(async () => {
    if (sirenActiveRef.current) return;
    const ctx = await getAudioContext();
    if (!ctx) return;
    sirenActiveRef.current = true;
    playCycle();
  }, [getAudioContext, playCycle]);

  // Resume AudioContext on any user gesture (browser requirement)
  useEffect(() => {
    const resume = async () => {
      if (audioContextRef.current?.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
        } catch {}
      }
    };
    document.addEventListener('click', resume);
    document.addEventListener('touchstart', resume);
    document.addEventListener('keydown', resume);
    return () => {
      document.removeEventListener('click', resume);
      document.removeEventListener('touchstart', resume);
      document.removeEventListener('keydown', resume);
    };
  }, []);

  // React to `active` changes
  useEffect(() => {
    if (active) {
      startSiren();
    } else {
      stopSiren();
    }
  }, [active, startSiren, stopSiren]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSiren();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stopSiren]);
}

// ─── MinerDashboard ───────────────────────────────────────────────────────────

const MinerDashboard = () => {
  const reduxDispatch = useDispatch();
  const [sirenState, sirenDispatch] = useReducer(sirenReducer, initialSirenState);

  const [aiOpen, setAiOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const alerts = useSelector((state) => state.alerts.alerts).slice(0, 3);
  const zones = useSelector((state) => state.risk.zones);
  const lastUpdated = useSelector((state) => state.risk.lastUpdated);
  const loading = useSelector((state) => state.risk.loading);

  // Derived — active alert object for overlay display
  const activeAlert =
    alerts.find((a) => a._id === sirenState.activeAlertId) ||
    alerts.find(
      (a) => (a.alertLevel === 'critical' || a.alertLevel === 'danger') && !a.acknowledged,
    ) ||
    null;

  // Siren plays only when phase is 'ringing'
  useSiren(sirenState.phase === 'ringing');

  // ─── Data fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [zonesRes, alertsRes, assignmentsRes] = await Promise.all([
          api.get('/zones'),
          api.get('/alerts/my'),
          api.get('/work-assignments/my'),
        ]);
        reduxDispatch(setZones(zonesRes.data.zones || []));
        reduxDispatch(setAlerts(alertsRes.data.alerts || []));
        setAssignments(assignmentsRes.data.assignments || []);
      } catch {
        toast.error('Failed to load dashboard data');
      }
    })();
  }, [reduxDispatch]);

  // ─── Alert → siren state machine driver ──────────────────────────────────────
  useEffect(() => {
    const criticalAlerts = alerts.filter(
      (a) => (a.alertLevel === 'critical' || a.alertLevel === 'danger') && !a.acknowledged,
    );
    const anyCriticalOrDanger = alerts.some(
      (a) => a.alertLevel === 'critical' || a.alertLevel === 'danger',
    );

    if (!anyCriticalOrDanger) {
      // No critical/danger alerts at all — zone is safe
      sirenDispatch({ type: SIREN_ACTIONS.CLEAR });
      return;
    }

    // Fire NEW_ALERT for each unacknowledged alert not yet seen
    for (const alert of criticalAlerts) {
      if (!sirenState.seenAlertIds.has(alert._id)) {
        sirenDispatch({ type: SIREN_ACTIONS.NEW_ALERT, payload: { alertId: alert._id } });
        // Only process the first new one per cycle — reducer will catch the rest next render
        break;
      }
    }
    // seenAlertIds intentionally excluded — we read it but don't want it as a dep
    // (it lives inside the reducer, changes to it re-run via sirenState.phase)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts]);

  // ─── Overlay visibility ───────────────────────────────────────────────────────
  // Show overlay whenever there are any critical/danger alerts (ack'd or not)
  // and phase is not idle. Hide only when zone is truly safe (CLEAR fired).
  const showOverlay =
    sirenState.phase !== 'idle' &&
    alerts.some((a) => a.alertLevel === 'critical' || a.alertLevel === 'danger');

  // ─── Derived values ───────────────────────────────────────────────────────────
  const highRiskCount = zones.filter(
    (z) => z.riskLevel === 'high' || z.riskLevel === 'critical',
  ).length;

  if (loading) return <LoadingSpinner message="Loading dashboard..." />;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 7.5rem)' }}>
      {/* ── Critical Alert Overlay ───────────────────────────────────────────── */}
      {showOverlay && (
        <>
          <style>{`
            @keyframes overlayPulse {
              0%, 100% { background: rgba(255,0,0,0.05); }
              50%       { background: rgba(255,0,0,0.15); }
            }
            @keyframes blink {
              0%, 50%, 100% { opacity: 1; }
              25%, 75%      { opacity: 0.3; }
            }
          `}</style>

          {/* Blinking backdrop — always present while overlay is active.
              pointer-events:none once modal is dismissed so panels stay usable. */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 200,
              animation: 'overlayPulse 1s infinite',
              pointerEvents: 'none',
            }}
          />

          {/* Modal — only rendered until user clicks outside */}
          {sirenState.phase === 'ringing' && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 201,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(2px)',
              }}
              onClick={() => sirenDispatch({ type: SIREN_ACTIONS.MUTE_OVERLAY })}
            >
              <div
                className="panel"
                style={{
                  maxWidth: 600,
                  padding: '2rem',
                  textAlign: 'center',
                  border: '2px solid var(--red)',
                  background: 'rgba(255,0,0,0.05)',
                  position: 'relative',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ marginBottom: '1.5rem', animation: 'blink 0.5s infinite' }}>
                  <AlertTriangle size={60} style={{ color: 'var(--red)', margin: '0 auto' }} />
                </div>

                <h2
                  style={{
                    fontFamily: 'var(--font-head)',
                    fontSize: '1.8rem',
                    color: 'var(--red)',
                    margin: '1rem 0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {activeAlert?.alertLevel === 'critical'
                    ? '🚨 CRITICAL HAZARD'
                    : '⚠️ HIGH RISK ALERT'}
                </h2>

                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    color: 'var(--text-primary)',
                    margin: '1.5rem 0',
                    lineHeight: 1.6,
                  }}
                >
                  {activeAlert?.alertMessage}
                </p>

                <div
                  style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    marginTop: '2rem',
                  }}
                >
                  <button
                    onClick={() => sirenDispatch({ type: SIREN_ACTIONS.TOGGLE_SIREN })}
                    className="btn-cyber"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'var(--red)',
                    }}
                  >
                    <Volume2 size={16} /> SIREN ON
                  </button>
                </div>

                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    marginTop: '1.5rem',
                  }}
                >
                  Click outside to dismiss and mute siren. Warning remains until the area is
                  declared safe.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Left Panel ──────────────────────────────────────────────────────── */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div className="panel" style={{ padding: '1rem 1.1rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
          >
            <AlertTriangle size={12} style={{ color: 'var(--red)' }} />
            <span className="cyber-label">High Risk Zones</span>
          </div>
          <p
            className={`stat-number ${highRiskCount > 0 ? 'stat-number-red' : 'stat-number-green'}`}
          >
            {highRiskCount}
          </p>
        </div>

        <div className="panel" style={{ padding: '1rem 1.1rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
          >
            <Map size={12} style={{ color: 'var(--cyan)' }} />
            <span className="cyber-label">Active Zones</span>
          </div>
          <p className="stat-number">{zones.length}</p>
        </div>

        <div className="panel" style={{ padding: '1rem 1.1rem' }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}
          >
            <Clock size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="cyber-label">Last Updated</span>
          </div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
            }}
          >
            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'N/A'}
          </p>
        </div>

        {/* Recent Alerts */}
        <div className="panel" style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          <p className="cyber-label" style={{ marginBottom: '0.75rem' }}>
            Recent Alerts
          </p>
          {alerts.length === 0 ? (
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
              }}
            >
              NO ACTIVE ALERTS
            </p>
          ) : (
            alerts.map((a) => (
              <AlertBanner
                key={a._id}
                alert={a}
                // When acknowledged from the panel, mute siren for this alert
                onAcknowledge={() => sirenDispatch({ type: SIREN_ACTIONS.ACK_ALERT })}
              />
            ))
          )}
        </div>

        {/* My Assignments */}
        <div className="panel" style={{ flex: 1, overflow: 'auto', padding: '1rem' }}>
          <p className="cyber-label" style={{ marginBottom: '0.75rem' }}>
            My Assignments
          </p>
          {assignments.length === 0 ? (
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--text-muted)',
              }}
            >
              NO ASSIGNMENTS
            </p>
          ) : (
            assignments.slice(0, 3).map((assignment) => (
              <div
                key={assignment._id}
                style={{
                  padding: '0.5rem',
                  marginBottom: '0.5rem',
                  border: '1px solid rgba(0,229,255,0.1)',
                  borderRadius: 4,
                  background: 'rgba(0,229,255,0.05)',
                  cursor: 'pointer',
                }}
                onClick={() => setSelectedAssignment(assignment)}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  <Calendar size={12} style={{ color: 'var(--cyan)' }} />
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {new Date(assignment.scheduledStart).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                    })}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-head)',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    margin: '0.25rem 0',
                  }}
                >
                  {assignment.workType}
                </p>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Zone: {assignment.zoneId?.zoneName || 'Unknown'}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.65rem',
                      color:
                        assignment.status === 'completed'
                          ? 'var(--green)'
                          : assignment.status === 'in_progress'
                            ? 'var(--amber)'
                            : 'var(--text-muted)',
                    }}
                  >
                    {assignment.status.toUpperCase()}
                  </span>
                </div>
                {assignment.assignedUsers?.length > 0 && (
                  <p
                    style={{
                      marginTop: '0.45rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Assigned: {assignment.assignedUsers.map((u) => u.fullName).join(', ')}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Map ─────────────────────────────────────────────────────────────── */}
      <div className="panel" style={{ flex: 1, overflow: 'hidden', padding: 0 }}>
        <RiskMap />
      </div>

      {/* ── AI Button ───────────────────────────────────────────────────────── */}
      <button
        onClick={() => setAiOpen((prev) => !prev)}
        className="btn-cyber"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 50,
          borderRadius: 50,
          padding: '0.65rem 1rem',
          gap: '0.4rem',
          boxShadow: aiOpen ? 'none' : '0 0 20px rgba(0,229,255,0.3)',
        }}
      >
        {aiOpen ? (
          <X size={16} />
        ) : (
          <>
            <Bot size={16} />
            <span>AI ASSISTANT</span>
          </>
        )}
      </button>

      {/* ── AI Panel ────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: '4.5rem',
          right: '1.5rem',
          zIndex: 40,
          width: 320,
          height: 460,
          transition: 'all 0.3s ease',
          opacity: aiOpen ? 1 : 0,
          transform: aiOpen ? 'translateY(0)' : 'translateY(16px)',
          pointerEvents: aiOpen ? 'auto' : 'none',
        }}
      >
        <AIAssistant />
      </div>

      {/* ── Assignment Detail Overlay ────────────────────────────────────────── */}
      {selectedAssignment && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
          onClick={() => setSelectedAssignment(null)}
        >
          <div
            className="panel"
            style={{ maxWidth: 500, width: '100%', padding: '1.5rem', position: 'relative' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAssignment(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.25rem',
              }}
            >
              <CloseIcon size={20} />
            </button>
            <h2
              style={{
                fontFamily: 'var(--font-head)',
                fontSize: '1.2rem',
                color: 'var(--text-primary)',
                marginBottom: '1rem',
              }}
            >
              Work Assignment Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="cyber-label">Work Type</label>
                <p
                  style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', margin: '0.25rem 0' }}
                >
                  {selectedAssignment.workType}
                </p>
              </div>
              <div>
                <label className="cyber-label">Zone</label>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    margin: '0.25rem 0',
                  }}
                >
                  {selectedAssignment.zoneId?.zoneName || 'Unknown'} (
                  {selectedAssignment.zoneId?.zoneType || 'N/A'})
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="cyber-label">Start Time</label>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      margin: '0.25rem 0',
                    }}
                  >
                    {new Date(selectedAssignment.scheduledStart).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                    })}
                  </p>
                </div>
                <div>
                  <label className="cyber-label">End Time</label>
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      margin: '0.25rem 0',
                    }}
                  >
                    {new Date(selectedAssignment.scheduledEnd).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                    })}
                  </p>
                </div>
              </div>
              <div>
                <label className="cyber-label">Assigned Users</label>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    margin: '0.25rem 0',
                  }}
                >
                  {selectedAssignment.assignedUsers?.length > 0
                    ? selectedAssignment.assignedUsers.map((u) => u.fullName).join(', ')
                    : `${selectedAssignment.assignedUserIds?.length || 0} user(s)`}
                </p>
              </div>
              <div>
                <label className="cyber-label">Required Equipment</label>
                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.8rem',
                    margin: '0.25rem 0',
                  }}
                >
                  {selectedAssignment.requiredEquipment?.join(', ') || 'None'}
                </p>
              </div>
              <div>
                <label className="cyber-label">Status</label>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color:
                      selectedAssignment.status === 'completed'
                        ? 'var(--green)'
                        : selectedAssignment.status === 'in_progress'
                          ? '#ffc800'
                          : 'var(--text-muted)',
                    background:
                      selectedAssignment.status === 'completed'
                        ? 'rgba(0,255,136,0.1)'
                        : selectedAssignment.status === 'in_progress'
                          ? 'rgba(255,200,0,0.1)'
                          : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${
                      selectedAssignment.status === 'completed'
                        ? 'rgba(0,255,136,0.25)'
                        : selectedAssignment.status === 'in_progress'
                          ? 'rgba(255,200,0,0.25)'
                          : 'rgba(255,255,255,0.1)'
                    }`,
                    borderRadius: 4,
                    padding: '0.25rem 0.5rem',
                    marginTop: '0.25rem',
                    display: 'inline-block',
                  }}
                >
                  {selectedAssignment.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinerDashboard;
