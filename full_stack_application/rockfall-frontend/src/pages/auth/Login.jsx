import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../../redux/slices/authSlice';
import { getDefaultRoute } from '../../utils/roleRoutes';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      dispatch(loginSuccess(data));
      toast.success(`Welcome, ${data.user.fullName}!`);
      navigate(getDefaultRoute(data.user.role));
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      dispatch(loginFailure(msg));
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
      }}
    >
      {/* Radial glow */}
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

      {/* Card */}
      <div
        className="panel"
        style={{ width: '100%', maxWidth: 420, padding: '2.5rem 2rem', position: 'relative' }}
      >
        {/* Corner accents */}
        {[
          ['top:0;left:0', 'top', 'left'],
          ['top:0;right:0', 'top', 'right'],
          ['bottom:0;left:0', 'bottom', 'left'],
          ['bottom:0;right:0', 'bottom', 'right'],
        ].map(([pos, v, h]) => (
          <div
            key={pos}
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

        {/* Header */}
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
            AI-POWERED ROCKFALL DETECTION SYSTEM
          </p>
        </div>

        {/* Credentials hint */}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          <div>
            <label
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '0.4rem',
              }}
            >
              // USERNAME
            </label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="Enter username"
              className="cyber-input"
            />
          </div>
          <div>
            <label
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                letterSpacing: '0.1em',
                color: 'var(--text-muted)',
                display: 'block',
                marginBottom: '0.4rem',
              }}
            >
              // PASSWORD
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Enter password"
              className="cyber-input"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-cyber"
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem', fontSize: '0.85rem' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                AUTHENTICATING...
              </span>
            ) : (
              'INITIALIZE ACCESS'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
