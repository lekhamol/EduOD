import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, AlertCircle, Eye, User, BookOpen, Bell, RefreshCw, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * AttendanceAlerts component
 * Props:
 *  - role: 'faculty' | 'hod'
 *  - department: string (faculty's dept; HOD can override via filter)
 */
export default function AttendanceAlerts({ role, department }) {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({ critical: 0, warning: 0, watch: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());

  const severityConfig = {
    CRITICAL: {
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.08)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
      icon: <AlertTriangle size={16} />,
      label: 'Critical',
      pill: 'rgba(239,68,68,0.15)',
    },
    WARNING: {
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.08)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
      icon: <AlertCircle size={16} />,
      label: 'Warning',
      pill: 'rgba(245,158,11,0.15)',
    },
    WATCH: {
      color: '#06b6d4',
      bgColor: 'rgba(6, 182, 212, 0.08)',
      borderColor: 'rgba(6, 182, 212, 0.25)',
      icon: <Eye size={16} />,
      label: 'Watch',
      pill: 'rgba(6,182,212,0.15)',
    },
  };

  const fetchAlerts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/attendance/alerts?watchLimit=85';
      if (role === 'hod' && deptFilter) url += `&department=${encodeURIComponent(deptFilter)}`;

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setAlerts(res.data.alerts || []);
        setSummary(res.data.summary || { critical: 0, warning: 0, watch: 0, total: 0 });
        setDismissed(new Set()); // Reset dismissed on refresh
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load attendance alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [deptFilter]);

  const visibleAlerts = alerts.filter((a) => {
    if (dismissed.has(a.id)) return false;
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    return true;
  });

  const getAttendanceBarColor = (pct) => {
    if (pct < 65) return 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)';
    if (pct < 75) return 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)';
    return 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)';
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* ── Header Row ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={20} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ margin: 0, color: 'white', fontSize: '1.2rem', fontWeight: 700 }}>
              Attendance Alert Centre
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Students requiring attention based on attendance thresholds
            </p>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          aria-label="Refresh alerts"
        >
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        {[
          { label: 'Critical (<65%)', count: summary.critical, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', icon: <AlertTriangle size={20} /> },
          { label: 'Warning (65–74%)', count: summary.warning,  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: <AlertCircle size={20} /> },
          { label: 'Watch (75–84%)',   count: summary.watch,    color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',  border: 'rgba(6,182,212,0.25)',  icon: <Eye size={20} /> },
          { label: 'Total Students',   count: summary.total,    color: 'var(--primary)', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', icon: <User size={20} /> },
        ].map(({ label, count, color, bg, border, icon }) => (
          <div key={label} style={{
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 'var(--radius-sm)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div style={{ color, flexShrink: 0 }}>{icon}</div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color, lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: '0.2rem' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <Filter size={14} /> Filter:
        </div>

        {['ALL', 'CRITICAL', 'WARNING', 'WATCH'].map((f) => (
          <button
            key={f}
            onClick={() => setSeverityFilter(f)}
            style={{
              padding: '0.35rem 0.9rem',
              borderRadius: '9999px',
              border: severityFilter === f
                ? `1.5px solid ${f === 'CRITICAL' ? '#ef4444' : f === 'WARNING' ? '#f59e0b' : f === 'WATCH' ? '#06b6d4' : 'var(--primary)'}`
                : '1.5px solid rgba(255,255,255,0.1)',
              background: severityFilter === f
                ? (f === 'CRITICAL' ? 'rgba(239,68,68,0.12)' : f === 'WARNING' ? 'rgba(245,158,11,0.12)' : f === 'WATCH' ? 'rgba(6,182,212,0.12)' : 'rgba(99,102,241,0.12)')
                : 'rgba(255,255,255,0.03)',
              color: severityFilter === f
                ? (f === 'CRITICAL' ? '#ef4444' : f === 'WARNING' ? '#f59e0b' : f === 'WATCH' ? '#06b6d4' : 'var(--primary)')
                : 'var(--text-muted)',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            aria-pressed={severityFilter === f}
          >
            {f === 'ALL' ? 'All Alerts' : f}
          </button>
        ))}

        {role === 'hod' && (
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ marginLeft: 'auto', width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.82rem', marginTop: 0 }}
            aria-label="Filter by department"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Electronics &amp; Comm">Electronics &amp; Comm</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Mechanical Eng">Mechanical Eng</option>
            <option value="Civil Eng">Civil Eng</option>
          </select>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {/* ── Alert Cards ── */}
      {loading && visibleAlerts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
          <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.9s linear infinite', marginBottom: '1rem' }} />
          <p>Loading attendance alerts...</p>
        </div>
      ) : visibleAlerts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(16,185,129,0.05)', border: '1px dashed rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)' }}>
          <BookOpen size={36} color="var(--success)" style={{ marginBottom: '0.75rem', opacity: 0.7 }} />
          <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
            All Clear!
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
            {severityFilter !== 'ALL' ? `No ${severityFilter.toLowerCase()} alerts for the selected filter.` : 'No students below the 85% watch threshold. Great attendance!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {visibleAlerts.map((alert) => {
            const cfg = severityConfig[alert.severity];
            const isExpanded = expandedId === alert.id;

            return (
              <div
                key={alert.id}
                style={{
                  background: cfg.bgColor,
                  border: `1px solid ${cfg.borderColor}`,
                  borderLeft: `4px solid ${cfg.color}`,
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  transition: 'all 0.25s ease',
                }}
                role="alert"
                aria-label={`${alert.severity} alert for ${alert.name}`}
              >
                {/* Card Header */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem', cursor: 'pointer' }}
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                >
                  {/* Severity Icon */}
                  <div style={{ color: cfg.color, flexShrink: 0 }}>{cfg.icon}</div>

                  {/* Main Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{alert.name}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({alert.reg_no})</span>
                      {role === 'hod' && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                          {alert.department}
                        </span>
                      )}
                    </div>

                    {/* Attendance bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(alert.attendance, 100)}%`, height: '100%', background: getAttendanceBarColor(alert.attendance), borderRadius: '3px', transition: 'width 0.6s ease' }} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: cfg.color, flexShrink: 0 }}>
                        {alert.attendance}%
                      </span>
                    </div>
                  </div>

                  {/* Right side: Severity badge + expand toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span style={{
                      padding: '0.25rem 0.65rem',
                      borderRadius: '9999px',
                      background: cfg.pill,
                      color: cfg.color,
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      border: `1px solid ${cfg.borderColor}`,
                    }}>
                      {cfg.label}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDismissed(prev => new Set([...prev, alert.id])); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.1rem', lineHeight: 1 }}
                      title="Dismiss this alert"
                      aria-label={`Dismiss alert for ${alert.name}`}
                    >
                      <X size={14} />
                    </button>
                    {isExpanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: '0 1.25rem 1.25rem', borderTop: `1px solid ${cfg.borderColor}`, paddingTop: '1rem' }}>
                    {/* Alert Message Banner */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '6px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.5, fontStyle: 'italic' }}>
                      {alert.alertMessage}
                    </div>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '0.65rem 0.85rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Current Attendance</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: cfg.color }}>{alert.attendance}%</div>
                      </div>
                      {alert.shortfall75 > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '0.65rem 0.85rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Shortfall from 75%</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b' }}>{alert.shortfall75}%</div>
                        </div>
                      )}
                      {alert.shortfall65 > 0 && (
                        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '0.65rem 0.85rem' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Shortfall from 65%</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ef4444' }}>{alert.shortfall65}%</div>
                        </div>
                      )}
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '6px', padding: '0.65rem 0.85rem' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Email</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>{alert.email || '—'}</div>
                      </div>
                    </div>

                    {/* Recommended Action */}
                    <div style={{
                      background: alert.severity === 'CRITICAL' ? 'rgba(239,68,68,0.08)' : alert.severity === 'WARNING' ? 'rgba(245,158,11,0.08)' : 'rgba(6,182,212,0.08)',
                      border: `1px solid ${cfg.borderColor}`,
                      borderRadius: '6px',
                      padding: '0.65rem 0.85rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                    }}>
                      <span style={{ color: cfg.color, flexShrink: 0, marginTop: '0.05rem' }}>
                        {cfg.icon}
                      </span>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: cfg.color, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.15rem' }}>Recommended Action</div>
                        <div style={{ fontSize: '0.83rem', color: 'var(--text-main)' }}>{alert.action}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dismissed info footer */}
      {dismissed.size > 0 && (
        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {dismissed.size} alert{dismissed.size > 1 ? 's' : ''} dismissed in this session.{' '}
          <button
            onClick={() => setDismissed(new Set())}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem' }}
          >
            Show all
          </button>
        </div>
      )}
    </div>
  );
}
