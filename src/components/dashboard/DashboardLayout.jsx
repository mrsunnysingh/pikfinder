import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import DashboardHeader from './DashboardHeader';

export default function DashboardLayout() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // Auto-close the mobile drawer whenever the route changes.
  useEffect(() => { setNavOpen(false); }, [location.pathname]);

  return (
    <div className={`dashboard-layout${navOpen ? ' nav-open' : ''}`}>
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      {/* Dim overlay — only interactive on mobile when the drawer is open. */}
      <div
        className="dashboard-overlay"
        onClick={() => setNavOpen(false)}
        aria-hidden={!navOpen}
      />
      <div className="dashboard-main">
        <DashboardHeader onMenu={() => setNavOpen((v) => !v)} />
        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
