import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ClipboardList, Plus, X, Trash2, Edit, ChevronDown } from 'lucide-react';

const statusCfg = {
  scheduled: {
    color: 'var(--cyan)',
    bg: 'rgba(0,229,255,0.08)',
    border: 'rgba(0,229,255,0.25)',
    label: 'SCHEDULED',
  },
  in_progress: {
    color: '#ffc800',
    bg: 'rgba(255,200,0,0.08)',
    border: 'rgba(255,200,0,0.25)',
    label: 'IN PROGRESS',
  },
  completed: {
    color: 'var(--green)',
    bg: 'rgba(0,255,136,0.08)',
    border: 'rgba(0,255,136,0.25)',
    label: 'COMPLETED',
  },
  cancelled: {
    color: 'var(--text-muted)',
    bg: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.1)',
    label: 'CANCELLED',
  },
};
const STATUS_OPTIONS = ['scheduled', 'in_progress', 'completed', 'cancelled'];

const EMPTY_FORM = {
  workType: '',
  zoneId: '',
  scheduledStart: '',
  scheduledEnd: '',
  requiredEquipment: '',
  assignedUserIds: [],
};

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

/* ── Datetime input with hidden browser chrome + cyan calendar icon ── */
const DateTimeInput = ({ name, value, onChange, required }) => (
  <div style={{ position: 'relative' }}>
    <input
      type="datetime-local"
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="cyber-input"
      style={{ colorScheme: 'dark', paddingRight: '2.2rem' }}
    />
    <div
      style={{
        position: 'absolute',
        right: '0.65rem',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        color: 'var(--cyan)',
        opacity: 0.45,
      }}
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    </div>
    <style>{`
      input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        opacity: 0; position: absolute; right: 0;
        width: 2.2rem; height: 100%; cursor: pointer;
      }
      input[type="datetime-local"]::-webkit-inner-spin-button,
      input[type="datetime-local"]::-webkit-clear-button { display: none; }
    `}</style>
  </div>
);

/* ── Custom status dropdown — portal-based to escape overflow:hidden on table ── */
const StatusDropdown = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const cur = statusCfg[value] || statusCfg.scheduled;

  /* position the portal menu relative to the trigger button */
  const openMenu = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX,
    });
    setOpen(true);
  };

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const h = (e) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const menu =
    open &&
    createPortal(
      <div
        ref={menuRef}
        style={{
          position: 'absolute',
          top: menuPos.top,
          left: menuPos.left,
          zIndex: 9999,
          minWidth: '148px',
          background: '#040b14',
          border: '1px solid rgba(0,229,255,0.18)',
          borderRadius: '4px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,229,255,0.05)',
          overflow: 'hidden',
        }}
      >
        {STATUS_OPTIONS.map((s) => {
          const cfg = statusCfg[s];
          const active = s === value;
          return (
            <button
              key={s}
              type="button"
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: cfg.color,
                background: active ? cfg.bg : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${active ? cfg.color : 'transparent'}`,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: cfg.color,
                  boxShadow: `0 0 5px ${cfg.color}`,
                }}
              />
              {cfg.label}
            </button>
          );
        })}
      </div>,
      document.body,
    );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? () => setOpen(false) : openMenu}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          color: cur.color,
          background: cur.bg,
          border: `1px solid ${cur.border}`,
          borderRadius: '4px',
          padding: '3px 8px 3px 7px',
          transition: 'filter 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.25)')}
        onMouseLeave={(e) => (e.currentTarget.style.filter = 'brightness(1)')}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            flexShrink: 0,
            background: cur.color,
            boxShadow: `0 0 5px ${cur.color}`,
          }}
        />
        {cur.label}
        <ChevronDown
          size={9}
          style={{ transition: 'transform 0.18s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {menu}
    </>
  );
};

/* ── Icon action button ── */
const ActionBtn = ({ onClick, icon: Icon, color, hoverColor, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    style={{
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      color,
      padding: '5px',
      borderRadius: '3px',
      lineHeight: 0,
      transition: 'color 0.15s, background 0.15s',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = hoverColor || color;
      e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = color;
      e.currentTarget.style.background = 'transparent';
    }}
  >
    <Icon size={14} />
  </button>
);

/* ══════════════════════ MAIN ══════════════════════ */
const WorkAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [zones, setZones] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [assignRes, zoneRes, userRes] = await Promise.all([
          api.get('/work-assignments'),
          api.get('/zones'),
          api.get('/users/assignable'),
        ]);
        setAssignments(assignRes.data.assignments || []);
        setZones(zoneRes.data.zones || []);
        setUsers(userRes.data.users || []);
      } catch {
        toast.error('Failed to load data.');
      } finally {
        setFetching(false);
      }
    })();
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleAssignedUsersChange = (e) => {
    const value = e.target.value;
    const checked = e.target.checked;

    setForm((p) => {
      const current = Array.isArray(p.assignedUserIds) ? p.assignedUserIds : [];
      return {
        ...p,
        assignedUserIds: checked ? [...current, value] : current.filter((id) => id !== value),
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        workType: form.workType,
        zoneId: form.zoneId,
        scheduledStart: form.scheduledStart,
        scheduledEnd: form.scheduledEnd,
        requiredEquipment: form.requiredEquipment
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        assignedUserIds: (form.assignedUserIds || [])
          .map((id) => parseInt(id, 10))
          .filter((n) => !isNaN(n)),
      };
      if (editingId) {
        const res = await api.put(`/work-assignments/${editingId}`, payload);
        setAssignments((p) => p.map((a) => (a._id === editingId ? res.data.assignment : a)));
        toast.success('Assignment updated!');
      } else {
        const res = await api.post('/work-assignments', payload);
        setAssignments((p) => [res.data.assignment, ...p]);
        toast.success('Assignment created!');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await api.put(`/work-assignments/${id}`, { status });
      setAssignments((p) => p.map((a) => (a._id === id ? res.data.assignment : a)));
      toast.success('Status updated!');
    } catch {
      toast.error('Failed to update status.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/work-assignments/${id}`);
      setAssignments((p) => p.filter((a) => a._id !== id));
      toast.success('Deleted.');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleEdit = (a) => {
    setEditingId(a._id);
    setForm({
      workType: a.workType,
      zoneId: a.zoneId?._id || a.zoneId,
      scheduledStart: new Date(a.scheduledStart).toISOString().slice(0, 16),
      scheduledEnd: new Date(a.scheduledEnd).toISOString().slice(0, 16),
      requiredEquipment: a.requiredEquipment?.join(', ') || '',
      assignedUserIds: a.assignedUserIds?.map((id) => String(id)) || [],
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <ClipboardList size={16} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <h1 className="cyber-title" style={{ fontSize: '1.3rem', margin: 0 }}>
              WORK ASSIGNMENTS
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.63rem',
                color: 'var(--text-muted)',
                margin: 0,
              }}
            >
              MANAGE WORK SCHEDULES AND ZONE ASSIGNMENTS
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowForm((p) => !p);
            setEditingId(null);
            setForm(EMPTY_FORM);
          }}
          className="btn-cyber"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {showForm ? (
            <>
              <X size={13} /> CANCEL
            </>
          ) : (
            <>
              <Plus size={13} /> NEW ASSIGNMENT
            </>
          )}
        </button>
      </div>

      {/* Form */}
      {showForm && (
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
            // {editingId ? 'EDIT ASSIGNMENT' : 'NEW ASSIGNMENT'}
          </p>
          <form
            onSubmit={handleSubmit}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}
          >
            <div>
              <CyberLabel>// WORK_TYPE</CyberLabel>
              <input
                name="workType"
                value={form.workType}
                onChange={handleChange}
                required
                placeholder="e.g. Blasting, Drilling"
                className="cyber-input"
              />
            </div>
            <div>
              <CyberLabel>// ZONE</CyberLabel>
              <select
                name="zoneId"
                value={form.zoneId}
                onChange={handleChange}
                required
                className="cyber-input"
                style={{ cursor: 'pointer' }}
              >
                <option value="">Select a zone</option>
                {zones.map((z) => (
                  <option key={z._id} value={z._id}>
                    {z.zoneName}
                    {z.zoneType ? ` (${z.zoneType})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <CyberLabel>// SCHEDULED_START</CyberLabel>
              <DateTimeInput
                name="scheduledStart"
                value={form.scheduledStart}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <CyberLabel>// SCHEDULED_END</CyberLabel>
              <DateTimeInput
                name="scheduledEnd"
                value={form.scheduledEnd}
                onChange={handleChange}
                required
              />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <CyberLabel>
                // ASSIGNED_USERS &nbsp;
                <span style={{ opacity: 0.5 }}>(tap each miner to assign)</span>
              </CyberLabel>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: users.length > 1 ? '1fr 1fr' : '1fr',
                  gap: '0.6rem',
                }}
              >
                {users.map((user) => (
                  <label
                    key={user.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: '0.75rem',
                      borderRadius: 8,
                      background: form.assignedUserIds?.includes(String(user.id))
                        ? 'rgba(0,229,255,0.12)'
                        : 'rgba(255,255,255,0.03)',
                      border: form.assignedUserIds?.includes(String(user.id))
                        ? '1px solid rgba(0,229,255,0.3)'
                        : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      value={String(user.id)}
                      checked={form.assignedUserIds?.includes(String(user.id))}
                      onChange={handleAssignedUsersChange}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {user.fullName} ({user.username || user.role})
                    </span>
                  </label>
                ))}
              </div>
              {users.length === 0 ? (
                <p
                  style={{
                    marginTop: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--red)',
                  }}
                >
                  No active miners available for assignment.
                </p>
              ) : form.assignedUserIds?.length > 0 ? (
                <p
                  style={{
                    marginTop: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  Selected:{' '}
                  {users
                    .filter((user) => form.assignedUserIds.includes(String(user.id)))
                    .map((user) => user.fullName)
                    .join(', ')}
                </p>
              ) : null}
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <CyberLabel>
                // REQUIRED_EQUIPMENT &nbsp;<span style={{ opacity: 0.5 }}>(comma separated)</span>
              </CyberLabel>
              <input
                name="requiredEquipment"
                value={form.requiredEquipment}
                onChange={handleChange}
                placeholder="Helmet, PPE, Drill"
                className="cyber-input"
              />
            </div>
            <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={loading} className="btn-cyber">
                {loading ? 'SAVING...' : editingId ? 'UPDATE ASSIGNMENT' : 'CREATE ASSIGNMENT'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {fetching ? (
          <p
            style={{
              padding: '2rem',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}
          >
            LOADING DATA...
          </p>
        ) : assignments.length === 0 ? (
          <p
            style={{
              padding: '2.5rem',
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
            }}
          >
            NO ASSIGNMENTS FOUND
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="cyber-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>WORK TYPE</th>
                  <th>ZONE</th>
                  <th>START</th>
                  <th>END</th>
                  <th>EQUIPMENT</th>
                  <th>USERS</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={a._id}>
                    <td
                      style={{
                        fontFamily: 'var(--font-head)',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {a.workType}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {a.zoneId?.zoneName || 'N/A'}
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {new Date(a.scheduledStart).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                        })}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.68rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {new Date(a.scheduledEnd).toLocaleString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                        })}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                      {a.requiredEquipment?.join(', ') || '—'}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.68rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {a.assignedUsers?.length > 0
                        ? a.assignedUsers.map((user) => user.fullName).join(', ')
                        : a.assignedUserIds?.length > 0
                          ? `${a.assignedUserIds.length} user(s)`
                          : 'None'}
                    </td>
                    <td>
                      <StatusDropdown
                        value={a.status}
                        onChange={(s) => handleStatusChange(a._id, s)}
                      />
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <ActionBtn
                          icon={Edit}
                          onClick={() => handleEdit(a)}
                          color="var(--cyan)"
                          hoverColor="var(--cyan)"
                          title="Edit"
                        />
                        <ActionBtn
                          icon={Trash2}
                          onClick={() => handleDelete(a._id)}
                          color="var(--text-muted)"
                          hoverColor="var(--red)"
                          title="Delete"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkAssignments;
