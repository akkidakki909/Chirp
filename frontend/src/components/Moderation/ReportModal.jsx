
import { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import { reportReasons } from '../../data/mockData';
import { apiClient } from '../../api/client';
import './ReportModal.css';

export default function ReportModal({ postId, onClose }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedReason || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      await apiClient.post('/reports', {
        target_type: 'tweet',
        target_tweet_id: postId,
        reason: selectedReason,
        details: additionalInfo.trim(),
      });

      setSubmitted(true);
    } catch (err) {
      setError(
        err.response?.data?.error ||
        'Could not submit your report. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content report-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {submitted ? (
          <div className="report-success animate-bounce-in">
            <div className="report-success-icon">✅</div>
            <h3 className="font-heading">Report Submitted</h3>
            <p className="text-secondary text-sm">
              Thank you for helping keep Chirp safe.
            </p>
            <button
              className="btn btn-primary btn-full"
              onClick={onClose}
              style={{ marginTop: 16 }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="modal-header">
              <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)' }}>
                <FiAlertTriangle
                  size={20}
                  style={{ marginRight: 8, color: 'var(--color-warning)' }}
                />
                Report Post
              </h2>

              <button
                type="button"
                className="btn-ghost"
                onClick={onClose}
                aria-label="Close report dialog"
                style={{ padding: 6, borderRadius: '50%' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>
                Why are you reporting this post?
              </p>

              <div className="report-reasons">
                {reportReasons.map((reason) => (
                  <label
                    key={reason.id}
                    className={`report-reason ${
                      selectedReason === reason.id ? 'selected' : ''
                    }`}
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
                      <span className="report-reason-label font-semibold">
                        {reason.label}
                      </span>
                      <span className="report-reason-desc text-sm text-secondary">
                        {reason.description}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <textarea
                className="report-textarea"
                placeholder="Additional details (optional)"
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                maxLength={2000}
                rows={3}
              />

              {error && (
                <p role="alert" className="text-danger text-sm" style={{ marginTop: 10 }}>
                  {error}
                </p>
              )}

              <button
                type="button"
                className="btn btn-danger btn-full"
                onClick={handleSubmit}
                disabled={!selectedReason || submitting}
                style={{ marginTop: 16 }}
              >
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
