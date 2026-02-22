import './Table.css';

export function Table({ children, className = '' }) {
  return (
    <div className="table-wrapper">
      <table className={`table ${className}`.trim()}>{children}</table>
    </div>
  );
}

export function TableHead({ children }) {
  return <thead><tr>{children}</tr></thead>;
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({ children, className = '' }) {
  return <tr className={className}>{children}</tr>;
}

export function Th({ children, className = '' }) {
  return <th className={className}>{children}</th>;
}

export function Td({ children, className = '' }) {
  return <td className={className}>{children}</td>;
}
