import './FormField.css';

export function FormField({
  label,
  name,
  id,
  error,
  children,
  required,
  className = '',
}) {
  const fieldId = id || name;
  return (
    <div className={`form-field ${className}`.trim()}>
      {label && (
        <label htmlFor={fieldId} className="form-field__label">
          {label}
          {required && <span className="form-field__required" aria-hidden="true"> *</span>}
        </label>
      )}
      {children}
      {error && <p className="form-field__error" role="alert">{error}</p>}
    </div>
  );
}
