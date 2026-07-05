import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, Calendar as CalendarIcon, CheckCircle, XCircle, Award } from 'lucide-react';

export default function AttendanceHeatmap({ studentId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attendanceData, setAttendanceData] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    if (studentId) {
      fetchAttendance();
    }
  }, [studentId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`http://localhost:5000/api/attendance/${studentId}`, { headers });
      
      setAttendanceData(res.data.records || []);
      setStudentInfo(res.data.student || null);
    } catch (err) {
      console.error(err);
      setError('Failed to load attendance records.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p>Loading attendance heatmap...</p>
      </div>
    );
  }

  if (error || !studentId) {
    return (
      <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
        {error || 'No student selected'}
      </div>
    );
  }

  // Create mapping of date string (YYYY-MM-DD) to status
  const recordMap = {};
  attendanceData.forEach(r => {
    // format date as YYYY-MM-DD (local date, safe from timezone shifts)
    const dStr = new Date(r.date).toISOString().split('T')[0];
    recordMap[dStr] = r.status;
  });

  // Calculate 180 days ago to today
  const today = new Date();
  const startDate = new Date();
  startDate.setDate(today.getDate() - 175); // approx 25 weeks

  // Align start date to the preceding Sunday to align columns nicely
  const startDay = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDay);

  // Generate grid cells
  const grid = []; // 7 rows (Sunday to Saturday) x N columns (weeks)
  const tempDate = new Date(startDate);
  
  // Fill 7 rows and N columns
  // N = 26 weeks
  const totalWeeks = 26;
  const days = [];
  
  for (let w = 0; w < totalWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dateCopy = new Date(tempDate);
      const dateStr = dateCopy.toISOString().split('T')[0];
      const status = recordMap[dateStr] || 'none'; // 'none' if no record
      
      // Determine if weekend
      const isWeekend = dateCopy.getDay() === 0 || dateCopy.getDay() === 6;
      
      week.push({
        date: dateCopy,
        dateStr,
        status: status === 'none' && isWeekend ? 'weekend' : status
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }
    days.push(week);
  }

  // Calculate stats
  const totalPresent = attendanceData.filter(r => r.status === 'present').length;
  const totalAbsent = attendanceData.filter(r => r.status === 'absent').length;
  const totalOD = attendanceData.filter(r => r.status === 'od').length;
  const totalWorkingDays = totalPresent + totalAbsent;
  const attendancePercentage = studentInfo?.attendance ?? (totalWorkingDays > 0 ? Math.round((totalPresent / totalWorkingDays) * 100) : 100);

  // Get color for status
  const getCellColor = (status) => {
    switch (status) {
      case 'present':
        return '#10b981'; // 🟢 Emerald Green
      case 'absent':
        return '#ef4444'; // 🔴 Ruby Red
      case 'od':
        return '#3b82f6'; // 🔵 Royal Blue
      case 'weekend':
        return 'rgba(255, 255, 255, 0.05)'; // Dark grey
      default:
        return 'rgba(255, 255, 255, 0.1)'; // Light grey for holiday / unmarked
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'od': return 'On-Duty (Approved)';
      case 'weekend': return 'Weekend';
      default: return 'No Class / Unmarked';
    }
  };

  // Find unique months to draw headers
  const monthLabels = [];
  let lastMonth = -1;
  days.forEach((week, weekIndex) => {
    const firstDayOfWeek = week[0].date;
    const month = firstDayOfWeek.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        name: firstDayOfWeek.toLocaleString('default', { month: 'short' }),
        index: weekIndex
      });
      lastMonth = month;
    }
  });

  return (
    <div className="heatmap-card glass-card" style={{ padding: '1.25rem', marginTop: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem', margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>
          <Sparkles size={16} color="var(--primary)" /> Attendance Heatmap (Last 6 Months)
        </h4>
        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', padding: '0.2rem 0.5rem', borderRadius: '4px', background: attendancePercentage >= 75 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: attendancePercentage >= 75 ? 'var(--success)' : 'var(--danger)' }}>
          {attendancePercentage}% Attendance
        </span>
      </div>

      {/* Heatmap Grid Container */}
      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        <div style={{ minWidth: '550px', position: 'relative' }}>
          
          {/* Month Labels */}
          <div style={{ display: 'flex', marginLeft: '30px', height: '20px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {monthLabels.map((lbl, idx) => (
              <div 
                key={idx} 
                style={{ 
                  position: 'absolute', 
                  left: `${30 + lbl.index * 19}px`,
                  whiteSpace: 'nowrap'
                }}
              >
                {lbl.name}
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          <div style={{ display: 'flex' }}>
            {/* Day of Week Labels */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '25px', height: '112px', fontSize: '0.65rem', color: 'var(--text-muted)', paddingRight: '5px', paddingTop: '2px' }}>
              <span>Su</span>
              <span>Tu</span>
              <span>Th</span>
              <span>Sa</span>
            </div>

            {/* Heatmap Grid blocks */}
            <div style={{ display: 'flex', gap: '3px' }}>
              {days.map((week, wIdx) => (
                <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {week.map((day, dIdx) => (
                    <div
                      key={dIdx}
                      style={{
                        width: '13px',
                        height: '13px',
                        borderRadius: '2px',
                        backgroundColor: getCellColor(day.status),
                        cursor: 'pointer',
                        transition: 'transform 0.1s'
                      }}
                      title={`${day.date.toLocaleDateString()}: ${getStatusLabel(day.status)}`}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'scale(1.3)';
                        e.target.style.zIndex = '10';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.zIndex = '1';
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Heatmap Summary Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <CheckCircle size={14} color="#10b981" />
          <div>
            <div style={{ fontWeight: 'bold', color: 'white' }}>{totalPresent} Days</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Present</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <XCircle size={14} color="#ef4444" />
          <div>
            <div style={{ fontWeight: 'bold', color: 'white' }}>{totalAbsent} Days</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Absent</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Award size={14} color="#3b82f6" />
          <div>
            <div style={{ fontWeight: 'bold', color: 'white' }}>{totalOD} Days</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OD Approved</div>
          </div>
        </div>
      </div>

      {/* Color Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
        <span>Marked classes: {totalWorkingDays}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span>Less</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            <span style={{ width: '9px', height: '9px', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '1px' }} title="Weekend" />
            <span style={{ width: '9px', height: '9px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '1px' }} title="No Class" />
            <span style={{ width: '9px', height: '9px', backgroundColor: '#3b82f6', borderRadius: '1px' }} title="OD" />
            <span style={{ width: '9px', height: '9px', backgroundColor: '#ef4444', borderRadius: '1px' }} title="Absent" />
            <span style={{ width: '9px', height: '9px', backgroundColor: '#10b981', borderRadius: '1px' }} title="Present" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
