import { useEffect, useRef } from "react";
import { PUBLIC_ROLES } from "../pages/auth/roles";
import "./RoleSelectModal.css";

/**
 * Asks "who are you?" before login or sign-up.
 *
 * Props:
 *   open          boolean
 *   mode          "login" | "signup"
 *   onModeChange  (mode) => void
 *   onSelect      (roleKey, mode) => void   roleKey: student | institution | company | admin
 *   onClose       () => void
 */
export default function RoleSelectModal({ open, mode, onModeChange, onSelect, onClose }) {
  const dialogRef = useRef(null);
  const firstCardRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    firstCardRef.current?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll("button");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const isLogin = mode === "login";

  return (
    <div className="role-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={dialogRef}
        className="role-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="role-modal-title"
      >
        <button type="button" className="role-modal-close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="role-modal-tabs" role="tablist" aria-label="Log in or sign up">
          <button type="button" role="tab" aria-selected={isLogin}
            className={isLogin ? "is-active" : ""} onClick={() => onModeChange("login")}>
            Log in
          </button>
          <button type="button" role="tab" aria-selected={!isLogin}
            className={!isLogin ? "is-active" : ""} onClick={() => onModeChange("signup")}>
            Sign up
          </button>
        </div>

        <h2 id="role-modal-title" className="role-modal-title">
          {isLogin ? "Log in as" : "Join as"}
        </h2>
        <p className="role-modal-sub">
          {isLogin
            ? "Choose your account type to continue to the right sign-in."
            : "Pick the account that fits you. Institution and company accounts are reviewed before they go live."}
        </p>

        <div className="role-modal-grid">
          {PUBLIC_ROLES.map((role, i) => (
            <button
              key={role.key}
              ref={i === 0 ? firstCardRef : undefined}
              type="button"
              className={`role-card role-card--${role.key}`}
              onClick={() => onSelect(role.key, mode)}
            >
              <span className="role-card-icon">{role.icon}</span>
              <span className="role-card-text">
                <span className="role-card-label">{role.label}</span>
                <span className="role-card-tagline">{role.tagline}</span>
              </span>
              <svg className="role-card-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          ))}
        </div>

        {isLogin && (
          <p className="role-modal-admin">
            Platform admin?{" "}
            <button type="button" className="role-modal-link" onClick={() => onSelect("admin", "login")}>
              Sign in here
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
