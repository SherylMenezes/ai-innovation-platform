import { useRef } from "react";
import Icon from "./InstituteIcons";
import StickerArt from "./StickerArt";
import { CHANNELS, channelList } from "./notificationsData";
import { relativeTime } from "./studentFormat";

// The pink banner every institute page opens with.
export function PageHero({ eyebrow, title, summary, description, actions, art, artClassName = "" }) {
  return (
    <header className="inst-header stu-hero">
      <div className="inst-header-main">
        <div>
          <p className="stu-hero-eyebrow">{eyebrow}</p>
          <h1 className="inst-title inst-header-name">{title}</h1>
        </div>
        <div className="inst-header-row">
          <div>
            {summary && <p className="inst-header-label">{summary}</p>}
            <p className="inst-subtitle">{description}</p>
          </div>
          {actions && <div className="inst-actions">{actions}</div>}
        </div>
      </div>
      {art && <StickerArt className={`inst-header-art stu-hero-art ${artClassName}`} src={art} baseRotate={-3} />}
    </header>
  );
}

export function Toast({ toast }) {
  return (
    <div className="stu-toast-region" role="status">
      {toast && (
        <div key={toast.id} className="stu-toast">
          <Icon name="check" size={16} /> {toast.message}
        </div>
      )}
    </div>
  );
}

// Tick boxes for in-app / email / push.
export function ChannelPicker({ value, onChange, legend = "Notify by" }) {
  return (
    <fieldset className="ins-channels">
      <legend>{legend}</legend>
      {CHANNELS.map((c) => (
        <label key={c.key} className={value[c.key] ? "is-on" : undefined}>
          <input
            type="checkbox"
            checked={Boolean(value[c.key])}
            onChange={(e) => onChange({ ...value, [c.key]: e.target.checked })}
          />
          <Icon name={c.key === "email" ? "mail" : c.key === "push" ? "bolt" : "dashboard"} size={15} />
          {c.label}
        </label>
      ))}
    </fieldset>
  );
}

const KIND_ICON = { assigned: "assignments", reminder: "calendar", deadline: "calendar", award: "awards", rank: "leaderboard" };

// What was sent, when, to whom and through which channels.
export function NotificationLog({ items, empty = "Nothing sent yet." }) {
  if (!items.length) return <p className="stu-muted">{empty}</p>;
  return (
    <ol className="ins-log">
      {items.map((n) => (
        <li key={n.id}>
          <span className="ins-log-icon" aria-hidden="true"><Icon name={KIND_ICON[n.kind] ?? "mail"} size={15} /></span>
          <span className="ins-log-text">
            <strong>{n.title}</strong>
            <small>
              {n.audience} · {n.count} {n.count === 1 ? "person" : "people"} · {channelList(n.channels).join(", ") || "No channels"}
            </small>
          </span>
          <time dateTime={new Date(n.at).toISOString()}>{relativeTime(n.at)}</time>
        </li>
      ))}
    </ol>
  );
}

// Accessible tab bar (arrow keys move between tabs). Reuses the Groups tab styling.
export function Tabs({ tabs, value, onChange, label, idPrefix }) {
  const refs = useRef({});
  const onKey = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.findIndex((t) => t.key === value);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length].key;
    onChange(next);
    refs.current[next]?.focus();
  };
  return (
    <div className="grp-tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.key}
          ref={(el) => { refs.current[t.key] = el; }}
          type="button"
          role="tab"
          id={`${idPrefix}-tab-${t.key}`}
          aria-selected={value === t.key}
          aria-controls={`${idPrefix}-panel`}
          tabIndex={value === t.key ? 0 : -1}
          className={value === t.key ? "is-on" : undefined}
          onClick={() => onChange(t.key)}
          onKeyDown={onKey}
        >
          {t.icon && <Icon name={t.icon} size={16} />}
          {t.label}
          {t.count != null && <span className="grp-tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
