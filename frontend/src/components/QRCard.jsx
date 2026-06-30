import React from 'react';
import { X, Printer } from 'lucide-react';

export default function QRCard({ request, onClose }) {
  if (!request) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-certificate').innerHTML;
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontSize: '1.2rem' }}>Approved OD Clearance Letter</h3>
          <X size={20} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>
        <div className="modal-body">
          <div id="printable-certificate" className="certificate-container">
            <div className="cert-header">
              <h2 className="cert-title">EXCELSIOR ACADEMY</h2>
              <p style={{ fontSize: '0.8rem', letterSpacing: '0.1em', color: '#4b5563' }}>
                DEPARTMENT OF {request.department ? request.department.toUpperCase() : 'STUDIES'}
              </p>
              <div style={{ margin: '0.75rem 0', borderBottom: '1px solid #111827' }}></div>
              <p style={{ textAlign: 'right', fontStyle: 'italic', fontSize: '0.9rem' }}>
                Date: {new Date().toLocaleDateString()}
              </p>
            </div>

            <div className="cert-subtitle" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1rem' }}>
              OFFICIAL ON-DUTY APPROVAL CERTIFICATE
            </div>

            <div className="cert-body">
              <p>This certifies that <strong>{request.student_name}</strong> (Register No: <strong>{request.reg_no}</strong>) from the Department of <strong>{request.department}</strong> has been granted On-Duty (OD) clearance.</p>
              
              <div className="cert-details-grid">
                <span className="cert-label">Event:</span>
                <span>{request.event_name}</span>

                <span className="cert-label">Duration:</span>
                <span>{new Date(request.start_date).toLocaleDateString()} to {new Date(request.end_date).toLocaleDateString()}</span>

                <span className="cert-label">Reason:</span>
                <span>{request.reason}</span>
              </div>

              <p style={{ fontSize: '0.95rem', color: '#4b5563', marginTop: '1rem' }}>
                The student is authorized to represent the institution for the above schedule. Absence during this period is marked as excused attendance leave.
              </p>
            </div>

            <div className="cert-footer">
              <div className="cert-qr-container">
                {request.qr_code_data ? (
                  <img src={request.qr_code_data} alt="Verification QR Code" className="cert-qr-img" />
                ) : (
                  <div style={{ fontSize: '0.5rem', textAlign: 'center', color: '#9ca3af' }}>No QR Available</div>
                )}
              </div>
              <div className="cert-signature">
                <strong style={{ fontSize: '0.95rem' }}>Head of Department</strong>
                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>Approved via Digital Portal</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={16} /> Print Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
