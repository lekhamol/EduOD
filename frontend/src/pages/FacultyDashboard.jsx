import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Calendar as CalendarIcon, FileText, AlertCircle, Check, X, ShieldAlert, Sparkles, MessageCircle } from 'lucide-react';

export default function FacultyDashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedReq, setSelectedReq] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const resReq = await axios.get(`http://localhost:5000/api/od/all?department=${user.department}&status=Pending`, { headers });
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

  const handleAction = async (id, status) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.put(`http://localhost:5000/api/od/${id}/review`, {
        status,
        comment
      }, { headers });

      setSelectedReq(null);
      setComment('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error handling faculty action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper animate-slide-up">
      <nav className="dashboard-nav">
        <div className="logo-text">Edu OD</div>
        <div className="nav-user-info">
          <span className="user-badge">{user.role}</span>
          <span style={{ fontWeight: 600 }}>{user.name} ({user.department})</span>
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
              <div className="stat-label">Total Department Applied</div>
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
              <div className="stat-label">Approved</div>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)' }}>
              <X size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.rejected}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div>
            <div className="section-card glass-card">
              <h3 className="section-card-title">Pending Student OD Requests ({requests.length})</h3>

              <div className="od-list">
                {requests.map((req) => (
                  <div 
                    key={req._id} 
                    className="od-item glass-card" 
                    style={{ 
                      background: 'rgba(255,255,255,0.01)',
                      borderLeft: selectedReq?._id === req._id ? '4px solid var(--primary)' : '1px solid var(--card-border)',
                      cursor: 'pointer' 
                    }}
                    onClick={() => setSelectedReq(req)}
                  >
                    <div className="od-info">
                      <div className="od-title" style={{fontWeight: 700}}>{req.student_name} ({req.reg_no})</div>
                      <p style={{ fontSize: '0.9rem', color: 'white', marginTop: '0.25rem' }}>
                        Event: <strong>{req.event_name}</strong>
                      </p>
                      <div className="od-meta" style={{ marginTop: '0.5rem' }}>
                        <span className="od-meta-item">
                          <CalendarIcon size={14} /> {new Date(req.start_date).toLocaleDateString()} to {new Date(req.end_date).toLocaleDateString()}
                        </span>
                        <span className="od-meta-item">
                          <AlertCircle size={14} /> Reason: {req.reason}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '120px' }}>
                      <span className="badge badge-pending">Pending Faculty</span>
                      {req.attachment && (
                        <a
                          href={`http://localhost:5000/${req.attachment}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'underline' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Document
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {requests.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No pending requests found for your department.</p>
                )}
              </div>
            </div>
          </div>

          <div>
            {selectedReq ? (
              <div className="section-card glass-card animate-slide-up">
                <h3 className="section-card-title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Review Request</h3>
                
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>STUDENT</div>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>{selectedReq.student_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Reg No: {selectedReq.reg_no}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dept: {selectedReq.department}</div>
                  
                  <div style={{ margin: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>EVENT DETAILS</div>
                  <div style={{ color: 'white', fontSize: '0.95rem' }}>{selectedReq.event_name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Dates: {new Date(selectedReq.start_date).toLocaleDateString()} to {new Date(selectedReq.end_date).toLocaleDateString()}
                  </div>

                  <div style={{ margin: '0.75rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}></div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>REASON</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontStyle: 'italic' }}>"{selectedReq.reason}"</p>
                </div>

                {selectedReq.ai_analysis && (
                  <div className="ai-recommendation-box" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                      <Sparkles size={14} /> AI Recommendation Audit
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'white', marginBottom: '0.5rem' }}>
                      {selectedReq.ai_analysis.recommendation}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Risk Index:</span>
                      <span style={{ fontWeight: 'bold', color: selectedReq.ai_analysis.riskScore > 50 ? 'var(--danger)' : selectedReq.ai_analysis.riskScore > 20 ? 'var(--warning)' : 'var(--success)' }}>
                        {selectedReq.ai_analysis.riskScore} / 100
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      <span>Doc Verification:</span>
                      <span style={{ fontWeight: 'bold', color: selectedReq.ai_analysis.docVerified ? 'var(--success)' : 'var(--danger)' }}>
                        {selectedReq.ai_analysis.docVerified ? 'VERIFIED' : 'FAILED'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="comments">Faculty Recommendation Comments</label>
                  <textarea
                    id="comments"
                    rows="2"
                    placeholder="Provide comment for HOD review or student feedback..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <button 
                    className="btn btn-danger" 
                    onClick={() => handleAction(selectedReq._id, 'Rejected')}
                    disabled={actionLoading}
                  >
                    <X size={16} /> Reject
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleAction(selectedReq._id, 'Faculty_Approved')}
                    disabled={actionLoading}
                  >
                    <Check size={16} /> Recommend
                  </button>
                </div>
              </div>
            ) : (
              <div className="section-card glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <MessageCircle size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h4>Select a request from the list to review details and take actions.</h4>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
