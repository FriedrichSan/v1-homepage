import React, { useEffect, useId, useRef } from "react";

interface CardProps {
  open: boolean;
  onClose: () => void;
  kicker?: string;
  title: string;
  children: React.ReactNode;
}

// classified dossier modal
export const Card: React.FC<CardProps> = ({ open, onClose, kicker, title, children }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const headingId = useId();

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key !== "Tab") return;
      const targets = panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], [tabindex='0']");
      if (!targets?.length) return;
      const first = targets[0];
      const last = targets[targets.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return (
    <div
      className="card-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="card-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="card-close"
          aria-label="close"
        >
          ×
        </button>
        {kicker && (
          <div className="card-kicker mb-2">{kicker}</div>
        )}
        <h2 id={headingId} className="mb-4 text-2xl leading-snug">{title}</h2>
        <div className="card-copy">{children}</div>
      </div>
    </div>
  );
};
