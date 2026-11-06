import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { applyMode, resolveMode, watchSystemPreference } from './lib/motion';
import { Navbar, Footer } from './components/NavFooter';
import { MotionHint } from './components/MotionHint';
import Home from './pages/Home';
import Treatments from './pages/Treatments';
import About from './pages/About';
import Book from './pages/Book';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';

/** Thin gradient bar at the top of the viewport, driven by one rAF per scroll. */
function ScrollProgress() {
  const ref = useRef(null);

  useEffect(() => {
    const bar = ref.current;
    if (!bar) return undefined;
    let raf = 0;
    const paint = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return <div className="scroll-progress" ref={ref} aria-hidden="true" />;
}

/** Keeps the page title sane per route and scrolls to top on navigation. */
function usePageEffects(title) {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    document.title = title
      ? `${title} · Tooth Care Dental Clinic`
      : 'Tooth Care Dental Clinic — Invisalign, Braces & Implants in Jaipur';
  }, [pathname, title]);
}

function PublicLayout({ children }) {
  usePageEffects(null);
  const { pathname } = useLocation();

  return (
    <>
      <ScrollProgress />
      <Navbar />
      {/* key restarts the entrance transition on every route change */}
      <main id="main" key={pathname} className="page-enter">
        {children}
      </main>
      <Footer />
      <MotionHint />
    </>
  );
}

export default function App() {
  useEffect(() => {
    // index.html already set this before paint; re-apply in case storage or the
    // OS setting changed in another tab, then follow live OS changes.
    applyMode(resolveMode());
    return watchSystemPreference();
  }, []);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicLayout>
            <Home />
          </PublicLayout>
        }
      />
      <Route
        path="/treatments"
        element={
          <PublicLayout>
            <Treatments />
          </PublicLayout>
        }
      />
      <Route
        path="/about"
        element={
          <PublicLayout>
            <About />
          </PublicLayout>
        }
      />
      <Route
        path="/book"
        element={
          <PublicLayout>
            <Book />
          </PublicLayout>
        }
      />
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/appointments" element={<Dashboard />} />
      <Route
        path="*"
        element={
          <PublicLayout>
            <NotFound />
          </PublicLayout>
        }
      />
    </Routes>
  );
}
