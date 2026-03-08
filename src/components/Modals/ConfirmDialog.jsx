import { useEffect } from 'react';
import { AlertTriangle, Trash2, CheckCircle, XCircle, Info } from 'lucide-react';
import { Button } from '../Button';
import './ConfirmDialog.css';

const ICONS = {
  danger: Trash2,
  warning: AlertTriangle,
  success: CheckCircle,
  primary: Info,
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  loading = false,
}) {
  const Icon = ICONS[variant] || Info;

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

  function handleConfirm() {
    onConfirm?.();
  }

  return (
    <div
      className="confirm-overlay"
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon confirm-icon--${variant}`}>
          <Icon size={28} aria-hidden />
        </div>
        <h2 id="confirm-title" className="confirm-title">{title}</h2>
        {message && (
          <p id="confirm-message" className="confirm-message">{message}</p>
        )}
        <div className="confirm-actions">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? '…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
