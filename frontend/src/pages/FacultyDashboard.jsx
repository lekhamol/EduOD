import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { LogOut, Calendar as CalendarIcon, FileText, AlertCircle, Check, X, ShieldAlert, Sparkles, MessageCircle, Users, CheckSquare, Upload, Brain, TriangleAlert, CircleCheck, BarChart2 } from 'lucide-react';
import ThemeSelector from '../components/ThemeSelector';
import AttendanceHeatmap from '../components/AttendanceHeatmap';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

export default function FacultyDashboard() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [selectedReq, setSelectedReq] = useState(null);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Heatmap & Mark Attendance States
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'attendance' | 'manage_students' | 'analytics'
  const [students, setStudents] = useState([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceStatuses, setAttendanceStatuses] = useState({}); // { studentId: 'present' / 'absent' }
  const [markSuccess, setMarkSuccess] = useState('');
  const [markError, setMarkError] = useState('');
  const [markLoading, setMarkLoading] = useState(false);

  // Add student states
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentRegNo, setStudentRegNo] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // AI Absentee Upload States
  const [aiFile, setAiFile] = useState(null);
  const [aiDragging, setAiDragging] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null); // { matched, unmatched, message }
  const [aiError, setAiError] = useState('');
  const aiFileInputRef = useRef(null);

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

  const handleAddStudent = async (e) => {
    e.preventDefault();
    setAddSuccess('');
    setAddError('');
    setAddLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.post('http://localhost:5000/api/attendance/add-student', {
        name: studentName,
        email: studentEmail,
        reg_no: studentRegNo,
        password: studentPassword || undefined
      }, { headers });

      if (res.data.success) {
        setAddSuccess('Student added successfully!');
        setStudentName('');
        setStudentEmail('');
        setStudentRegNo('');
        setStudentPassword('');
        // Refresh student list
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
      setAddError(err.response?.data?.error || 'Failed to add student.');
    } finally {
      setAddLoading(false);
    }
  };

  // AI Absentee Upload Handlers
  const handleAiFileDrop = (e) => {
    e.preventDefault();
    setAiDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) validateAndSetAiFile(file);
  };

  const handleAiFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetAiFile(file);
  };

  const validateAndSetAiFile = (file) => {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.txt')) {
      setAiError('Please select a .csv or .txt file.');
      return;
    }
    setAiError('');
    setAiResult(null);
    setAiFile(file);
  };

  const handleAiAnalyze = async () => {
    if (!aiFile) { setAiError('Please select a file first.'); return; }
    setAiLoading(true);
    setAiError('');
    setAiResult(null);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('absentee_file', aiFile);

      const res = await axios.post('http://localhost:5000/api/attendance/parse-absentees', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setAiResult(res.data);
        // Auto-fill attendance table: mark matched students as absent, rest as present
        const newStatuses = {};
        students.forEach(s => { newStatuses[s.id] = 'present'; });
        res.data.matched.forEach(m => { newStatuses[m.student_id] = 'absent'; });
        setAttendanceStatuses(newStatuses);
      }
    } catch (err) {
      setAiError(err.response?.data?.error || 'AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleClearAi = () => {
    setAiFile(null);
    setAiResult(null);
    setAiError('');
    if (aiFileInputRef.current) aiFileInputRef.current.value = '';
    // Reset all to present
    const reset = {};
    students.forEach(s => { reset[s.id] = 'present'; });
    setAttendanceStatuses(reset);
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
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
          <button 
            className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            onClick={() => setActiveTab('requests')}
          >
            <FileText size={16} /> OD Applications ({requests.length})
          </button>
          <button 
            className={`btn ${activeTab === 'attendance' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            onClick={() => setActiveTab('attendance')}
          >
            <Users size={16} /> Mark Daily Attendance
          </button>
          <button 
            className={`btn ${activeTab === 'manage_students' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            onClick={() => setActiveTab('manage_students')}
          >
            <Users size={16} /> Add New Student
          </button>
          <button 
            className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
            onClick={() => setActiveTab('analytics')}
          >
            <BarChart2 size={16} /> Department Analytics
          </button>
        </div>

        {activeTab === 'requests' ? (
          <>
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

                    {/* Integrated Attendance Heatmap */}
                    <AttendanceHeatmap studentId={selectedReq.student_id} />

                    {selectedReq.ai_analysis && (
                      <div className="ai-recommendation-box" style={{ margin: '1.5rem 0' }}>
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

                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
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
                    <h4>Select a request from the list to review details and view attendance heatmap.</h4>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : activeTab === 'attendance' ? (
          /* Mark Attendance Tab Panel */
          <div className="section-card glass-card animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'white' }}>
              <CheckSquare size={22} color="var(--primary)" /> Mark Daily Student Attendance
            </h3>

            {markSuccess && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                {markSuccess}
              </div>
            )}
            {markError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                {markError}
              </div>
            )}

            <form onSubmit={handleMarkAttendance}>
              <div className="form-group" style={{ maxWidth: '300px', marginBottom: '2rem' }}>
                <label htmlFor="attendance-date">Select Attendance Date</label>
                <input 
                  id="attendance-date"
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  required
                />
              </div>

              {/* ───────── AI Absentee Upload Section ───────── */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%)',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 'var(--radius-sm)',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Brain size={20} color="var(--primary)" />
                  <span style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>AI-Assisted Absentee Upload</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Upload .txt or .csv with absentee names/reg numbers</span>
                </div>

                {/* Drag & Drop Zone */}
                {!aiResult && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setAiDragging(true); }}
                    onDragLeave={() => setAiDragging(false)}
                    onDrop={handleAiFileDrop}
                    onClick={() => aiFileInputRef.current?.click()}
                    style={{
                      border: `2px dashed ${aiDragging ? 'var(--primary)' : 'rgba(99,102,241,0.35)'}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '2rem',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: aiDragging ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.01)',
                      transition: 'all 0.2s ease',
                      marginBottom: '1rem'
                    }}
                  >
                    <Upload size={28} color="var(--primary)" style={{ marginBottom: '0.5rem', opacity: 0.8 }} />
                    <div style={{ color: 'white', fontWeight: 600, marginBottom: '0.25rem' }}>
                      {aiFile ? aiFile.name : 'Drag & drop your file here'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {aiFile ? `${(aiFile.size / 1024).toFixed(1)} KB — click to change` : 'or click to browse — .txt and .csv supported'}
                    </div>
                    <input
                      ref={aiFileInputRef}
                      type="file"
                      accept=".txt,.csv"
                      style={{ display: 'none' }}
                      onChange={handleAiFileSelect}
                    />
                  </div>
                )}

                {aiError && (
                  <div style={{ padding: '0.6rem 1rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    {aiError}
                  </div>
                )}

                {!aiResult && (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAiAnalyze}
                      disabled={!aiFile || aiLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'center' }}
                    >
                      {aiLoading ? (
                        <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Analyzing...</>
                      ) : (
                        <><Sparkles size={16} /> Analyze with AI</>
                      )}
                    </button>
                  </div>
                )}

                {/* AI Result Panel */}
                {aiResult && (
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {/* Summary Banner */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CircleCheck size={18} color="var(--success)" />
                        <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem' }}>{aiResult.message}</span>
                      </div>
                      <button type="button" onClick={handleClearAi} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>Reset</button>
                    </div>

                    {/* Matched Students */}
                    {aiResult.matched.length > 0 && (
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <CircleCheck size={13} /> Matched Absentees ({aiResult.matched.length}) — marked Absent ↓
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {aiResult.matched.map((m, i) => (
                            <div key={i} style={{
                              display: 'flex', alignItems: 'center', gap: '0.4rem',
                              padding: '0.3rem 0.75rem',
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.25)',
                              borderRadius: '20px',
                              fontSize: '0.8rem'
                            }}>
                              <span style={{ color: 'white', fontWeight: 600 }}>{m.name}</span>
                              <span style={{ color: 'var(--text-muted)' }}>({m.reg_no})</span>
                              <span style={{
                                fontSize: '0.7rem', fontWeight: 700,
                                color: m.confidence >= 90 ? 'var(--success)' : m.confidence >= 70 ? 'var(--warning)' : '#f97316',
                                background: 'rgba(0,0,0,0.2)', padding: '0 0.3rem', borderRadius: '4px'
                              }}>{m.confidence}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Unmatched Names */}
                    {aiResult.unmatched.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <TriangleAlert size={13} /> Unmatched ({aiResult.unmatched.length}) — needs manual review
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {aiResult.unmatched.map((u, i) => (
                            <div key={i} style={{
                              padding: '0.3rem 0.75rem',
                              background: 'rgba(245,158,11,0.08)',
                              border: '1px solid rgba(245,158,11,0.25)',
                              borderRadius: '20px',
                              fontSize: '0.8rem',
                              color: 'var(--warning)'
                            }}>
                              {u.raw_input}
                              {u.best_guess && <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>≈ {u.best_guess.name} ({u.best_guess.confidence}%)</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {/* ───────── End AI Section ───────── */}

              <div style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: '2rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '1rem' }}>Student Name</th>
                      <th style={{ padding: '1rem' }}>Register Number</th>
                      <th style={{ padding: '1rem' }}>Overall Attendance</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Present</th>
                      <th style={{ padding: '1rem', textAlign: 'center' }}>Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '1rem', fontWeight: 600, color: 'white' }}>{student.name}</td>
                        <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{student.reg_no}</td>
                        <td style={{ padding: '1rem' }}>
                          <span style={{ 
                            fontWeight: 'bold', 
                            color: student.attendance >= 75 ? 'var(--success)' : student.attendance >= 65 ? 'var(--warning)' : 'var(--danger)' 
                          }}>
                            {student.attendance != null ? `${student.attendance}%` : 'N/A'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <input 
                            type="radio" 
                            name={`status-${student.id}`}
                            checked={attendanceStatuses[student.id] === 'present'}
                            onChange={() => setAttendanceStatuses({ ...attendanceStatuses, [student.id]: 'present' })}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <input 
                            type="radio" 
                            name={`status-${student.id}`}
                            checked={attendanceStatuses[student.id] === 'absent'}
                            onChange={() => setAttendanceStatuses({ ...attendanceStatuses, [student.id]: 'absent' })}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </td>
                      </tr>
                    ))}

                    {students.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                          No students registered in the {user.department} department.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {students.length > 0 && (
                <button 
                  className="btn btn-primary" 
                  type="submit" 
                  disabled={markLoading}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Check size={16} /> {markLoading ? 'Saving Attendance...' : 'Save Attendance Records'}
                </button>
              )}
            </form>
          </div>
        ) : activeTab === 'manage_students' ? (
          /* Manage/Add Students Tab Panel */
          <div className="section-card glass-card animate-slide-up" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'white' }}>
              <Users size={22} color="var(--primary)" /> Add New Student to {user.department}
            </h3>

            {addSuccess && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--success)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                {addSuccess}
              </div>
            )}
            {addError && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddStudent}>
              <div className="form-group">
                <label htmlFor="student-name">Student Full Name</label>
                <input 
                  id="student-name"
                  type="text" 
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-email">Email Address</label>
                <input 
                  id="student-email"
                  type="email" 
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="e.g. john@edu.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-regno">Register Number</label>
                <input 
                  id="student-regno"
                  type="text" 
                  value={studentRegNo}
                  onChange={(e) => setStudentRegNo(e.target.value)}
                  placeholder="e.g. 2026CS1080"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-password">Password (Optional, defaults to 'student123')</label>
                <input 
                  id="student-password"
                  type="password" 
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="Min 6 characters"
                />
              </div>

              <button 
                className="btn btn-primary" 
                type="submit" 
                disabled={addLoading}
                style={{ width: '100%', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
              >
                <Check size={16} /> {addLoading ? 'Adding Student...' : 'Add Student'}
              </button>
            </form>
          </div>
        ) : (
          <AnalyticsDashboard />
        )}
      </div>
    </div>
  );
}
