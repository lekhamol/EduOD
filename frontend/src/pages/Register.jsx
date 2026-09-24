import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [department, setDepartment] = useState('Computer Science');
  const [regNo, setRegNo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (role === 'student' && !regNo) {
      setError('Register number is required for students.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        role,
        department,
        reg_no: role === 'student' ? regNo : undefined
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        if (role === 'student') navigate('/student');
        else if (role === 'faculty') navigate('/faculty');
        else if (role === 'hod') navigate('/hod');
      }
    } catch (err) {
      console.error(err);
      if (!err.response) {
        setError('Server Connection Error: Backend is not running on port 5000. Please start the backend server.');
      } else {
        setError(err.response.data?.error || 'Registration failed. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-card animate-slide-up" style={{ maxWidth: '540px', padding: '2.5rem' }}>
        <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
          <div className="auth-logo">Edu OD</div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>Create Portal Account</h2>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              required
              placeholder="e.g. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              placeholder="e.g. jane@edu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="student">Student</option>
                <option value="faculty">Faculty Advisor</option>
                <option value="hod">HOD / Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dept">Department</label>
              <select id="dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics & Comm">Electronics & Comm</option>
                <option value="Information Technology">Information Tech</option>
                <option value="Mechanical Eng">Mechanical Eng</option>
                <option value="Civil Eng">Civil Eng</option>
              </select>
            </div>
          </div>

          {role === 'student' && (
            <div className="form-group">
              <label htmlFor="regNo">Register Number</label>
              <input
                id="regNo"
                type="text"
                required
                placeholder="e.g. 2026CS1045"
                value={regNo}
                onChange={(e) => setRegNo(e.target.value)}
              />
            </div>
          )}

          <button className="btn btn-primary" type="submit" style={{ width: '100%', marginTop: '1.5rem' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign In</Link>
        </p>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem' }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>← Back to Homepage</Link>
        </p>
      </div>
    </div>
  );
}
