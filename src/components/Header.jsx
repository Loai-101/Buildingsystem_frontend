import './Header.css';

export function Header({ title, children }) {
  return (
    <header className="header">
      <h1 className="header-title">{title}</h1>
      {children && <div className="header-actions">{children}</div>}
    </header>
  );
}
