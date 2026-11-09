import React, { useState } from "react";
import "./StudentPanel.css";

export default function StudentProjects() {
  const [projects, setProjects] = useState([
    {
      id: 1,
      challengeTitle: "Smart Campus Waste Tracking System",
      sponsor: "Sunrise Public School",
      target_type: "Institution",
      target_name: "Grade 10 - Science Cohort",
      due_at: "2026-11-20",
      status: "active",
      stage: "Phase 3: Idea Evaluation",
      completed_phases: 3,
      total_phases: 4,
      xpEarned: 450,
      aiScore: 88,
      note: "Assigned school challenge focusing on automated sorting."
    },
    {
      id: 2,
      challengeTitle: "Autonomous Supply Chain Route Optimizer",
      sponsor: "EcoTech Solutions",
      target_type: "Company Track",
      target_name: "Open Innovation Pool",
      due_at: "2026-11-25",
      status: "active",
      stage: "Phase 1: Problem Canvas",
      completed_phases: 1,
      total_phases: 4,
      xpEarned: 150,
      aiScore: 72,
      note: "Sponsored corporate track for high-performing students."
    },
    {
      id: 3,
      challengeTitle: "Personal Eco-Footprint Tracker",
      sponsor: "Self-Driven",
      target_type: "Personal",
      target_name: "Startup Incubator",
      due_at: "2026-12-01",
      status: "shortlisted",
      stage: "Phase 4: Submit Project",
      completed_phases: 4,
      total_phases: 4,
      xpEarned: 600,
      aiScore: 94,
      note: "Self-driven startup incubation project."
    }
  ]);

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const countAll = projects.length;
  const countActive = projects.filter(p => p.status === "active").length;
  const countDueSoon = 1;
  const countShortlisted = projects.filter(p => p.status === "shortlisted").length;

  const filtered = projects.filter(p => {
    const matchSearch = p.challengeTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        p.sponsor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.stage.toLowerCase().includes(searchTerm.toLowerCase());
    let matchStatus = true;
    if (filterStatus === "active") matchStatus = p.status === "active";
    if (filterStatus === "shortlisted") matchStatus = p.status === "shortlisted";
    return matchSearch && matchStatus;
  });

  return (
    <>
      {/* 1. HERO BANNER */}
      <section className="header-banner" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" }}>
        <div className="banner-left">
          <div className="banner-subtitle" style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, marginBottom: '4px' }}>WORKSPACE • ACTIVE PROJECTS & CHALLENGES</div>
          <h1 className="banner-title">My Projects</h1>
          <div className="banner-subtitle">{countActive} active workspaces • 1 due this week</div>
          <p className="banner-desc">Track your institutional assignments, corporate challenges, and self-driven startup ideas across all four progression phases.</p>
        </div>
      </section>

      {/* 2. STAT CARDS */}
      <section className="stats-grid">
        <div className={`stat-card ${filterStatus === "all" ? "active" : ""}`} onClick={() => setFilterStatus("all")} style={{ cursor: "pointer" }}>
          <div className="stat-card-top">
            <span className="stat-label">Total Projects</span>
            <div className="stat-tile blue">🚀</div>
          </div>
          <div className="stat-value">{countAll}</div>
          <div className="stat-footnote">All tracks</div>
        </div>

        <div className={`stat-card ${filterStatus === "active" ? "active" : ""}`} onClick={() => setFilterStatus("active")} style={{ cursor: "pointer" }}>
          <div className="stat-card-top">
            <span className="stat-label">Active</span>
            <div className="stat-tile yellow">⚡</div>
          </div>
          <div className="stat-value">{countActive}</div>
          <div className="stat-footnote">In progress sprints</div>
        </div>

        <div className={`stat-card ${filterStatus === "due" ? "active" : ""}`} onClick={() => setFilterStatus("due")} style={{ cursor: "pointer" }}>
          <div className="stat-card-top">
            <span className="stat-label">Due Soon</span>
            <div className="stat-tile green">⏳</div>
          </div>
          <div className="stat-value">{countDueSoon}</div>
          <div className="stat-footnote">Due in &lt; 48 hours</div>
        </div>

        <div className={`stat-card ${filterStatus === "shortlisted" ? "active" : ""}`} onClick={() => setFilterStatus("shortlisted")} style={{ cursor: "pointer" }}>
          <div className="stat-card-top">
            <span className="stat-label">Shortlisted</span>
            <div className="stat-tile star">★</div>
          </div>
          <div className="stat-value">{countShortlisted}</div>
          <div className="stat-footnote">Top AI reviews</div>
        </div>
      </section>

      {/* 3. TABLE PANEL CARD (Matches dashboard card enclosure) */}
      <section className="dashboard-panel" style={{ marginTop: '24px' }}>
        <div className="panel-header-row" style={{ marginBottom: '16px' }}>
          <div className="search-input-wrapper" style={{ flex: 1, maxWidth: '400px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              className="search-input-clean"
              placeholder="Search projects by title or sponsor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="count-badge" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            {filtered.length} projects found
          </span>
        </div>

        <table className="perf-table-clean">
          <thead>
            <tr>
              <th>Challenge Sprint</th>
              <th>Sponsor / Track</th>
              <th>Current Stage</th>
              <th>Milestone Progress</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const pct = Math.round((p.completed_phases / p.total_phases) * 100);
              return (
                <tr key={p.id}>
                  <td>
                    <div className="dept-name-cell" style={{ fontWeight: 800, color: "var(--theme-navy)" }}>
                      {p.challengeTitle}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-secondary)" }}>
                      XP: {p.xpEarned} • AI Score: {p.aiScore}/100
                    </div>
                  </td>
                  <td>
                    <span className="tag-badge" style={{ background: "#f3e8ff", color: "#7c3aed" }}>
                      {p.sponsor}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "13px" }}>{p.stage}</td>
                  <td>
                    <div className="dist-bar-track" style={{ width: "120px" }}>
                      <div
                        className="dist-bar-fill"
                        style={{ width: `${pct}%`, background: "#7c3aed" }}
                      />
                    </div>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--theme-navy)" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: p.status === "shortlisted" ? "#16a34a" : "#2563eb",
                        background: p.status === "shortlisted" ? "#f0fdf4" : "#eff6ff",
                        padding: "4px 10px",
                        borderRadius: "10px",
                      }}
                    >
                      ● {p.status}
                    </span>
                  </td>
                  <td>
                    <button
                      style={{
                        padding: "6px 14px",
                        fontSize: "12px",
                        background: "#7c3aed",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Open Workspace →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}