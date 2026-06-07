import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ROLES } from '../../constants';

const ROLE_OPTIONS = [
  { value: ROLES.MINER, label: 'Miner', color: 'var(--cyan)' },
  { value: ROLES.PLANNER, label: 'Planner', color: 'var(--amber)' },
  { value: ROLES.ADMIN, label: 'Administrator', color: 'var(--green)' },
];

/* ── tiny inline styles reused from Login ── */
const monoLabel = {
  fontFamily: 'var(--font-mono)',
  fontSize: '0.65rem',
  letterSpacing: '0.1em',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: '0.4rem',
};

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirm: '',
    role: ROLES.MINER,
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name required';
    if (!form.username.trim()) errs.username = 'Username required';
    if (form.username.includes(' ')) errs.username = 'No spaces allowed';
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    if (form.password.length < 6) errs.password = 'Min 6 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await api.post('/auth/register', {
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      toast.success('ACCOUNT CREATED — Proceed to login');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = ROLE_OPTIONS.find((r) => r.value === form.role);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-deep)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '2rem 1rem',
      }}
    >
      {/* Background glows — same as Login */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%,-50%)',
          width: 600,
          height: 400,
          background: 'radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: 300,
          height: 300,
          background: 'radial-gradient(ellipse, rgba(255,140,0,0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Panel — same class as Login */}
      <div
        className="panel"
        style={{ width: '100%', maxWidth: 460, padding: '2.5rem 2rem', position: 'relative' }}
      >
        {/* Corner accents — identical to Login */}
        {[
          ['top', 'left'],
          ['top', 'right'],
          ['bottom', 'left'],
          ['bottom', 'right'],
        ].map(([v, h]) => (
          <div
            key={`${v}-${h}`}
            style={{
              position: 'absolute',
              [v]: -1,
              [h]: -1,
              width: 16,
              height: 16,
              borderTop: v === 'top' ? '2px solid var(--cyan)' : 'none',
              borderBottom: v === 'bottom' ? '2px solid var(--cyan)' : 'none',
              borderLeft: h === 'left' ? '2px solid var(--cyan)' : 'none',
              borderRight: h === 'right' ? '2px solid var(--cyan)' : 'none',
            }}
          />
        ))}

        {/* Header — matches Login exactly */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <svg viewBox="0 0 44 44" fill="none" style={{ width: 44, height: 44 }}>
              <polygon
                points="22,2 40,12 40,32 22,42 4,32 4,12"
                stroke="var(--cyan)"
                strokeWidth="1.5"
                fill="rgba(0,229,255,0.06)"
              />
              <polygon
                points="22,10 33,16 33,28 22,34 11,28 11,16"
                stroke="var(--cyan)"
                strokeWidth="0.8"
                fill="rgba(0,229,255,0.04)"
                opacity="0.6"
              />
              <circle cx="22" cy="22" r="4" fill="var(--cyan)" opacity="0.9" />
            </svg>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-head)',
              fontWeight: 700,
              fontSize: '1.6rem',
              letterSpacing: '0.2em',
              margin: 0,
              color: 'var(--text-primary)',
            }}
          >
            ROCK<span style={{ color: 'var(--cyan)' }}>GUARD</span>
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              marginTop: '0.35rem',
            }}
          >
            NEW OPERATOR REGISTRATION
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* ── Full Name ── */}
          <div>
            <label style={monoLabel}>// FULL_NAME</label>
            <input
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="e.g. Arjun Mehta"
              className="cyber-input"
              style={errors.fullName ? { borderColor: 'var(--red)' } : {}}
            />
            {errors.fullName && <ErrorLine msg={errors.fullName} />}
          </div>

          {/* ── Username + Role side-by-side ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={monoLabel}>// USERNAME</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="unique handle"
                className="cyber-input"
                style={errors.username ? { borderColor: 'var(--red)' } : {}}
              />
              {errors.username && <ErrorLine msg={errors.username} />}
            </div>

            <div>
              <label style={monoLabel}>// ROLE</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="cyber-input"
                style={{ color: selectedRole?.color, cursor: 'pointer' }}
              >
                {ROLE_OPTIONS.map(({ value, label }) => (
                  <option
                    key={value}
                    value={value}
                    style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)' }}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Email ── */}
          <div>
            <label style={monoLabel}>// EMAIL_ADDRESS</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="operator@mine.com"
              className="cyber-input"
              style={errors.email ? { borderColor: 'var(--red)' } : {}}
            />
            {errors.email && <ErrorLine msg={errors.email} />}
          </div>

          {/* ── Password + Confirm side-by-side ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={monoLabel}>// PASSPHRASE</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="min 6 chars"
                className="cyber-input"
                style={errors.password ? { borderColor: 'var(--red)' } : {}}
              />
              {errors.password && <ErrorLine msg={errors.password} />}
            </div>
            <div>
              <label style={monoLabel}>// CONFIRM</label>
              <input
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={handleChange}
                placeholder="repeat passphrase"
                className="cyber-input"
                style={errors.confirm ? { borderColor: 'var(--red)' } : {}}
              />
              {errors.confirm && <ErrorLine msg={errors.confirm} />}
            </div>
          </div>

          {/* ── Role badge preview ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(0,229,255,0.03)',
              border: '1px solid rgba(0,229,255,0.08)',
              borderRadius: 6,
              padding: '0.55rem 0.85rem',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: selectedRole?.color,
                boxShadow: `0 0 8px ${selectedRole?.color}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
              }}
            >
              ACCESS LEVEL:{' '}
              <span style={{ color: selectedRole?.color, letterSpacing: '0.12em' }}>
                {selectedRole?.label.toUpperCase()}
              </span>
            </span>
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading}
            className="btn-cyber"
            style={{ width: '100%', marginTop: '0.25rem', padding: '0.75rem', fontSize: '0.85rem' }}
          >
            {loading ? (
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <span
                  className="spin-slow"
                  style={{
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(0,229,255,0.3)',
                    borderTopColor: 'var(--cyan)',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                />
                CREATING ACCOUNT...
              </span>
            ) : (
              'REGISTER OPERATOR'
            )}
          </button>
        </form>

        {/* Back to login */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '1.4rem',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}
        >
          ALREADY REGISTERED?{' '}
          <Link
            to="/login"
            style={{ color: 'var(--cyan)', textDecoration: 'none', letterSpacing: '0.1em' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            RETURN TO LOGIN →
          </Link>
        </p>
      </div>
    </div>
  );
};

/* Inline field error */
const ErrorLine = ({ msg }) => (
  <p
    style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.6rem',
      color: 'var(--red)',
      letterSpacing: '0.08em',
      marginTop: '0.3rem',
    }}
  >
    ⚠ {msg.toUpperCase()}
  </p>
);

export default Register;
