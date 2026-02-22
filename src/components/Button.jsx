import './Button.css';

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} ${className}`.trim()}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
