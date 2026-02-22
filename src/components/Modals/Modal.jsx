import { useEffect } from 'react';
import './Modal.css';

export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      const handleEscape = (e) => e.key === 'Escape' && onClose();
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
