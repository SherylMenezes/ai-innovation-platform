import { useEffect, useRef, useState } from "react";
import InstituteDashboard from "./InstituteDashboard";
import Icon from "./InstituteIcons";
import InviteDialog from "./InviteDialog";
import StudentsPage from "./StudentsPage";
import GroupsPage from "./GroupsPage";
import "./InstitutePanel.css";

const NAV_GROUPS = [
  { label: "Overview", items: [{ key: "dashboard", label: "Dashboard" }] },
  {
    label: "Manage",
    items: [
      { key: "students", label: "Students" },
      { key: "groups", label: "Groups" },
      { key: "assignments", label: "Assignments" },
      { key: "challenges", label: "Challenges" },
    ],
  },
  {
    label: "Insights",
    items: [
      { key: "leaderboard", label: "Leaderboard" },
      { key: "reports", label: "Reports" },
      { key: "awards", label: "Awards" },
    ],
  },
];

const SETTINGS = { key: "settings", label: "Settings" };
const SECTIONS = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS];

// Matches the mobile breakpoint in InstitutePanel.css.
const MOBILE_QUERY = "(max-width: 860px)";
const SECTION_KEY = "institute.section";
const COLLAPSED_KEY = "institute.sidebarCollapsed";

// Storage can throw in private windows or when site data is blocked.
function readStored(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not critical: the panel just won't remember this next time.
  }
}

function ComingSoon({ label, onBack }) {
  return (
    <div className="inst-card inst-coming">
      <h1 className="inst-title">{label}</h1>
      <p className="inst-subtitle">This page is being built. Head back to the dashboard for now.</p>
      <button type="button" className="inst-btn inst-btn--outline" onClick={onBack}>
        Back to dashboard
      </button>
    </div>
  );
}

export default function InstitutePanel() {
  const [section, setSection] = useState(() => {
    const saved = readStored(SECTION_KEY);
    return SECTIONS.some((s) => s.key === saved) ? saved : "dashboard";
  });
  const [collapsed, setCollapsed] = useState(() => readStored(COLLAPSED_KEY) === "true");
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [invite, setInvite] = useState({ code: "", groups: [] });
  const dialogRef = useRef(null);
  const panelRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => writeStored(SECTION_KEY, section), [section]);
  useEffect(() => writeStored(COLLAPSED_KEY, String(collapsed)), [collapsed]);

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const onChange = (e) => {
      setIsMobile(e.matches);
      setMobileOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  // On mobile, a tap outside the open sidebar or Escape closes it.
  useEffect(() => {
    if (!mobileOpen) return;
    const onPointerDown = (e) => {
      if (!sidebarRef.current?.contains(e.target)) setMobileOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  // Inside the app, keep the full-height sidebar below the app's sticky top bar.
  useEffect(() => {
    const bar = document.querySelector(".app-page-tabs");
    if (!bar) return;
    const update = () => panelRef.current?.style.setProperty("--inst-top", `${bar.offsetHeight}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  const isRail = isMobile ? !mobileOpen : collapsed;

  const toggleSidebar = () => {
    if (isMobile) setMobileOpen((open) => !open);
    else setCollapsed((c) => !c);
  };

  const goTo = (key) => {
    setSection(key);
    setMobileOpen(false);
  };

  const showInvite = (code, groups) => {
    setInvite({ code: code ?? "", groups: groups ?? [] });
    dialogRef.current?.showModal();
  };

  const current = SECTIONS.find((s) => s.key === section);

  const navItem = (s) => (
    <button
      key={s.key}
      type="button"
      className={`inst-nav-item${s.key === section ? " is-active" : ""}`}
      aria-current={s.key === section ? "page" : undefined}
      title={isRail ? s.label : undefined}
      onClick={() => goTo(s.key)}
    >
      <Icon name={s.key} size={18} />
      {s.label}
    </button>
  );

  const panelClass = [
    "inst-panel",
    isRail && "is-rail",
    isMobile && mobileOpen && "is-mobile-open",
  ].filter(Boolean).join(" ");

  return (
    <div ref={panelRef} className={panelClass}>
      <nav ref={sidebarRef} className="inst-sidebar" aria-label="Institute panel">
        <div
          className="inst-sidebar-brand"
          role="button"
          tabIndex={0}
          aria-expanded={!isRail}
          title={isRail ? "Open sidebar" : "Close sidebar"}
          onClick={toggleSidebar}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleSidebar();
            }
          }}
        >
          <span className="inst-sidebar-logo" aria-hidden="true">IP</span>
          <div>
            <span className="inst-sidebar-title">Institute Panel</span>
            <span className="inst-sidebar-sub">Admin workspace</span>
          </div>
        </div>

        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="inst-nav-group">
            <span className="inst-nav-heading">{group.label}</span>
            {group.items.map(navItem)}
          </div>
        ))}

        <div className="inst-nav-footer">{navItem(SETTINGS)}</div>
      </nav>

      <main className="inst-main">
        {section === "dashboard" ? (
          <InstituteDashboard onNavigate={goTo} onShowInvite={showInvite} />
        ) : section === "students" ? (
          <StudentsPage />
        ) : section === "groups" ? (
          <GroupsPage />
        ) : (
          <ComingSoon label={current.label} onBack={() => goTo("dashboard")} />
        )}
      </main>

      <InviteDialog ref={dialogRef} baseCode={invite.code} groupOptions={invite.groups} />
    </div>
  );
}
