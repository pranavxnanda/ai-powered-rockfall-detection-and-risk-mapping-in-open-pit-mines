import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import RiskMap from '../../components/map/RiskMap';
import { getRiskBadgeClass, getRiskLabel, formatTimestamp } from '../../utils/riskHelpers';
import { BarChart2, AlertTriangle, Map, CheckSquare, Bot, X } from 'lucide-react';
import RiskTrendChart from '../../components/charts/RiskTrendChart';
import AIAssistant from '../../components/chatbot/AIAssistant';
import { setZones } from '../../redux/slices/riskSlice';
import { setAlerts } from '../../redux/slices/alertSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const StatCard = ({ icon: Icon, label, value, color = 'var(--cyan)' }) => (
  <div
    className="panel"
    style={{ padding: '1rem 1.1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `${color}18`,
        border: `1px solid ${color}35`,
      }}
    >
      <Icon size={16} style={{ color }} />
    </div>
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
);

const PlannerDashboard = () => {
  const dispatch = useDispatch();
  const [aiOpen, setAiOpen] = useState(false);
  const zones = useSelector((state) => state.risk.zones);
  const alerts = useSelector((state) => state.alerts.alerts);
  const lastUpdated = useSelector((state) => state.risk.lastUpdated);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [zonesRes, alertsRes] = await Promise.all([api.get('/zones'), api.get('/alerts')]);
        dispatch(setZones(zonesRes.data.zones || []));
        dispatch(setAlerts(alertsRes.data.alerts || []));
      } catch {
        toast.error('Failed to load dashboard data');
      }
    };
    fetchData();
  }, [dispatch]);

  const criticalZones = zones.filter((z) => z.riskLevel === 'critical').length;
  const highZones = zones.filter((z) => z.riskLevel === 'high').length;
  const unacknowledged = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        paddingTop: '0.5rem',
        paddingBottom: '4rem',
      }}
    >
      <div>
        <h1 className="cyber-title" style={{ fontSize: '1.4rem', marginBottom: '0.2rem' }}>
          PLANNER DASHBOARD
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
          }}
        >
          RISK ANALYTICS
          {lastUpdated && <> — UPDATED {new Date(lastUpdated).toLocaleTimeString()}</>}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.75rem' }}>
        <StatCard icon={Map} label="Total Zones" value={zones.length} color="var(--cyan)" />
        <StatCard
          icon={AlertTriangle}
          label="Critical Zones"
          value={criticalZones}
          color="var(--red)"
        />
        <StatCard icon={BarChart2} label="High Risk Zones" value={highZones} color="var(--amber)" />
        <StatCard
          icon={CheckSquare}
          label="Unacked Alerts"
          value={unacknowledged}
          color="#ffc800"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="panel" style={{ height: 300, overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
            <p className="cyber-label">LIVE RISK MAP</p>
          </div>
          <div style={{ height: 'calc(100% - 40px)' }}>
            <RiskMap />
          </div>
        </div>
        <div className="panel" style={{ height: 300, padding: '1rem' }}>
          <p className="cyber-label" style={{ marginBottom: '0.75rem' }}>
            RISK TREND — 7 DAYS
          </p>
          <RiskTrendChart />
        </div>
      </div>

      {/* Zone Table */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(0,229,255,0.1)' }}>
          <p className="cyber-label">ZONE RISK SUMMARY</p>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Zone Name</th>
                <th>Type</th>
                <th>Risk Level</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {zones.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign: 'center',
                      padding: '2rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                    }}
                  >
                    NO ZONES LOADED
                  </td>
                </tr>
              ) : (
                zones.map((zone) => (
                  <tr key={zone._id}>
                    <td style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>
                      {zone.zoneName}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {zone.zoneType?.replace('_', ' ')}
                    </td>
                    <td>
                      <span className={getRiskBadgeClass(zone.riskLevel)}>
                        {getRiskLabel(zone.riskLevel)}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {zone.confidenceScore ? `${(zone.confidenceScore * 100).toFixed(1)}%` : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
    </div>
  );
};
export default PlannerDashboard;
