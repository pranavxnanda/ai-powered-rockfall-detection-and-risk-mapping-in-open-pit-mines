import { useState, useEffect } from 'react';
import { Users, Plus, Trash2, X, Power } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ROLES } from '../../constants';
import useAuth from '../../hooks/useAuth';

const roleColor = { miner: 'var(--cyan)', planner: '#a78bfa', administrator: 'var(--green)' };

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: ROLES.MINER,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch (error) {
      toast.error('Failed to fetch users.');
      console.error(error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      toast.success('User created!');
      setShowForm(false);
      setForm({ fullName: '', username: '', email: '', password: '', role: ROLES.MINER });
      fetchUsers(); // Refetch users after creating
    } catch {
      toast.error('Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success('User deleted.');
    } catch (error) {
      toast.error('Failed to delete user.');
      console.error(error);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    if (id === currentUser?.id) {
      toast.error('You cannot deactivate yourself.');
      return;
    }
    try {
      await api.put(`/users/${id}`, { active: !currentActive });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
      toast.success(`User ${!currentActive ? 'activated' : 'deactivated'}.`);
    } catch (error) {
      toast.error('Failed to update user status.');
      console.error(error);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        paddingTop: '0.5rem',
        paddingBottom: '2rem',
      }}
    >
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
            <Users size={16} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="cyber-title" style={{ fontSize: '1.3rem', margin: 0 }}>
              USER MANAGEMENT
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                margin: 0,
              }}
            >
              CREATE, UPDATE AND MANAGE USER ACCOUNTS
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`btn-cyber ${showForm ? 'btn-danger' : ''}`}
          style={{ gap: '0.4rem' }}
        >
          {showForm ? (
            <>
              <X size={14} /> CANCEL
            </>
          ) : (
            <>
              <Plus size={14} /> ADD USER
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="panel" style={{ padding: '1.25rem' }}>
          <p className="cyber-label" style={{ marginBottom: '1rem' }}>
            // NEW USER
          </p>
          <form
            onSubmit={handleCreate}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}
          >
            {[
              ['fullName', 'Full Name', 'text'],
              ['username', 'Username', 'text'],
              ['email', 'Email', 'email'],
              ['password', 'Password', 'password'],
            ].map(([name, label, type]) => (
              <div key={name}>
                <label className="cyber-label" style={{ display: 'block', marginBottom: '0.4rem' }}>
                  // {label.toUpperCase()}
                </label>
                <input
                  name={name}
                  type={type}
                  value={form[name]}
                  onChange={handleChange}
                  required
                  className="cyber-input"
                  placeholder={label}
                />
              </div>
            ))}
            <div>
              <label className="cyber-label" style={{ display: 'block', marginBottom: '0.4rem' }}>
                // ROLE
              </label>
              <select name="role" value={form.role} onChange={handleChange} className="cyber-input">
                <option value={ROLES.MINER}>Miner</option>
                <option value={ROLES.PLANNER}>Planner</option>
                <option value={ROLES.ADMIN}>Administrator</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} className="btn-cyber">
                {loading ? 'CREATING...' : 'CREATE USER'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="panel" style={{ overflow: 'hidden' }}>
        <table className="cyber-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fetching ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => {
                const color = roleColor[u.role] || 'var(--cyan)';
                return (
                  <tr key={u.id}>
                    <td style={{ fontFamily: 'var(--font-head)', fontWeight: 600 }}>
                      {u.fullName}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.78rem',
                      }}
                    >
                      {u.username}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          letterSpacing: '0.06em',
                          color,
                          background: `${color}15`,
                          border: `1px solid ${color}30`,
                          borderRadius: 4,
                          padding: '0.15rem 0.5rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.65rem',
                          letterSpacing: '0.06em',
                          color: u.active ? 'var(--green)' : 'var(--text-muted)',
                          background: u.active ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${u.active ? 'rgba(0,255,136,0.25)' : 'rgba(255,255,255,0.08)'}`,
                          borderRadius: 4,
                          padding: '0.15rem 0.5rem',
                        }}
                      >
                        {u.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleToggleActive(u.id, u.active)}
                        disabled={u.id === currentUser?.id}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: u.id === currentUser?.id ? 'not-allowed' : 'pointer',
                          color: u.active ? 'var(--text-muted)' : 'var(--green)',
                          padding: '0.25rem',
                          borderRadius: 4,
                          transition: 'color 0.2s',
                          opacity: u.id === currentUser?.id ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (u.id !== currentUser?.id) {
                            e.currentTarget.style.color = u.active ? 'var(--red)' : 'var(--green)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (u.id !== currentUser?.id) {
                            e.currentTarget.style.color = u.active
                              ? 'var(--text-muted)'
                              : 'var(--green)';
                          }
                        }}
                        title={
                          u.id === currentUser?.id
                            ? 'Cannot toggle yourself'
                            : u.active
                              ? 'Deactivate'
                              : 'Activate'
                        }
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '0.25rem',
                          borderRadius: 4,
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default UserManagement;
