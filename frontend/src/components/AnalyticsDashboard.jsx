import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  PieChart as PieIcon,
  BarChart2,
  Activity,
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  Sparkles,
  AlertCircle
} from 'lucide-react';

// ── Theme palette ────────────────────────────────────────────────────────────
const COLORS = {
  primary:  '#6366f1',
  success:  '#10b981',
  danger:   '#ef4444',
  warning:  '#f59e0b',
  purple:   '#8b5cf6',
  cyan:     '#06b6d4',
  pink:     '#ec4899',
};
const PIE_COLORS = [COLORS.success, COLORS.primary, COLORS.warning, COLORS.danger];

// ── Shared tooltip style ─────────────────────────────────────────────────────
const tooltipStyle = {
  contentStyle: {
    background: 'rgba(15,15,30,0.95)',
    border: '1px solid rgba(99,102,241,0.3)',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '0.8rem',
  },
  labelStyle: { color: '#a5b4fc', fontWeight: 700 },
  itemStyle: { color: '#e2e8f0' },
};

// ── Chart card wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, icon: Icon, color = COLORS.primary, children, span = 1 }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '1.5rem',
      gridColumn: span === 2 ? 'span 2' : 'span 1',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: `${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
      border: `1px solid ${color}33`,
      borderRadius: '14px',
      padding: '1.25rem 1.5rem',
      display: 'flex', flexDirection: 'column', gap: '0.25rem',
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.15rem' }}>{sub}</div>}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = user.role || 'student';

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data.stats);
      } catch (e) {
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        Loading analytics…
      </div>
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', color: 'var(--danger)', textAlign: 'center' }}>{error}</div>
  );

  // ── 1. Prepare weekday data helper ─────────────────────────────────────────
  const formatWeekdayData = (weekdayRows) => {
    const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekdayMap = {};
    (weekdayRows || []).forEach(r => { weekdayMap[r.day_name] = Number(r.count); });
    return ALL_DAYS
      .filter(d => d !== 'Sunday')
      .map(d => ({ day: d.slice(0, 3), Submissions: weekdayMap[d] || 0 }));
  };

  const weekdayData = formatWeekdayData(stats.weekdayActivity);

  // ── 2. Render HOD Dashboard View ────────────────────────────────────────────
  if (role === 'hod') {
    const monthlyData = (stats.monthlyTrend || []).map(row => ({
      month: new Date(row.month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
      Approved: Number(row.approved),
      Rejected: Number(row.rejected),
      Pending:  Number(row.pending),
      Total:    Number(row.total),
    }));

    const pieData = [
      { name: 'Approved', value: stats.approved || 0 },
      { name: 'Pending',  value: stats.pending  || 0 },
      { name: 'Rejected', value: stats.rejected || 0 },
    ].filter(d => d.value > 0);

    const deptApprovalData = (stats.deptApproval || []).map(r => ({
      dept: r.department?.replace(' Engineering', ' Eng').replace(' Science', ' Sci') || 'N/A',
      'Approval Rate': Number(r.approval_rate),
      Total: Number(r.total),
    }));

    const deptAttData = (stats.deptAttendance || []).map(r => ({
      dept: r.department?.replace(' Engineering', ' Eng').replace(' Science', ' Sci') || 'N/A',
      'Avg Attendance': Number(r.avg_attendance),
    }));

    const topEventsData = (stats.topEvents || []).map(r => ({
      event: r.event_name?.length > 22 ? r.event_name.slice(0, 22) + '…' : r.event_name,
      Count: Number(r.count),
    }));

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiCard label="Total OD Requests" value={stats.total || 0}  color={COLORS.primary} sub="All time university" />
          <KpiCard label="Approved"           value={stats.approved || 0} color={COLORS.success} sub="Final HOD approved" />
          <KpiCard label="Approval Rate"      value={`${stats.approvalRate ?? 0}%`} color={COLORS.cyan} sub="Approved / Total" />
          <KpiCard label="Pending Review"     value={stats.pending || 0}  color={COLORS.warning} sub="Awaiting action" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <ChartCard title="Monthly OD Submission Trend (Last 6 Months)" icon={TrendingUp} color={COLORS.primary} span={2}>
            {monthlyData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.success} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradRejected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.danger} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.warning} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="Approved" stroke={COLORS.success} strokeWidth={2} fill="url(#gradApproved)" dot={{ r: 4, fill: COLORS.success }} />
                  <Area type="monotone" dataKey="Pending"  stroke={COLORS.warning} strokeWidth={2} fill="url(#gradPending)"  dot={{ r: 4, fill: COLORS.warning }} />
                  <Area type="monotone" dataKey="Rejected" stroke={COLORS.danger}  strokeWidth={2} fill="url(#gradRejected)" dot={{ r: 4, fill: COLORS.danger }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="OD Status Distribution" icon={PieIcon} color={COLORS.purple}>
            {pieData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Submission Activity by Day of Week" icon={Calendar} color={COLORS.cyan}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekdayData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="Submissions" radius={[6, 6, 0, 0]}>
                  {weekdayData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${200 + i * 20}, 70%, 55%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Approval Rate by Department" icon={Award} color={COLORS.success} span={2}>
            {deptApprovalData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={Math.max(180, deptApprovalData.length * 52)}>
                <BarChart data={deptApprovalData} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="dept" tick={{ fill: '#e2e8f0', fontSize: 12 }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip {...tooltipStyle} formatter={(v) => [`${v}%`, 'Approval Rate']} />
                  <Bar dataKey="Approval Rate" radius={[0, 8, 8, 0]}>
                    {deptApprovalData.map((entry, i) => (
                      <Cell key={i} fill={entry['Approval Rate'] >= 75 ? COLORS.success : entry['Approval Rate'] >= 50 ? COLORS.warning : COLORS.danger} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Avg Student Attendance by Department" icon={Activity} color={COLORS.warning}>
            {deptAttData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptAttData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="dept" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <Tooltip {...tooltipStyle} formatter={v => [`${v}%`, 'Avg Attendance']} />
                  <Bar dataKey="Avg Attendance" radius={[6, 6, 0, 0]}>
                    {deptAttData.map((entry, i) => (
                      <Cell key={i} fill={entry['Avg Attendance'] >= 75 ? COLORS.success : COLORS.warning} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Top OD Event Categories" icon={BarChart2} color={COLORS.pink}>
            {topEventsData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topEventsData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="event" tick={{ fill: '#e2e8f0', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="Count" radius={[0, 6, 6, 0]}>
                    {topEventsData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${300 + i * 15}, 65%, 60%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    );
  }

  // ── 3. Render Faculty Dashboard View ────────────────────────────────────────
  if (role === 'faculty') {
    const monthlyData = (stats.monthlyTrend || []).map(row => ({
      month: new Date(row.month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
      Approved: Number(row.approved),
      Rejected: Number(row.rejected),
      'Pending Faculty': Number(row.pending_faculty),
      'Pending HOD': Number(row.pending_hod),
      Total: Number(row.total),
    }));

    const pieData = [
      { name: 'Approved', value: stats.approved || 0 },
      { name: 'Recommended', value: stats.recommended || 0 },
      { name: 'Pending Faculty',  value: stats.pending  || 0 },
      { name: 'Rejected', value: stats.rejected || 0 },
    ].filter(d => d.value > 0);

    const topEventsData = (stats.topEvents || []).map(r => ({
      event: r.event_name?.length > 22 ? r.event_name.slice(0, 22) + '…' : r.event_name,
      Count: Number(r.count),
    }));

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiCard label="Department ODs" value={stats.total || 0}  color={COLORS.primary} sub="All time department" />
          <KpiCard label="Pending Faculty" value={stats.pending || 0} color={COLORS.warning} sub="Requires recommendation" />
          <KpiCard label="Recommended (Pending HOD)" value={stats.recommended || 0} color={COLORS.purple} sub="Awaiting final HOD signoff" />
          <KpiCard label="Final Approved"   value={stats.approved || 0} color={COLORS.success} sub="Clearance certificate ready" />
          <KpiCard label="Approval Rate"    value={`${stats.approvalRate ?? 0}%`} color={COLORS.cyan} sub="Approved / Total" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          
          <ChartCard title="Monthly Department Trend (Last 6 Months)" icon={TrendingUp} color={COLORS.primary} span={2}>
            {monthlyData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="facApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.success} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="facRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.purple} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="facPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.warning} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="Approved" stroke={COLORS.success} strokeWidth={2} fill="url(#facApproved)" dot={{ r: 4, fill: COLORS.success }} />
                  <Area type="monotone" dataKey="Pending HOD" stroke={COLORS.purple} strokeWidth={2} fill="url(#facRec)" dot={{ r: 4, fill: COLORS.purple }} />
                  <Area type="monotone" dataKey="Pending Faculty" stroke={COLORS.warning} strokeWidth={2} fill="url(#facPending)" dot={{ r: 4, fill: COLORS.warning }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Department OD Statuses" icon={PieIcon} color={COLORS.purple}>
            {pieData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Weekday Submission Density" icon={Calendar} color={COLORS.cyan}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekdayData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="Submissions" radius={[6, 6, 0, 0]}>
                  {weekdayData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${160 + i * 25}, 70%, 50%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top Department Events" icon={BarChart2} color={COLORS.pink}>
            {topEventsData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topEventsData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="event" tick={{ fill: '#e2e8f0', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="Count" radius={[0, 6, 6, 0]}>
                    {topEventsData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${320 + i * 10}, 65%, 60%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* Department Attendance Tracker */}
          <div style={{
            gridColumn: 'span 2',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
            animation: 'fadeIn 0.5s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${COLORS.warning}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={18} color={COLORS.warning} />
                </div>
                <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>Department Attendance Shortage Watch</span>
              </div>
              <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '6px', background: 'rgba(245,158,11,0.12)', color: COLORS.warning, fontWeight: 700 }}>
                Avg Department Attendance: {stats.avgAttendance}%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', alignItems: 'center' }}>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '1.25rem', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: stats.shortageCount > 0 ? COLORS.danger : COLORS.success }}>
                  {stats.shortageCount}
                </div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Students Below 75%
                </div>
                <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', margin: '0.25rem 0 0 0', lineHeight: 1.3 }}>
                  {stats.shortageCount > 0 
                    ? 'Submit regular warning notices or crosscheck their on-duty applications.'
                    : 'All students are currently clear of attendance shortfalls! Awesome!'
                  }
                </p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 0.75rem 0', color: 'white', fontSize: '0.85rem', fontWeight: 700 }}>Students Requiring Watchlist Intervention</h5>
                {(!stats.shortageStudents || stats.shortageStudents.length === 0) ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px' }}>
                    No students currently meet the shortage criteria.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)' }}>
                          <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Student Name</th>
                          <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Reg No</th>
                          <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>Attendance %</th>
                          <th style={{ padding: '0.4rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.shortageStudents.map((student) => (
                          <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', color: 'white' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{student.name}</td>
                            <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{student.reg_no}</td>
                            <td style={{ padding: '0.5rem', fontWeight: 700, color: student.attendance < 65 ? COLORS.danger : COLORS.warning }}>
                              {student.attendance}%
                            </td>
                            <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                              <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: student.attendance < 65 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: student.attendance < 65 ? COLORS.danger : COLORS.warning, fontWeight: 700 }}>
                                {student.attendance < 65 ? 'Critical' : 'Shortage'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // ── 4. Render Student Dashboard View ────────────────────────────────────────
  if (role === 'student') {
    const monthlyData = (stats.monthlyTrend || []).map(row => ({
      month: new Date(row.month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
      Approved: Number(row.approved),
      Rejected: Number(row.rejected),
      Pending:  Number(row.pending),
      Total:    Number(row.total),
    }));

    const pieData = [
      { name: 'Approved', value: stats.approved || 0 },
      { name: 'Pending Review',  value: stats.pending  || 0 },
      { name: 'Rejected', value: stats.rejected || 0 },
    ].filter(d => d.value > 0);

    const topEventsData = (stats.topEvents || []).map(r => ({
      event: r.event_name?.length > 22 ? r.event_name.slice(0, 22) + '…' : r.event_name,
      Count: Number(r.count),
    }));

    const attendanceBreakdown = stats.attendanceBreakdown || { present: 0, absent: 0, od: 0 };
    const myAtt = stats.personalAttendance;
    const deptAvg = stats.deptAvgAttendance;

    const meetsRequirement = myAtt === null || myAtt >= 75;

    return (
      <div style={{ animation: 'fadeIn 0.4s ease' }}>
        {/* Student KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <KpiCard label="My OD Applications" value={stats.total || 0}  color={COLORS.primary} sub="All time submissions" />
          <KpiCard label="Approved Clearance"  value={stats.approved || 0} color={COLORS.success} sub="QR certificate generated" />
          <KpiCard label="Approval Success Rate" value={`${stats.approvalRate ?? 0}%`} color={COLORS.cyan} sub="Approved / Total" />
          <KpiCard label="Pending Review"    value={stats.pending || 0}  color={COLORS.warning} sub="Under faculty/HOD audit" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          
          {/* Attendance Comparison & Summary Panel */}
          <div style={{
            gridColumn: 'span 2',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px',
            padding: '1.5rem',
            animation: 'fadeIn 0.5s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '10px', background: `${COLORS.cyan}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={18} color={COLORS.cyan} />
                </div>
                <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>My Attendance Performance Analytics</span>
              </div>
              <span style={{
                fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '6px',
                background: meetsRequirement ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: meetsRequirement ? COLORS.success : COLORS.danger
              }}>
                {meetsRequirement ? '✅ Meets 75% Requirement' : '⚠️ Attendance Shortage Warning'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  <span>My Attendance: <strong>{myAtt !== null ? `${myAtt}%` : 'N/A'}</strong></span>
                  <span>Dept Average: <strong>{deptAvg !== null ? `${deptAvg}%` : 'N/A'}</strong></span>
                </div>
                {myAtt !== null && (
                  <div style={{ width: '100%', height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '7px', position: 'relative', overflow: 'hidden', marginBottom: '1rem' }}>
                    {/* Dept average marker */}
                    {deptAvg !== null && (
                      <div style={{ position: 'absolute', left: `${deptAvg}%`, top: 0, bottom: 0, width: '3px', background: COLORS.cyan, zIndex: 3 }} title={`Department Average: ${deptAvg}%`} />
                    )}
                    <div style={{
                      width: `${myAtt}%`, height: '100%', borderRadius: '7px',
                      background: myAtt >= 75 ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)' : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)'
                    }} />
                  </div>
                )}
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {meetsRequirement 
                    ? 'Great job! Your current attendance is in compliance with college academic clearance guidelines.'
                    : 'Warning: Your attendance is below the mandatory 75% threshold. File OD requests for eligible leaves immediately or contact your faculty advisor.'
                  }
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: COLORS.success }}>{attendanceBreakdown.present}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.15rem' }}>Present Days</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: COLORS.danger }}>{attendanceBreakdown.absent}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.15rem' }}>Absent Days</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', padding: '0.75rem', borderRadius: '12px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: COLORS.primary }}>{attendanceBreakdown.od}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.15rem' }}>Approved ODs</div>
                </div>
              </div>
            </div>
          </div>

          <ChartCard title="My Monthly Request Trend" icon={TrendingUp} color={COLORS.primary} span={2}>
            {monthlyData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="studApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.success} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.success} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="studPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={COLORS.warning} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.8rem', color: '#94a3b8' }} />
                  <Area type="monotone" dataKey="Approved" stroke={COLORS.success} strokeWidth={2} fill="url(#studApproved)" dot={{ r: 4, fill: COLORS.success }} />
                  <Area type="monotone" dataKey="Pending"  stroke={COLORS.warning} strokeWidth={2} fill="url(#studPending)"  dot={{ r: 4, fill: COLORS.warning }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="OD Application Statuses" icon={PieIcon} color={COLORS.purple}>
            {pieData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Submission Day Distribution" icon={Calendar} color={COLORS.cyan}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekdayData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="Submissions" radius={[6, 6, 0, 0]}>
                  {weekdayData.map((_, i) => (
                    <Cell key={i} fill={`hsl(${220 + i * 20}, 75%, 55%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="My Frequent Event Keywords" icon={BarChart2} color={COLORS.pink}>
            {topEventsData.length === 0 ? <EmptyState /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topEventsData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="event" tick={{ fill: '#e2e8f0', fontSize: 10 }} axisLine={false} tickLine={false} width={130} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="Count" radius={[0, 6, 6, 0]}>
                    {topEventsData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${340 + i * 8}, 70%, 60%)`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

        </div>
      </div>
    );
  }

  // Fallback
  return null;
}

function EmptyState() {
  return (
    <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem' }}>
      No data available yet
    </div>
  );
}
