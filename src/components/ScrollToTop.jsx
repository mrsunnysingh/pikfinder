import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrolls to the top whenever the route changes — covers both the window
// (public pages) and the dashboard's internal scroll container.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    const dc = document.querySelector('.dashboard-content');
    if (dc) dc.scrollTop = 0;
  }, [pathname]);
  return null;
}
