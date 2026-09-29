import { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { reportReasons } from '../../data/mockData';
import './ReportModal.css';

export default function ReportModal({ postId, onClose }) {
  const [selectedReason, setSelectedReason] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!selectedReason) return;
    // In a real app, this would send to the backend
    setSubmitted(true);
    setTimeout(() => onClose(), 2000);
  };

  if (submitted) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
          <div className="report-success animate-bounce-in">
            <div className="report-success-icon">✅</div>
            <h3 className="font-heading">Report Submitted</h3>
            <p className="text-secondary text-sm">
              Thank you for helping keep Chirp safe. We'll review this report.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)' }}>
            <FiAlertTriangle size={20} style={{ marginRight: '8px', color: 'var(--color-warning)' }} />
            Report Post
          </h2>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '6px', borderRadius: '50%' }}>
            <FiX size={20} />
          </button>
        </div>
        <div className="modal-body">
          <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-md)' }}>
            Why are you reporting this post? Select the most relevant reason.
          </p>
          <div className="report-reasons">
            {reportReasons.map((reason) => (
              <label
                key={reason.id}
                className={`report-reason ${selectedReason === reason.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={reason.id}
                  checked={selectedReason === reason.id}
                  onChange={() => setSelectedReason(reason.id)}
                  className="visually-hidden"
                />
                <div className="report-reason-radio" />
                <div>
                  <span className="report-reason-label font-semibold">{reason.label}</span>
                  <span className="report-reason-desc text-sm text-secondary">{reason.description}</span>
                </div>
              </label>
            ))}
          </div>

          <textarea
            className="report-textarea"
            placeholder="Additional details (optional)"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            rows={3}
          />

          <button
            className="btn btn-danger btn-full"
            onClick={handleSubmit}
            disabled={!selectedReason}
            style={{ marginTop: 'var(--space-md)' }}
          >
            Submit Report
          </button>
        </div>
      </div>
    </div>
  );
}
