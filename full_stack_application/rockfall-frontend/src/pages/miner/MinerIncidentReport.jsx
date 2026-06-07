import { useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { FileText, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

const INCIDENT_TYPES = ['rockfall', 'near_miss', 'false_alarm'];
const SEVERITIES = ['low', 'moderate', 'high', 'critical'];
const severityColor = {
  low: 'var(--green)',
  moderate: '#ffc800',
  high: 'var(--amber)',
  critical: 'var(--red)',
};

const MinerIncidentReport = () => {
  const [form, setForm] = useState({
    incidentType: '',
    severity: '',
    description: '',
    location: { latitude: '', longitude: '' },
    investigationNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'latitude' || name === 'longitude')
      setForm((prev) => ({ ...prev, location: { ...prev.location, [name]: value } }));
    else setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          location: {
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          },
        }));
        toast.success('Location captured!');
      },
      () => toast.error('Unable to fetch location.'),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.incidentType || !form.severity || !form.description) {
      toast.error('Please fill all required fields.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/incidents', {
        ...form,
        location: {
          type: 'Point',
          coordinates: [parseFloat(form.location.longitude), parseFloat(form.location.latitude)],
        },
      });
      toast.success('Incident reported!');
      setSubmitted(true);
    } catch {
      toast.error('Failed to submit. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted)
    return (
      <div
        style={{
          maxWidth: 480,
          margin: '4rem auto',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--green-dim)',
            border: '1px solid rgba(0,255,136,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircle size={24} style={{ color: 'var(--green)' }} />
        </div>
        <h2 className="cyber-title" style={{ fontSize: '1.3rem' }}>
          REPORT SUBMITTED
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.06em',
          }}
        >
          INCIDENT LOGGED — SAFETY TEAM NOTIFIED
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({
              incidentType: '',
              severity: '',
              description: '',
              location: { latitude: '', longitude: '' },
              investigationNotes: '',
            });
          }}
          className="btn-cyber"
          style={{ marginTop: '0.5rem' }}
        >
          SUBMIT ANOTHER
        </button>
      </div>
    );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: '2rem' }}>
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
            background: 'rgba(255,26,75,0.1)',
            border: '1px solid rgba(255,26,75,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileText size={16} style={{ color: 'var(--red)' }} />
        </div>
        <div>
          <h1 className="cyber-title" style={{ fontSize: '1.3rem', margin: 0 }}>
            REPORT INCIDENT
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              margin: 0,
            }}
          >
            SUBMIT A ROCKFALL EVENT OR NEAR-MISS REPORT
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="panel"
        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
      >
        {/* Incident Type */}
        <div>
          <label className="cyber-label" style={{ display: 'block', marginBottom: '0.6rem' }}>
            // INCIDENT TYPE *
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {INCIDENT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm((p) => ({ ...p, incidentType: type }))}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: 6,
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-head)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background:
                    form.incidentType === type ? 'rgba(0,229,255,0.15)' : 'var(--bg-input)',
                  color: form.incidentType === type ? 'var(--cyan)' : 'var(--text-secondary)',
                  border: `1px solid ${form.incidentType === type ? 'var(--cyan)' : 'var(--cyan-border)'}`,
                }}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Severity */}
        <div>
          <label className="cyber-label" style={{ display: 'block', marginBottom: '0.6rem' }}>
            // SEVERITY *
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {SEVERITIES.map((s) => {
              const color = severityColor[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, severity: s }))}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: 6,
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-head)',
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: form.severity === s ? `${color}20` : 'var(--bg-input)',
                    color: form.severity === s ? color : 'var(--text-secondary)',
                    border: `1px solid ${form.severity === s ? color : 'var(--cyan-border)'}`,
                    boxShadow: form.severity === s ? `0 0 10px ${color}30` : 'none',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="cyber-label" style={{ display: 'block', marginBottom: '0.6rem' }}>
            // DESCRIPTION *
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={4}
            placeholder="Describe what happened..."
            className="cyber-input"
            style={{ resize: 'none' }}
          />
        </div>

        {/* Location */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.6rem',
            }}
          >
            <label className="cyber-label">// LOCATION COORDINATES</label>
            <button
              type="button"
              onClick={handleGetLocation}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--cyan)',
                letterSpacing: '0.08em',
              }}
            >
              <MapPin size={12} /> USE MY LOCATION
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              name="latitude"
              value={form.location.latitude}
              onChange={handleChange}
              placeholder="Latitude"
              className="cyber-input"
              style={{ flex: 1 }}
            />
            <input
              name="longitude"
              value={form.location.longitude}
              onChange={handleChange}
              placeholder="Longitude"
              className="cyber-input"
              style={{ flex: 1 }}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="cyber-label" style={{ display: 'block', marginBottom: '0.6rem' }}>
            // ADDITIONAL NOTES
          </label>
          <textarea
            name="investigationNotes"
            value={form.investigationNotes}
            onChange={handleChange}
            rows={2}
            placeholder="Any additional observations..."
            className="cyber-input"
            style={{ resize: 'none' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-cyber btn-danger"
          style={{ width: '100%', padding: '0.75rem', fontSize: '0.85rem' }}
        >
          <AlertTriangle size={15} />
          {loading ? 'TRANSMITTING...' : 'SUBMIT INCIDENT REPORT'}
        </button>
      </form>
    </div>
  );
};
export default MinerIncidentReport;
