import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import RightPanel from './RightPanel';
import './Layout.css';

export default function Layout() {
  return (
    <div className="app-layout" id="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
      <RightPanel />
    </div>
  );
}
