import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar({ requests }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getDayStatus = (day) => {
    const checkDate = new Date(year, month, day);
    checkDate.setHours(0, 0, 0, 0);

    let status = null;

    for (let req of requests) {
      const start = new Date(req.start_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(req.end_date);
      end.setHours(0, 0, 0, 0);

      if (checkDate >= start && checkDate <= end) {
        if (req.status === 'Approved') {
          return 'approved';
        } else if (req.status === 'Rejected') {
          continue;
        } else {
          status = 'pending'; // Pending or Faculty_Approved
        }
      }
    }

    return status;
  };

  const renderCells = () => {
    const cells = [];
    
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell" style={{ opacity: 0.1 }}></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const status = getDayStatus(day);
      let cellClass = "calendar-cell";
      if (status === 'approved') {
        cellClass += " calendar-cell-approved";
      } else if (status === 'pending') {
        cellClass += " calendar-cell-pending";
      }

      const today = new Date();
      const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
      if (isToday && !status) {
        cellClass += " calendar-cell-active";
      }

      cells.push(
        <div key={day} className={cellClass} title={status ? `On-Duty: ${status}` : ''}>
          <span>{day}</span>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="calendar-wrapper glass-card">
      <div className="calendar-header">
        <h3 style={{ fontSize: '1.15rem' }}>{monthNames[month]} {year}</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={prevMonth}>
            <ChevronLeft size={16} />
          </button>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={nextMonth}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="calendar-day-header" style={{ fontSize: '0.7rem' }}>{day}</div>
        ))}
        {renderCells()}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.25rem', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Approved OD</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }}></div>
          <span style={{ color: 'var(--text-muted)' }}>Pending Review</span>
        </div>
      </div>
    </div>
  );
}
