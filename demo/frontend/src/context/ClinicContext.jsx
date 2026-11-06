import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

/**
 * Loads clinic profile + treatments once at app start and shares them.
 * Public pages degrade gracefully (skeletons → error notice with retry)
 * instead of blanking when the API is unreachable.
 */
const ClinicContext = createContext(null);

export function ClinicProvider({ children }) {
  const [clinic, setClinic] = useState(null);
  const [services, setServices] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);

  async function load() {
    setStatus('loading');
    setError(null);
    try {
      const [c, s] = await Promise.all([api.getClinic(), api.getServices()]);
      setClinic(c);
      setServices(s);
      setStatus('ready');
    } catch (err) {
      setError(err);
      setStatus('error');
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([api.getClinic(controller.signal), api.getServices(controller.signal)])
      .then(([c, s]) => {
        setClinic(c);
        setServices(s);
        setStatus('ready');
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(err);
        setStatus('error');
      });
    return () => controller.abort();
  }, []);

  const value = useMemo(
    () => ({ clinic, services, status, error, reload: load }),
    [clinic, services, status, error]
  );

  return <ClinicContext.Provider value={value}>{children}</ClinicContext.Provider>;
}

export function useClinic() {
  const ctx = useContext(ClinicContext);
  if (!ctx) throw new Error('useClinic must be used inside <ClinicProvider>');
  return ctx;
}
