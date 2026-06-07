import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import useAuth from '../../hooks/useAuth';
import { loginSuccess } from '../../redux/slices/authSlice';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { User, Mail, Phone, Save } from 'lucide-react';

const ProfileSettings = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [form, setForm] = useState({ fullName: '', email: '', phoneNumber: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user)
      setForm({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put(`/users/${user.id}`, form);
      dispatch(loginSuccess({ user: data.user, token: localStorage.getItem('token') }));
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1.5rem', paddingTop: '0.5rem' }}>
        <h1 className="cyber-title" style={{ fontSize: '1.3rem', margin: 0 }}>
          PROFILE SETTINGS
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            margin: 0,
          }}
        >
          UPDATE YOUR PERSONAL INFORMATION
        </p>
      </div>

      <div
        className="panel"
        style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
      >
        {/* Avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid rgba(0,229,255,0.1)',
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,229,255,0.05))',
              border: '2px solid var(--cyan-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-head)',
              fontWeight: 700,
              fontSize: '1.4rem',
              color: 'var(--cyan)',
              boxShadow: 'var(--cyan-glow)',
            }}
          >
            {user?.fullName?.[0] || 'U'}
          </div>
          <div>
            <p
              style={{
                fontFamily: 'var(--font-head)',
                fontWeight: 700,
                fontSize: '1.1rem',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {user?.fullName}
            </p>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                margin: '0.2rem 0 0',
              }}
            >
              {user?.role} — @{user?.username}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {[
            { icon: User, name: 'fullName', label: 'FULL NAME', type: 'text' },
            { icon: Mail, name: 'email', label: 'EMAIL ADDRESS', type: 'email' },
            { icon: Phone, name: 'phoneNumber', label: 'PHONE NUMBER', type: 'tel' },
          ].map(({ icon: Icon, name, label, type }) => (
            <div key={name}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  marginBottom: '0.4rem',
                }}
              >
                <Icon size={11} style={{ color: 'var(--text-muted)' }} />
                <span className="cyber-label">// {label}</span>
              </label>
              <input
                name={name}
                type={type}
                value={form[name]}
                onChange={handleChange}
                className="cyber-input"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="btn-cyber"
            style={{ marginTop: '0.5rem', gap: '0.5rem' }}
          >
            <Save size={14} />
            {loading ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default ProfileSettings;
