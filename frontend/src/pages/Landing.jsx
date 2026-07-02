import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ShieldAlert, Calendar, MessageCircle } from 'lucide-react';
import ThemeSelector from '../components/ThemeSelector';

export default function Landing() {
  return (
    <div className="animate-slide-up">
      <nav className="landing-navbar">
        <div className="logo-text">Edu OD</div>
        <div className="nav-links" style={{ alignItems: 'center' }}>
          <ThemeSelector />
          <Link to="/login" className="btn btn-secondary" style={{ padding: '0.6rem 1.2rem' }}>Login</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.6rem 1.2rem' }}>Get Started</Link>
        </div>
      </nav>

      <header className="hero-section">
        <div className="hero-badge">AI-Powered Portal v2.0</div>
        <h1 className="hero-title">Automated On-Duty Requests & Multi-Level Approvals</h1>
        <p className="hero-subtitle">
          Say goodbye to paper-based leaves. Submit OD requests online, track workflows in real time, generate secured QR-code certificates, and receive automated audit checks.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary">Apply Now</Link>
          <Link to="/login" className="btn btn-secondary">Review Pending Requests</Link>
        </div>
      </header>

      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Key Core Features</h2>
          <p className="section-subtitle">A modern administration tool built for colleges</p>
        </div>

        <div className="features-grid">
          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper">
              <CheckCircle size={30} />
            </div>
            <h3 className="feature-title">Multi-Level Approval</h3>
            <p className="feature-desc">Secure workflow from Student to Faculty recommendation and final HOD authorization.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper">
              <ShieldAlert size={30} />
            </div>
            <h3 className="feature-title">Smart Audits</h3>
            <p className="feature-desc">AI-like checks evaluating risk indexes, clashing dates, and document extensions upon submission.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper">
              <Calendar size={30} />
            </div>
            <h3 className="feature-title">Dynamic Calendars</h3>
            <p className="feature-desc">Students and evaluators track active On-Duty dates directly via visual dashboard calendars.</p>
          </div>

          <div className="feature-card glass-card">
            <div className="feature-icon-wrapper">
              <MessageCircle size={30} />
            </div>
            <h3 className="feature-title">Context Chatbot</h3>
            <p className="feature-desc">Floating AI assistant answering FAQs and instantly checking your personal OD approval stats.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
