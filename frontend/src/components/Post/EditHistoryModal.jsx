import { FiX, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';
import './EditHistoryModal.css';

export default function EditHistoryModal({ editHistory, onClose }) {
  if (!editHistory || editHistory.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-history-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="font-heading" style={{ fontSize: 'var(--text-xl)' }}>Edit History</h2>
          <button className="btn-ghost" onClick={onClose} style={{ padding: '6px', borderRadius: '50%' }}>
            <FiX size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="edit-history-list">
            {editHistory.map((edit, index) => (
              <div key={index} className="edit-history-item animate-fade-in">
                <div className="edit-history-header">
                  <span className="badge badge-secondary">
                    {index === editHistory.length - 1 ? 'Current' : `Version ${index + 1}`}
                  </span>
                  <span className="edit-history-time text-sm text-tertiary">
                    <FiClock size={12} />
                    {format(new Date(edit.editedAt), 'MMM d, yyyy · h:mm a')}
                  </span>
                </div>
                <p className="edit-history-content">{edit.content}</p>
                {index < editHistory.length - 1 && <hr className="divider" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
