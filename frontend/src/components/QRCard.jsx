import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { X, Printer, Download, CheckCircle, ShieldCheck, Loader } from 'lucide-react';

export default function QRCard({ request, onClose }) {
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    if (!request) {
      setLetter(null);
      return;
    }
    fetchLetter();
  }, [request]);

  const fetchLetter = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      // Try the enriched letter endpoint first; fall back to basic request data
      try {
        const res = await axios.get(`http://localhost:5000/api/od/${request.id}/letter`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data.success) {
          setLetter(res.data.letter);
          return;
        }
      } catch {
        // fall back to basic data
      }
      // Fallback: build letter from the request prop directly
      const deptCode = (request.department || 'GEN')
        .split(/[\s&]+/)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4);
      const year = new Date().getFullYear();
      const refNo = `OD/${deptCode}/${year}/${String(request.id).padStart(4, '0')}`;
      setLetter({
        ...request,
        ref_no: refNo,
        letter_date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        start_date_fmt: new Date(request.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        end_date_fmt: new Date(request.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        faculty_name: request.faculty_name || 'Class Faculty',
        hod_name: 'Head of Department',
        verification_url: `http://localhost:5173/verify-od/${request.id}`,
      });
    } catch (err) {
      setError('Failed to generate letter.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>OD Letter - ${letter?.ref_no || ''}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', serif; background: #fff; color: #1a1a2e; }
            .od-letter { max-width: 780px; margin: 0 auto; padding: 48px; border: 3px double #1a1a2e; min-height: 1050px; position: relative; }
            .letter-watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%) rotate(-35deg); font-size: 5rem; font-weight: 900; color: rgba(99,102,241,0.06); pointer-events: none; white-space: nowrap; letter-spacing: 0.2em; }
            .letter-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #1a1a2e; }
            .inst-logo { display: flex; flex-direction: column; }
            .inst-name { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 800; color: #1a1a2e; letter-spacing: 0.05em; }
            .inst-tagline { font-size: 10px; color: #6b7280; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 3px; }
            .inst-dept { font-size: 12px; color: #374151; font-weight: 600; margin-top: 6px; }
            .letter-meta { text-align: right; font-size: 11px; color: #6b7280; line-height: 1.8; }
            .letter-title-section { text-align: center; margin: 20px 0; }
            .cert-ribbon { display: inline-block; background: #1a1a2e; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 0.18em; padding: 5px 24px; text-transform: uppercase; }
            .letter-title { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 800; color: #1a1a2e; margin: 8px 0 2px; letter-spacing: 0.04em; }
            .letter-subtitle { font-size: 11px; color: #6b7280; letter-spacing: 0.05em; }
            .ref-row { display: flex; justify-content: space-between; font-size: 11.5px; color: #374151; margin: 16px 0; padding: 8px 12px; background: #f3f4f6; border-left: 3px solid #6366f1; }
            .letter-salutation { font-size: 14px; color: #374151; margin: 16px 0 12px; }
            .letter-body-text { font-size: 14px; line-height: 1.75; color: #1a1a2e; margin-bottom: 16px; }
            .details-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
            .details-table th { background: #1a1a2e; color: #fff; padding: 8px 12px; text-align: left; font-size: 11px; letter-spacing: 0.05em; font-weight: 600; }
            .details-table td { padding: 9px 12px; border-bottom: 1px solid #e5e7eb; }
            .details-table tr:nth-child(even) td { background: #f9fafb; }
            .details-table td:first-child { font-weight: 600; color: #374151; width: 38%; }
            .approval-chain { margin: 20px 0; padding: 14px; border: 1px solid #e5e7eb; border-radius: 6px; background: #f9fafb; }
            .approval-chain-title { font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #374151; margin-bottom: 12px; }
            .approval-step { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
            .approval-dot { width: 22px; height: 22px; border-radius: 50%; background: #10b981; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
            .approval-dot svg { width: 12px; height: 12px; stroke: #fff; stroke-width: 3; fill: none; }
            .approval-info { font-size: 12px; line-height: 1.5; }
            .approval-info strong { display: block; color: #111827; }
            .approval-info span { color: #6b7280; }
            .approval-comment { font-style: italic; color: #4b5563; font-size: 11.5px; margin-top: 3px; }
            .letter-closing { font-size: 13.5px; color: #374151; line-height: 1.7; margin: 16px 0; }
            .footer-section { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            .qr-area { text-align: center; }
            .qr-area img { width: 100px; height: 100px; border: 1px solid #d1d5db; padding: 4px; }
            .qr-label { font-size: 9px; color: #9ca3af; margin-top: 4px; }
            .seal-area { width: 100px; height: 100px; border: 3px double #6366f1; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 8px; }
            .seal-text-main { font-size: 9px; font-weight: 800; letter-spacing: 0.1em; color: #6366f1; text-transform: uppercase; }
            .seal-text-sub { font-size: 7.5px; color: #9ca3af; margin-top: 2px; }
            .signature-block { text-align: center; }
            .sig-line { width: 160px; height: 1px; background: #9ca3af; margin: 0 auto 5px; }
            .sig-name { font-size: 13px; font-weight: 700; color: #1a1a2e; }
            .sig-title { font-size: 10px; color: #6b7280; }
            .footer-note { text-align: center; font-size: 9px; color: #9ca3af; margin-top: 16px; letter-spacing: 0.05em; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  if (!request) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '820px', maxHeight: '92vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={20} color="var(--success)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Official OD Approval Letter
            </h3>
            {letter?.ref_no && (
              <span style={{
                fontSize: '0.75rem',
                background: 'rgba(99,102,241,0.12)',
                color: 'var(--primary)',
                padding: '2px 10px',
                borderRadius: '20px',
                fontWeight: 600,
                letterSpacing: '0.04em',
              }}>
                {letter.ref_no}
              </span>
            )}
          </div>
          <X size={20} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={onClose} />
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '1.5rem 2rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
              <p>Generating official letter...</p>
            </div>
          ) : error ? (
            <p style={{ color: 'var(--danger)', textAlign: 'center', padding: '2rem' }}>{error}</p>
          ) : letter ? (
            <>
              {/* ─── Printable Certificate ─── */}
              <div ref={printRef} id="printable-certificate">
                <div className="od-letter-doc">
                  {/* Watermark */}
                  <div className="od-letter-watermark">EduOD</div>

                  {/* ── Header ── */}
                  <div className="od-letter-header">
                    <div>
                      <div className="od-inst-name">EXCELSIOR ACADEMY</div>
                      <div className="od-inst-tagline">Excellence in Education & Innovation</div>
                      <div className="od-inst-dept">
                        Department of {letter.department}
                      </div>
                    </div>
                    <div className="od-letter-meta">
                      <div><strong>Ref No:</strong> {letter.ref_no}</div>
                      <div><strong>Issue Date:</strong> {letter.letter_date}</div>
                      <div><strong>Document Type:</strong> On-Duty Clearance</div>
                    </div>
                  </div>

                  {/* ── Title ── */}
                  <div className="od-letter-title-section">
                    <div className="od-cert-ribbon">Official On-Duty Approval Certificate</div>
                  </div>

                  {/* ── Salutation ── */}
                  <p className="od-letter-salutation">To Whomsoever It May Concern,</p>

                  {/* ── Body Text ── */}
                  <p className="od-letter-body">
                    This is to certify that the student mentioned below has been granted an <strong>official On-Duty (OD) clearance</strong> by the Department of <strong>{letter.department}</strong>, Excelsior Academy, and is duly authorised to be absent from regular academic sessions for the purpose mentioned hereunder. The absence shall be recorded as <strong>On-Duty</strong> and shall not be counted against the student's attendance.
                  </p>

                  {/* ── Student & Event Details Table ── */}
                  <table className="od-details-table">
                    <thead>
                      <tr>
                        <th colSpan={2}>Student & Event Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Student Name</td>
                        <td><strong>{letter.student_name}</strong></td>
                      </tr>
                      <tr>
                        <td>Register Number</td>
                        <td>{letter.reg_no}</td>
                      </tr>
                      <tr>
                        <td>Department</td>
                        <td>{letter.department}</td>
                      </tr>
                      <tr>
                        <td>Event / Activity</td>
                        <td><strong>{letter.event_name}</strong></td>
                      </tr>
                      <tr>
                        <td>OD Period</td>
                        <td>
                          {letter.start_date_fmt}
                          {letter.start_date_fmt !== letter.end_date_fmt
                            ? ` to ${letter.end_date_fmt}`
                            : ' (Single Day)'}
                        </td>
                      </tr>
                      <tr>
                        <td>Purpose</td>
                        <td style={{ fontStyle: 'italic' }}>{letter.reason}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* ── Approval Chain ── */}
                  <div className="od-approval-chain">
                    <div className="od-chain-title">Approval Chain</div>

                    {/* Faculty */}
                    <div className="od-chain-step">
                      <div className="od-chain-dot od-chain-dot--approved">
                        <CheckCircle size={12} />
                      </div>
                      <div className="od-chain-info">
                        <strong>{letter.faculty_name}</strong>
                        <span>Faculty Advisor — Recommended</span>
                        {letter.faculty_comment && (
                          <div className="od-chain-comment">"{letter.faculty_comment}"</div>
                        )}
                      </div>
                    </div>

                    {/* HOD */}
                    <div className="od-chain-step">
                      <div className="od-chain-dot od-chain-dot--approved">
                        <CheckCircle size={12} />
                      </div>
                      <div className="od-chain-info">
                        <strong>{letter.hod_name || 'Head of Department'}</strong>
                        <span>HOD — Final Approved</span>
                        {letter.hod_comment && (
                          <div className="od-chain-comment">"{letter.hod_comment}"</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Closing Note ── */}
                  <p className="od-letter-closing">
                    The student is hereby permitted and encouraged to represent the institution at the aforementioned event. All concerned teaching staff are requested to mark the student's attendance as <strong>On-Duty (OD)</strong> for the specified period without any objection.
                  </p>
                  <p className="od-letter-closing" style={{ marginTop: '0.5rem' }}>
                    This letter is digitally authenticated and can be verified by scanning the QR code below or visiting the institution's OD verification portal.
                  </p>

                  {/* ── Footer: QR + Seal + Signature ── */}
                  <div className="od-letter-footer">
                    {/* QR Code */}
                    <div className="od-qr-area">
                      {letter.qr_code_data ? (
                        <img src={letter.qr_code_data} alt="Verification QR" className="od-qr-img" />
                      ) : (
                        <div className="od-qr-placeholder">QR<br/>N/A</div>
                      )}
                      <div className="od-qr-label">Scan to Verify</div>
                    </div>

                    {/* Digital Seal */}
                    <div className="od-seal">
                      <div className="od-seal-inner">
                        <div className="od-seal-main">EXCELSIOR</div>
                        <div className="od-seal-sub">ACADEMY</div>
                        <div className="od-seal-line" />
                        <div className="od-seal-status">APPROVED</div>
                      </div>
                    </div>

                    {/* Signature */}
                    <div className="od-signature-block">
                      <div className="od-sig-space" />
                      <div className="od-sig-line" />
                      <div className="od-sig-name">{letter.hod_name || 'Head of Department'}</div>
                      <div className="od-sig-title">Head of Department</div>
                      <div className="od-sig-dept">Dept. of {letter.department}</div>
                    </div>
                  </div>

                  <div className="od-footer-note">
                    Document Reference: {letter.ref_no} | Issued: {letter.letter_date} | Verify at: {letter.verification_url}
                  </div>
                </div>
              </div>

              {/* ─── Action Buttons ─── */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
                <button className="btn btn-primary" onClick={handlePrint}>
                  <Printer size={15} /> Print / Save PDF
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
