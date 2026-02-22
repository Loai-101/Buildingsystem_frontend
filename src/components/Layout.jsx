import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import './Layout.css';

export function Layout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Navbar />
        <div className="app-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
