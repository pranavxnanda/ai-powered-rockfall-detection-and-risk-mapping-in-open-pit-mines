import { useDispatch } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import { useSelector } from 'react-redux';
import useAuth from '../../hooks/useAuth';
import NotificationPanel from './NotificationPanel';
import { linksByRole, profilePath } from './Sidebar';
import { NavLink, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, role } = useAuth();
  const connected = useSelector((state) => state.socket.connected);
  const links = linksByRole[role] || [];

  return (
    <header
      style={{
        position: 'fixed',
        top: '1rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 2rem)',
        maxWidth: '1400px',
        zIndex: 50,
      }}
    >
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(7,15,31,0.92)',
          border: '1px solid var(--cyan-border)',
          borderRadius: '12px',
          padding: '0.65rem 1.5rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(0,229,255,0.08), 0 8px 32px rgba(0,0,0,0.5)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ position: 'relative', width: 28, height: 28 }}>
            <svg
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              <polygon
                points="14,2 26,8 26,20 14,26 2,20 2,8"
                stroke="var(--cyan)"
                strokeWidth="1.5"
                fill="rgba(0,229,255,0.06)"
              />
              <polygon
                points="14,7 21,11 21,19 14,23 7,19 7,11"
                stroke="var(--cyan)"
                strokeWidth="0.8"
                fill="rgba(0,229,255,0.04)"
                opacity="0.6"
              />
              <circle cx="14" cy="14" r="2.5" fill="var(--cyan)" opacity="0.9" />
            </svg>
          </div>
          <div>
            <span
              style={{
                fontFamily: 'var(--font-head)',
                fontWeight: 700,
                fontSize: '1.1rem',
                letterSpacing: '0.15em',
                color: 'var(--text-primary)',
              }}
            >
              ROCK<span style={{ color: 'var(--cyan)' }}>GUARD</span>
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: connected ? 'rgba(0,255,136,0.08)' : 'rgba(255,26,75,0.08)',
              border: `1px solid ${connected ? 'rgba(0,255,136,0.25)' : 'rgba(255,26,75,0.25)'}`,
              borderRadius: 4,
              padding: '0.15rem 0.55rem',
              marginLeft: '0.25rem',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: connected ? 'var(--green)' : 'var(--red)',
                boxShadow: connected ? '0 0 6px var(--green)' : '0 0 6px var(--red)',
              }}
              className={connected ? 'pulse-green' : 'pulse-red'}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: connected ? 'var(--green)' : 'var(--red)',
                letterSpacing: '0.08em',
              }}
            >
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 6,
                fontFamily: 'var(--font-head)',
                fontWeight: 600,
                fontSize: '0.82rem',
                letterSpacing: '0.06em',
                textDecoration: 'none',
                color: isActive ? 'var(--cyan)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(0,229,255,0.08)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--cyan-border)' : 'transparent'}`,
                transition: 'all 0.2s',
              })}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <NotificationPanel />
          <div
            onClick={() => navigate(profilePath[role])}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              padding: '0.3rem 0.6rem',
              borderRadius: 8,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,229,255,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,229,255,0.05))',
                border: '1px solid var(--cyan-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-head)',
                fontWeight: 700,
                fontSize: '0.8rem',
                color: 'var(--cyan)',
              }}
            >
              {user?.fullName?.[0] || 'U'}
            </div>
            <div>
              <p
                style={{
                  fontFamily: 'var(--font-head)',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                {user?.fullName}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: 'var(--text-muted)',
                  margin: 0,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={() => dispatch(logout())}
            className="btn-cyber btn-danger"
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.72rem' }}
          >
            LOGOUT
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
