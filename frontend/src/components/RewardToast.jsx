import "./RewardToast.css";

// App-wide stack of reward notifications (+XP, Level cleared, badge
// unlocked, rank up). App.jsx owns the list and auto-dismisses entries.
function RewardToast({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div className="reward-toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={`reward-toast reward-toast-${toast.tone}`}
          onClick={() => onDismiss(toast.id)}
        >
          <strong>{toast.title}</strong>
          {toast.detail && <span>{toast.detail}</span>}
        </button>
      ))}
    </div>
  );
}

export default RewardToast;
