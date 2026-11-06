import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api, ApiError } from '../../lib/api';
import { Icon } from '../../components/Icon';
import { useToast } from '../../components/Toast';
import { formatDate, formatDateTime, initials, timeOfDay } from '../../lib/format';

const STATUSES = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];

const NEXT = {
  Pending: [
    { to: 'Confirmed', label: 'Confirm', tone: 'confirm' },
    { to: 'Cancelled', label: 'Cancel', tone: 'cancel' },
  ],
  Confirmed: [
    { to: 'Completed', label: 'Mark completed', tone: 'done' },
    { to: 'Cancelled', label: 'Cancel', tone: 'cancel' },
  ],
  Completed: [],
  Cancelled: [],
};

const STATUS_TONE = {
  Pending: 'pending',
  Confirmed: 'confirmed',
  Cancelled: 'cancelled',
  Completed: 'completed',
};

function StatusPill({ status }) {
  return <span className={`pill pill--${STATUS_TONE[status] || 'pending'}`}>{status}</span>;
}

function StatCard({ label, value, tone, loading }) {
  return (
    <div className={`dstat dstat--${tone}`}>
      <b>{loading ? '—' : value}</b>
      <span>{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const toast = useToast();
  const [admin, setAdmin] = useState(undefined); // undefined = checking, null = signed out
  const [counts, setCounts] = useState({});
  const [countsLoading, setCountsLoading] = useState(true);

  const [filters, setFilters] = useState({ status: '', date: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [openId, setOpenId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [busyId, setBusyId] = useState(null);

  /* ---------- auth ---------- */
  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((a) => alive && setAdmin(a))
      .catch(() => alive && setAdmin(null));
    return () => {
      alive = false;
    };
  }, []);

  /* ---------- debounced search ---------- */
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => (f.search === searchInput.trim() ? f : { ...f, search: searchInput.trim() }));
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ---------- counts ---------- */
  const loadCounts = useCallback(async () => {
    if (!admin) return;
    setCountsLoading(true);
    try {
      const results = await Promise.all(
        STATUSES.map((status) => api.listAppointments({ status, page: 1, limit: 1 }).then((r) => [status, r.meta.total]))
      );
      setCounts(Object.fromEntries(results));
    } catch {
      /* non-fatal: stats just stay as “—” */
    } finally {
      setCountsLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  /* ---------- list ---------- */
  const loadList = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await api.listAppointments({
        page,
        limit: 20,
        status: filters.status,
        date: filters.date,
        search: filters.search,
      });
      setItems(res.items);
      setMeta(res.meta);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setAdmin(null);
        return;
      }
      setListError(err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    if (admin) loadList();
  }, [admin, loadList]);

  /* ---------- drawer ---------- */
  const open = useMemo(() => items.find((i) => i.id === openId) || null, [items, openId]);

  useEffect(() => {
    setNoteDraft(open?.staffNote || '');
  }, [openId, open?.staffNote]);

  useEffect(() => {
    if (!openId) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpenId(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openId]);

  async function transition(id, status) {
    setBusyId(id);
    try {
      await api.patchAppointment(id, { status });
      toast(`Marked ${status.toLowerCase()}`, 'success');
      setOpenId(null);
      await Promise.all([loadList(), loadCounts()]);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not update the request', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function saveNote(id) {
    setSavingNote(true);
    try {
      await api.patchAppointment(id, { staffNote: noteDraft });
      toast('Staff note saved', 'success');
      await loadList();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Could not save the note', 'error');
    } finally {
      setSavingNote(false);
    }
  }

  async function logout() {
    try {
      await api.logout(); // clears the HttpOnly cookie server-side
    } finally {
      setAdmin(null); // admin === null renders <Navigate to="/admin">
    }
  }

  if (admin === undefined) {
    return (
      <div className="page-loader">
        <span className="spinner big dark" />
        Checking your session…
      </div>
    );
  }

  if (admin === null) return <Navigate to="/admin" replace />;

  const totalPending = counts.Pending ?? 0;
  const filtered = !!(filters.status || filters.date || filters.search);

  return (
    <div className="dash">
      {/* ---------- topbar ---------- */}
      <header className="dash__top">
        <div className="dash__top-inner">
          <Link to="/" className="brand">
            <span className="brand__mark">
              <Icon name="tooth" size={20} />
            </span>
            <span className="brand__text">
              Tooth&nbsp;Care
              <small>Staff console</small>
            </span>
          </Link>

          <div className="dash__top-right">
            <span className="dash__who">
              <span className="dash__avatar">{initials(admin.name || admin.email)}</span>
              <span className="dash__who-text">
                <b>{admin.name}</b>
                <small>{admin.role}</small>
              </span>
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
              <Icon name="logout" size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="shell dash__main">
        <div className="dash__head">
          <div>
            <span className="eyebrow">Appointment requests</span>
            <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', marginTop: 12, marginBottom: 4 }}>
              {totalPending > 0 ? (
                <>
                  {totalPending} request{totalPending === 1 ? '' : 's'} waiting on you
                </>
              ) : (
                <>Inbox clear</>
              )}
            </h1>
            <p className="field-hint" style={{ margin: 0 }}>
              {meta.total} record{meta.total === 1 ? '' : 's'} total · updates refresh live after every change
            </p>
          </div>
          <button type="button" className="btn btn-brand btn-sm" onClick={() => Promise.all([loadList(), loadCounts()])}>
            <Icon name="search" size={16} /> Refresh
          </button>
        </div>

        {/* ---------- stats ---------- */}
        <div className="dstats">
          <StatCard label="Pending" value={counts.Pending} tone="pending" loading={countsLoading} />
          <StatCard label="Confirmed" value={counts.Confirmed} tone="confirmed" loading={countsLoading} />
          <StatCard label="Completed" value={counts.Completed} tone="completed" loading={countsLoading} />
          <StatCard label="Cancelled" value={counts.Cancelled} tone="cancelled" loading={countsLoading} />
        </div>

        {/* ---------- filters ---------- */}
        <div className="dfilters">
          <div className="dfilters__pills">
            <button type="button" className={`fpill ${!filters.status ? 'is-on' : ''}`} onClick={() => { setFilters((f) => ({ ...f, status: '' })); setPage(1); }}>
              All
            </button>
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                className={`fpill fpill--${STATUS_TONE[s]} ${filters.status === s ? 'is-on' : ''}`}
                onClick={() => { setFilters((f) => ({ ...f, status: f.status === s ? '' : s })); setPage(1); }}
              >
                {s}
                {counts[s] !== undefined && <span className="fpill__n">{counts[s]}</span>}
              </button>
            ))}
          </div>

          <div className="dfilters__tools">
            <label className="dsearch">
              <Icon name="search" size={17} />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name, phone or treatment…"
                aria-label="Search requests"
              />
            </label>
            <label className="ddate">
              <Icon name="calendar" size={17} />
              <input
                type="date"
                value={filters.date}
                onChange={(e) => { setFilters((f) => ({ ...f, date: e.target.value })); setPage(1); }}
                aria-label="Filter by preferred date"
              />
            </label>
            {filtered && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setFilters({ status: '', date: '', search: '' }); setSearchInput(''); setPage(1); }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ---------- list ---------- */}
        {listError && (
          <div className="alert alert-error" style={{ marginBottom: 18 }}>
            <Icon name="close" size={20} />
            <span>
              {listError.message} <button type="button" className="linkish" onClick={loadList}>Retry</button>
            </span>
          </div>
        )}

        <div className="dtable-wrap">
          <table className="dtable">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Treatment</th>
                <th>Requested slot</th>
                <th>Status</th>
                <th>Received</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`}>
                    <td colSpan={6}>
                      <div className="skeleton" style={{ height: 34 }} />
                    </td>
                  </tr>
                ))}

              {!loading && !items.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="dempty">
                      <span className="dempty__icon">
                        <Icon name={filtered ? 'search' : 'tooth'} size={30} />
                      </span>
                      <b>{filtered ? 'No requests match those filters' : 'No appointment requests yet'}</b>
                      <p>
                        {filtered
                          ? 'Try a different status, date or search term.'
                          : 'As soon as a patient submits the form, it lands here as Pending.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                items.map((a) => (
                  <tr key={a.id} className={`drow drow--${STATUS_TONE[a.status]}`} onClick={() => setOpenId(a.id)}>
                    <td>
                      <span className="dcell">
                        <span className="dcell__av">{initials(a.patientName)}</span>
                        <span>
                          <b>{a.patientName}</b>
                          <small>{a.phone}</small>
                        </span>
                      </span>
                    </td>
                    <td>
                      <b className="dcell__strong">{a.service}</b>
                      {a.message ? <small className="dcell__msg">“{a.message.slice(0, 60)}{a.message.length > 60 ? '…' : ''}”</small> : null}
                    </td>
                    <td>
                      <b>{formatDate(a.preferredDate)}</b>
                      <small>
                        {a.preferredTime} · {timeOfDay(a.preferredTime)}
                      </small>
                    </td>
                    <td>
                      <StatusPill status={a.status} />
                    </td>
                    <td className="dcell__time">
                      <b>{formatDate(a.createdAt)}</b>
                      <small>{formatDateTime(a.createdAt).split(', ')[1] || ''}</small>
                    </td>
                    <td>
                      <span className="drow__open" aria-hidden="true">
                        <Icon name="arrow" size={17} />
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* ---------- pagination ---------- */}
        {meta.totalPages > 1 && (
          <div className="dpager">
            <button type="button" className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              ← Previous
            </button>
            <span>
              Page {meta.page} of {meta.totalPages}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next →
            </button>
          </div>
        )}
      </main>

      {/* ---------- detail drawer ---------- */}
      {open && (
        <div className="drawer" role="dialog" aria-modal="true" aria-label="Appointment detail">
          <button type="button" className="drawer__scrim" aria-label="Close" onClick={() => setOpenId(null)} />
          <div className="drawer__panel">
            <div className="drawer__head">
              <div>
                <StatusPill status={open.status} />
                <h3 style={{ marginTop: 10, marginBottom: 2 }}>{open.patientName}</h3>
                <small className="field-hint">Received {formatDateTime(open.createdAt)}</small>
              </div>
              <button type="button" className="drawer__close" onClick={() => setOpenId(null)} aria-label="Close">
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="drawer__body">
              <div className="drawer__grid">
                <div className="drawer__info">
                  <span>Phone</span>
                  <a href={`tel:${open.phone.replace(/[^\d+]/g, '')}`}>{open.phone}</a>
                </div>
                {open.email && (
                  <div className="drawer__info">
                    <span>Email</span>
                    <a href={`mailto:${open.email}`}>{open.email}</a>
                  </div>
                )}
                <div className="drawer__info">
                  <span>Treatment</span>
                  <b>{open.service}</b>
                </div>
                <div className="drawer__info">
                  <span>Preferred slot</span>
                  <b>
                    {formatDate(open.preferredDate)} · {open.preferredTime}
                  </b>
                </div>
              </div>

              {open.message && (
                <div className="drawer__note drawer__note--patient">
                  <b>Patient’s message</b>
                  <p>{open.message}</p>
                </div>
              )}

              <div className="drawer__note">
                <b>
                  <Icon name="note" size={15} /> Staff note
                </b>
                <textarea
                  className="input"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  maxLength={500}
                  placeholder="Internal only — never shown to the patient."
                />
                <div className="drawer__note-actions">
                  <span className="field-hint">{500 - noteDraft.length} left</span>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => saveNote(open.id)}
                    disabled={savingNote || noteDraft === (open.staffNote || '')}
                  >
                    {savingNote ? <span className="spinner" /> : 'Save note'}
                  </button>
                </div>
                <p className="field-hint" style={{ margin: 0 }}>
                  Notification to staff:{' '}
                  <b>{open.emailStatus?.staffNotified ? 'sent' : 'not sent'}</b>
                </p>
              </div>

              <div className="drawer__actions">
                <b>Move to</b>
                {NEXT[open.status].length === 0 && (
                  <p className="field-hint" style={{ margin: 0 }}>
                    {open.status} is a final state — no further transitions.
                  </p>
                )}
                <div className="drawer__actions-row">
                  {NEXT[open.status].map((n) => (
                    <button
                      key={n.to}
                      type="button"
                      className={`btn btn-sm drawer__action drawer__action--${n.tone}`}
                      disabled={busyId === open.id}
                      onClick={() => transition(open.id, n.to)}
                    >
                      {busyId === open.id ? <span className="spinner" /> : n.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
