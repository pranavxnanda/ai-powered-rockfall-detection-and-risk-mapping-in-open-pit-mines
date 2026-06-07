import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import IncidentChart from '../../components/charts/IncidentChart';
import { FileText, Download } from 'lucide-react';

const REPORT_TYPES = [
  { id: 'risk_summary', label: 'Risk Summary Report' },
  { id: 'incident_log', label: 'Incident Log Report' },
  { id: 'zone_analysis', label: 'Zone Analysis Report' },
  { id: 'alert_history', label: 'Alert History Report' },
];

const CyberLabel = ({ children }) => (
  <label
    style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.63rem',
      letterSpacing: '0.1em',
      color: 'var(--text-muted)',
      display: 'block',
      marginBottom: '0.4rem',
    }}
  >
    {children}
  </label>
);

const PlannerReports = () => {
  const [form, setForm] = useState({
    reportType: 'risk_summary',
    startDate: '',
    endDate: '',
    riskLevel: 'all',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate) {
      toast.error('Please select a date range.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/reports/generate', form, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${form.reportType}_report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded!');
    } catch {
      toast.error('Report generation failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            <FileText size={16} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="cyber-title" style={{ fontSize: '1.3rem', margin: 0 }}>
              REPORTS
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.63rem',
                color: 'var(--text-muted)',
                margin: 0,
              }}
            >
              GENERATE AND DOWNLOAD OPERATIONAL REPORTS
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.25rem',
        }}
      >
        {/* Report Generator Panel */}
        <div className="panel" style={{ padding: '1.4rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.63rem',
              letterSpacing: '0.12em',
              color: 'var(--cyan)',
              marginBottom: '1.1rem',
            }}
          >
            // GENERATE_REPORT
          </p>

          <form
            onSubmit={handleGenerate}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
          >
            <div>
              <CyberLabel>// REPORT_TYPE</CyberLabel>
              <select
                name="reportType"
                value={form.reportType}
                onChange={handleChange}
                className="cyber-input"
                style={{ cursor: 'pointer' }}
              >
                {REPORT_TYPES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
              <div>
                <CyberLabel>// START_DATE</CyberLabel>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="cyber-input"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div>
                <CyberLabel>// END_DATE</CyberLabel>
                <input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                  className="cyber-input"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <div>
              <CyberLabel>// FILTER_RISK_LEVEL</CyberLabel>
              <select
                name="riskLevel"
                value={form.riskLevel}
                onChange={handleChange}
                className="cyber-input"
                style={{ cursor: 'pointer' }}
              >
                <option value="all">All Levels</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-cyber"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Download size={13} />
                {loading ? 'GENERATING...' : 'GENERATE & DOWNLOAD PDF'}
              </button>
            </div>
          </form>
        </div>

        {/* Incident Chart Panel */}
        <div className="panel" style={{ padding: '1.4rem' }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.63rem',
              letterSpacing: '0.12em',
              color: 'var(--cyan)',
              marginBottom: '1.1rem',
            }}
          >
            // INCIDENT_HISTORY &nbsp;
            <span style={{ opacity: 0.5 }}>(last 6 months)</span>
          </p>
          <div style={{ height: '18rem' }}>
            <IncidentChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerReports;
