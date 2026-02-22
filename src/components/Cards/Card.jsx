import './Card.css';

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`card ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`card-header ${className}`.trim()}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h3 className={`card-title ${className}`.trim()}>{children}</h3>;
}

export function CardBody({ children, className = '' }) {
  return <div className={`card-body ${className}`.trim()}>{children}</div>;
}
