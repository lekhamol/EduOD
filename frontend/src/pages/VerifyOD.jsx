import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck, ShieldAlert, Calendar, User, FileText, Award } from 'lucide-react';

export default function VerifyOD() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchODDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/od/${id}`);
        if (response.data.success) {
          setRequest(response.data.request);
        } else {
          setError('Invalid clearance reference.');
        }
      } catch (err) {
        console.error(err);
        setError('Clearance reference not found. The document may have been altered or revoked.');
      } finally {
        setLoading(false);
      }
    };

    fetchODDetails();
  }, [id]);

  return (
    <div className="auth-wrapper" style={{ background: '#090d16' }}>
      <div className="auth-card glass-card animate-slide-up" style={{ maxWidth: '600px', padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-text" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Edu OD</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure Document Verification Hub</span>
        </div>

        {loading ? (
          <p style={{ textSelf: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>Querying secure registry database...</p>
        ) : error ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 1.5rem' }}>
              <ShieldAlert size={40} />
            </div>
            <h3 style={{ color: 'white', marginBottom: '0.75rem' }}>Verification Failed</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '2rem' }}>{error}</p>
            <Link to="/" className="btn btn-secondary">Return Home</Link>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justify: 'center', margin: '0 auto 1.5rem' }}>
                <ShieldCheck size={40} />
              </div>
              <h3 style={{ color: 'white', marginBottom: '0.25rem' }}>Clearance Verified</h3>
              <span className="badge badge-approved" style={{ fontSize: '0.75rem' }}>Authentic Document</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={18} color="var(--primary)" />
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Student Name</span>
                  <strong style={{ color: 'white' }}>{request.student_name}</strong> ({request.reg_no})
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Award size={18} color="var(--primary)" />
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Department</span>
                  <strong style={{ color: 'white' }}>{request.department}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={18} color="var(--primary)" />
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Event Details</span>
                  <strong style={{ color: 'white' }}>{request.event_name}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Calendar size={18} color="var(--primary)" />
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Clearance Period</span>
                  <strong style={{ color: 'white' }}>{new Date(request.start_date).toLocaleDateString()}</strong> to <strong style={{ color: 'white' }}>{new Date(request.end_date).toLocaleDateString()}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldCheck size={18} color="var(--primary)" />
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block' }}>Approval Status</span>
                  <span className={`badge ${request.status === 'Approved' ? 'badge-approved' : 'badge-pending'}`} style={{ marginTop: '0.25rem' }}>
                    {request.status}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                This is a secure verification of an On-Duty certificate registered in the institution's official database.
              </p>
              <Link to="/" className="btn btn-secondary">System Homepage</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
