import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Calendar as CalendarIcon, FileText, Send, AlertCircle, Sparkles, Check, X, ShieldAlert } from 'lucide-react';
import Calendar from '../components/Calendar';
import QRCard from '../components/QRCard';
import ThemeSelector from '../components/ThemeSelector';

export default function StudentDashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  
  const [activeLetter, setActiveLetter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const resReq = await axios.get('http://localhost:5000/api/od/my', { headers });
      setRequests(resReq.data.requests);

      const resStats = await axios.get('http://localhost:5000/api/stats', { headers });
      setStats(resStats.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setLoading(true);

    if (!file) {
      setFormError('Supporting document is mandatory.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('event_name', eventName);
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);
      formData.append('reason', reason);
      formData.append('attachment', file);

      const res = await axios.post('http://localhost:5000/api/od/apply', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.success) {
        setFormSuccess('On-Duty application submitted successfully! AI-audit processed.');
        setEventName('');
        setStartDate('');
        setEndDate('');
        setReason('');
        setFile(null);
        document.getElementById('file-input').value = '';
        fetchDashboardData();
      }
    } catch (error) {
      console.error(error);
      setFormError(error.response?.data?.error || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">Pending Faculty</span>;
      case 'Faculty_Approved': return <span className="badge badge-faculty-approved">Pending HOD</span>;
      case 'Approved': return <span className="badge badge-approved">Approved</span>;
      case 'Rejected': return <span className="badge badge-rejected">Rejected</span>;
      default: return <span className="badge badge-pending">{status}</span>;
    }
  };

  return (
    <div className="dashboard-wrapper animate-slide-up">
      <nav className="dashboard-nav">
        <div className="logo-text">Edu OD</div>
        <div className="nav-user-info" style={{ alignItems: 'center' }}>
          <ThemeSelector />
          <span className="user-badge">{user.role}</span>
          <span style={{ fontWeight: 600 }}>{user.name} ({user.reg_no})</span>
          <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
              <FileText size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Applied</div>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
              <AlertCircle size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending Reviews</div>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
              <Check size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.approved}</div>
              <div className="stat-label">Total Approved</div>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
              <X size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.rejected}</div>
              <div className="stat-label">Total Rejected</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div>
            <div className="section-card glass-card">
              <h3 className="section-card-title">
                Apply for On-Duty (OD)
                <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Sparkles size={12} /> AI Audited Form
                </span>
              </h3>

              {formError && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  {formSuccess}
                </div>
              )}

              <form onSubmit={handleApply}>
                <div className="form-group">
                  <label htmlFor="eventName">Event / Activity Name</label>
                  <input
                    id="eventName"
                    type="text"
                    required
                    placeholder="e.g. National Hackathon / Sports Tournament"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date</label>
                    <input
                      id="startDate"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="endDate">End Date</label>
                    <input
                      id="endDate"
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Detailed Reason for Leave</label>
                  <textarea
                    id="reason"
                    rows="3"
                    required
                    placeholder="Specify the purpose of leave and your role..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-group">
                  <label htmlFor="file-input">Supporting Document (Upload PDF or Image - Mandatory)</label>
                  <input
                    id="file-input"
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </div>

                <button className="btn btn-primary" type="submit" style={{ marginTop: '1rem' }} disabled={loading}>
                  <Send size={16} /> {loading ? 'Submitting...' : 'Submit OD Request'}
                </button>
              </form>
            </div>

            <div className="section-card glass-card">
              <h3 className="section-card-title">My Applications History</h3>
              <div className="od-list">
                {requests.map((req) => (
                  <div key={req._id} className="od-item glass-card" style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <div className="od-info">
                      <div className="od-title" style={{fontWeight: 700}}>{req.event_name}</div>
                      <div className="od-meta" style={{marginTop: '0.25rem'}}>
                        <span className="od-meta-item">
                          <CalendarIcon size={14} /> {new Date(req.start_date).toLocaleDateString()} to {new Date(req.end_date).toLocaleDateString()}
                        </span>
                        <span className="od-meta-item">
                          <FileText size={14} /> Dept: {req.department}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        Reason: {req.reason}
                      </p>
                      
                      {req.comments && req.comments.length > 0 && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Latest Comment:</span>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                            "{req.comments[req.comments.length - 1].text}" - <em>{req.comments[req.comments.length - 1].author} ({req.comments[req.comments.length - 1].role})</em>
                          </p>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.75rem', minWidth: '150px' }}>
                      {getStatusBadge(req.status)}
                      
                      {req.status === 'Approved' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => setActiveLetter(req)}
                        >
                          View OD Letter
                        </button>
                      )}
                      
                      {req.attachment && (
                        <a
                          href={`http://localhost:5000/${req.attachment}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline' }}
                        >
                          View Attached Doc
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {requests.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No requests submitted yet.</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="section-card glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 className="section-card-title" style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Approved OD Calendar</h3>
              <Calendar requests={requests} />
            </div>

            <div className="section-card glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(236,72,153,0.05) 100%)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
              <h4 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Sparkles size={16} color="var(--primary)" /> AI Assistant Tip
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Stuck on any step? Use the floating Chatbot in the bottom-right corner! Ask it to <strong>"Check my OD status"</strong> to get instant status audits dynamically linked to your database.
              </p>
            </div>
          </div>
        </div>
      </div>

      <QRCard request={activeLetter} onClose={() => setActiveLetter(null)} />
    </div>
  );
}
