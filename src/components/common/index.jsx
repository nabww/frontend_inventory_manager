import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts';
import { RiLoader4Line, RiCloseLine, RiCheckLine, RiErrorWarningLine } from 'react-icons/ri';

export const Spinner = ({ size = 16 }) => <RiLoader4Line size={size} className="spin" />;

export const PageLoader = () => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh' }}>
    <Spinner size={26} />
  </div>
);

export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
};

export const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)    return <Navigate to="/login" replace />;
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

export const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export const Modal = ({ open, onClose, title, children, footer, size = '' }) => {
  if (!open) return null;
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><RiCloseLine size={17} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

export const Confirm = ({ open, onClose, onConfirm, title, message, loading, danger }) => (
  <Modal open={open} onClose={onClose} title={title || 'Confirm'}
    footer={<>
      <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
        {loading ? <Spinner size={13} /> : <RiCheckLine size={13} />} {loading ? 'Processing…' : 'Confirm'}
      </button>
    </>}>
    <p style={{ color:'var(--text-2)', fontSize:'.88rem' }}>{message}</p>
  </Modal>
);

export const ErrAlert = ({ message }) => {
  if (!message) return null;
  return <div className="alert alert-err"><RiErrorWarningLine size={15} /><span>{message}</span></div>;
};

export const StatusBadge = ({ status }) => {
  const map = { active:'b-active', under_repair:'b-repair', decommissioned:'b-decomm', lost:'b-lost',
                pass:'b-pass', fail:'b-fail', partial:'b-partial' };
  return <span className={`badge ${map[status] || 'b-decomm'}`}>{status?.replace(/_/g,' ')}</span>;
};

export const SimBadge = ({ hasSim }) => (
  <span className={`badge ${hasSim ? 'b-sim' : 'b-decomm'}`}>{hasSim ? 'SIM' : 'WiFi only'}</span>
);

export const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = Math.max(1, page - 1); i <= Math.min(totalPages, page + 1); i++) pages.push(i);
  return (
    <div className="pages">
      <button className="pg" onClick={() => onChange(page - 1)} disabled={page === 1}>‹</button>
      {pages[0] > 1 && <><button className="pg" onClick={() => onChange(1)}>1</button><span className="dim" style={{padding:'0 3px'}}>…</span></>}
      {pages.map(p => <button key={p} className={`pg ${p === page ? 'on' : ''}`} onClick={() => onChange(p)}>{p}</button>)}
      {pages[pages.length-1] < totalPages && <><span className="dim" style={{padding:'0 3px'}}>…</span><button className="pg" onClick={() => onChange(totalPages)}>{totalPages}</button></>}
      <button className="pg" onClick={() => onChange(page + 1)} disabled={page === totalPages}>›</button>
    </div>
  );
};

export const SkeletonRows = ({ cols = 5, rows = 6 }) => (
  <>{Array.from({length:rows}).map((_,i) => (
    <tr key={i}>{Array.from({length:cols}).map((_,j) => (
      <td key={j}><div className="skeleton" style={{height:13,width:j===0?70:'60%'}} /></td>
    ))}</tr>
  ))}</>
);

export const Empty = ({ icon, title, sub, action }) => (
  <div className="empty">
    <div className="empty-icon">{icon || '📦'}</div>
    <div className="empty-title">{title || 'Nothing here yet'}</div>
    {sub && <p className="dim mt-8">{sub}</p>}
    {action && <div className="mt-16">{action}</div>}
  </div>
);

export const Field = ({ label, error, required, children }) => (
  <div className="fg">
    {label && <label className="label">{label}{required && <span className="req">*</span>}</label>}
    {children}
    {error && <div className="ferr">{error}</div>}
  </div>
);

export const SectionLabel = ({ children }) => <div className="sec-label">{children}</div>;
