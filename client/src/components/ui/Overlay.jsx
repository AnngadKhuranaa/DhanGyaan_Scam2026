import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Shared behaviour for modals and drawers: Escape closes, body scroll locks,
 * focus moves into the dialog and returns to the trigger on close, and Tab
 * is kept inside the dialog.
 */
function useDialog(open, onClose, panelRef) {
  // Callers pass inline arrows; keeping onClose in a ref means re-renders don't
  // re-run the effect (which would steal focus back to the first field while typing).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const focusables = () =>
      panelRef.current?.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])') || [];
    requestAnimationFrame(() => (focusables()[0] || panelRef.current)?.focus());

    const onKey = (e) => {
      if (e.key === 'Escape') onCloseRef.current();
      if (e.key === 'Tab') {
        const items = [...focusables()];
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, panelRef]);
}

export function Modal({ open, onClose, title, children, size = 'max-w-lg' }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useDialog(open, onClose, panelRef);
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full ${size} animate-fade-in flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-2xl dark:border-slate-800 dark:bg-slate-900`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="icon-btn -mr-2" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function Drawer({ open, onClose, title, children, side = 'right', width = 'max-w-xl' }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useDialog(open, onClose, panelRef);
  if (!open) return null;

  const position = side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-slide-in';
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-slate-950/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`absolute top-0 ${position} flex h-full w-full ${width} flex-col border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <h2 id={titleId} className="truncate text-lg font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="icon-btn -mr-2" aria-label="Close panel">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
