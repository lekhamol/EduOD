import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LogOut, Calendar as CalendarIcon, FileText, AlertCircle, Check, X, ShieldAlert, Sparkles, MessageCircle, Users, CheckSquare } from 'lucide-react';
import ThemeSelector from '../components/ThemeSelector';
import AttendanceHeatmap from '../components/AttendanceHeatmap';

export default function FacultyDashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedReq, setSelectedReq] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Heatmap & Mark Attendance States
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'attendance'
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatuses, setAttendanceStatuses] = useState({}); // { studentId: 'present' / 'absent' }
  const [markSuccess, setMarkSuccess] = useState('');
  const [markError, setMarkError] = useState('');
  const [markLoading, setMarkLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchStudents();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const resReq = await axios.get(`http://localhost:5000/api/od/all?department=${user.department}&status=Pending`, { headers });
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

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('http://localhost:5000/api/attendance/students', { headers });
      setStudents(res.data.students || []);
      
      const initial = {};
      (res.data.students || []).forEach(s => {
        initial[s.id] = 'present';
      });
      setAttendanceStatuses(initial);
    } catch (error) {
      console.error('Error fetching students:', error);
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

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    setMarkSuccess('');
    setMarkError('');
    setMarkLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const records = Object.keys(attendanceStatuses).map(studentId => ({
        student_id: parseInt(studentId),
        status: attendanceStatuses[studentId]
      }));

      const res = await axios.post('http://localhost:5000/api/attendance/mark', {
        date: attendanceDate,
        records
      }, { headers });

      if (res.data.success) {
        setMarkSuccess('Attendance marked successfully!');
        // Refresh department stats
        fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
      setMarkError(err.response?.data?.error || 'Failed to mark attendance.');
    } finally {
      setMarkLoading(false);
    }
  };

  return (
    <div className="dashboard-wrapper animate-slide-up">
      <nav className="dashboard-nav">
        <div className="logo-text">Edu OD</div>
        <div className="nav-user-info" style={{ alignItems: 'center' }}>
          <ThemeSelector />
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
                    onClick={() => handleAction(selectedReq.id, 'Rejected')}
                    disabled={actionLoading}
                  >
                    <X size={16} /> Reject
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => handleAction(selectedReq.id, 'Faculty_Approved')}
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
