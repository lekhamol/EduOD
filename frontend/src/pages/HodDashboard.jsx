import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Calendar as CalendarIcon, FileText, AlertCircle, Check, X, ShieldAlert, Sparkles, MessageCircle, Search, Filter } from 'lucide-react';
import QRCard from '../components/QRCard';
import ThemeSelector from '../components/ThemeSelector';
import AttendanceHeatmap from '../components/AttendanceHeatmap';

export default function HodDashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, departmentBreakdown: [] });
  const [selectedReq, setSelectedReq] = useState(null);
  const [comment, setComment] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Faculty_Approved');
  const [deptFilter, setDeptFilter] = useState('');
  
  const [activeLetter, setActiveLetter] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [statusFilter, deptFilter]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      let url = `http://localhost:5000/api/od/all?`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (deptFilter) url += `department=${deptFilter}&`;
      if (searchTerm) url += `search=${searchTerm}&`;

      const resReq = await axios.get(url, { headers });
      setRequests((resReq.data.requests || []).map(r => ({
        ...r,
        comments: typeof r.comments === 'string' ? JSON.parse(r.comments || '[]') : (r.comments || []),
        ai_analysis: typeof r.ai_analysis === 'string' ? JSON.parse(r.ai_analysis || 'null') : r.ai_analysis
      })));

      const resStats = await axios.get('http://localhost:5000/api/stats', { headers });
      setStats(resStats.data.stats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDashboardData();
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

      await axios.put(`http://localhost:5000/api/od/${id}/approve`, {
        status,
        comment
      }, { headers });

      setSelectedReq(null);
      setComment('');
      fetchDashboardData();
    } catch (error) {
      console.error('Error handling HOD approval:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending': return <span className="badge badge-pending">Pending Faculty</span>;
      case 'Faculty_Approved': return <span className="badge badge-faculty-approved">Recommended</span>;
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
          <span style={{ fontWeight: 600 }}>{user.name} (HOD / Admin)</span>
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
              <div className="stat-label">Total Submissions</div>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>
              <AlertCircle size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Pending Faculty</div>
            </div>
          </div>

          <div className="stat-card glass-card">
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}>
              <Check size={22} />
            </div>
            <div>
              <div className="stat-value">{stats.approved}</div>
              <div className="stat-label">Final Approved</div>
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

        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <form className="filters-box" onSubmit={handleSearchSubmit}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(17, 24, 39, 0.6)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '0 1rem', borderRadius: 'var(--radius-sm)' }}>
              <Search size={18} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search Student, Reg No, Event..."
                style={{ border: 'none', background: 'transparent !important', boxShadow: 'none', marginTop: 0 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="Faculty_Approved">Waiting for HOD (Recommended)</option>
                <option value="Pending">Waiting for Faculty</option>
                <option value="Approved">Final Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="">Show All Statuses</option>
              </select>
            </div>

            <div>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                <option value="">All Departments</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics & Comm">Electronics & Comm</option>
                <option value="Information Technology">Information Tech</option>
                <option value="Mechanical Eng">Mechanical Eng</option>
                <option value="Civil Eng">Civil Eng</option>
              </select>
            </div>

            <button className="btn btn-primary" type="submit" style={{ maxWidth: '120px' }}>
              Filter
            </button>
          </form>
        </div>

        <div className="dashboard-grid">
          <div>
            <div className="section-card glass-card">
              <h3 className="section-card-title">On-Duty Applications ({requests.length})</h3>

              <div className="od-list">
                {requests.map((req) => (
                  <div 
                    key={req.id} 
                    className="od-item glass-card" 
                    style={{ 
                      background: 'rgba(255,255,255,0.01)',
                      borderLeft: selectedReq?.id === req.id ? '4px solid var(--primary)' : '1px solid var(--card-border)',
                      cursor: 'pointer' 
                    }}
                    onClick={() => setSelectedReq(req)}
                  >
                    <div className="od-info">
                      <div className="od-title" style={{fontWeight: 700}}>{req.student_name} ({req.reg_no})</div>
                      <div className="od-meta" style={{ marginTop: '0.25rem' }}>
                        <span className="od-meta-item">
                          Dept: <strong>{req.department}</strong>
                        </span>
                        <span className="od-meta-item">
                          Event: <strong>{req.event_name}</strong>
                        </span>
                        <span className="od-meta-item">
                          <CalendarIcon size={14} /> {new Date(req.start_date).toLocaleDateString()} to {new Date(req.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {req.comments && req.comments.length > 0 && (
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--primary)' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Latest Recommendation Comment:</span>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                            "{req.comments[req.comments.length - 1].text}" - <em>{req.comments[req.comments.length - 1].author}</em>
                          </p>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', minWidth: '150px' }}>
                      {getStatusBadge(req.status)}
                      
                      {req.status === 'Approved' && (
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveLetter(req);
                          }}
                        >
                          Verify OD Letter
                        </button>
                      )}

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
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No requests match the current filters.</p>
                )}
              </div>
            </div>
          </div>

          <div>
            {selectedReq ? (
              <div className="section-card glass-card animate-slide-up">
                <h3 className="section-card-title" style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Final Approval Control</h3>
                
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

                {typeof selectedReq.attendance === 'number' && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Attendance Registry</span>
                      <span style={{ fontWeight: 'bold', color: selectedReq.attendance >= 75 ? 'var(--success)' : selectedReq.attendance >= 65 ? 'var(--warning)' : 'var(--danger)' }}>
                        {selectedReq.attendance}%
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '0.5rem' }}>
                      <div style={{ 
                        width: `${selectedReq.attendance}%`, 
                        height: '100%', 
                        background: selectedReq.attendance >= 75 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : selectedReq.attendance >= 65 ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Min Required: 75%</span>
                      <span>{selectedReq.attendance >= 75 ? 'Meets Requirements' : 'Attendance Shortage'}</span>
                    </div>
                  </div>
                )}

                {/* Integrated Attendance Heatmap */}
                <AttendanceHeatmap studentId={selectedReq.student_id} />

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
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="hodComments">HOD Official Comments</label>
                  <textarea
                    id="hodComments"
                    rows="2"
                    placeholder="Provide comment for official certificate or student feedback..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  ></textarea>
                </div>

                {selectedReq.status === 'Faculty_Approved' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                    <button 
                      className="btn btn-danger" 
                      onClick={() => handleAction(selectedReq.id, 'Rejected')}
                      disabled={actionLoading}
                    >
                      <X size={16} /> Reject OD
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleAction(selectedReq.id, 'Approved')}
                      disabled={actionLoading}
                    >
                      <Check size={16} /> Final Approve
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '1rem' }}>
                    Actions only available for applications in <strong>Faculty Recommended</strong> status.
                  </p>
                )}
              </div>
            ) : (
              <div className="section-card glass-card animate-slide-up">
                <h3 className="section-card-title" style={{ fontSize: '1.15rem', marginBottom: '1.25rem' }}>Submissions by Department</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {stats.departmentBreakdown && stats.departmentBreakdown.map((breakdown) => (
                    <div key={breakdown._id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>{breakdown._id || 'General'}</span>
                        <span style={{ fontWeight: 'bold' }}>{breakdown.count} requests</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${(breakdown.count / (stats.total || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)' }}></div>
                      </div>
                    </div>
                  ))}
                  {(!stats.departmentBreakdown || stats.departmentBreakdown.length === 0) && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>No submission stats compiled yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <QRCard request={activeLetter} onClose={() => setActiveLetter(null)} />
    </div>
  );
}
