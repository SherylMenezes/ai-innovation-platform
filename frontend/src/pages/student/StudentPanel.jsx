import React, { useState } from "react";
import "./StudentPanel.css";

// Import all student sub-pages/sections and shared banner
import StudentHeaderBanner from "./StudentHeaderBanner";
import StudentProjects from "./StudentProjects";
import StudentCatalog from "./StudentCatalog";
import StudentSubmissions from "./StudentSubmissions";
import StudentLeaderboard from "./StudentLeaderboard";
import StudentReports from "./StudentReports";
import StudentAwards from "./StudentAwards";
import StudentProfile from "./StudentProfile";

export default function StudentPanel() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedMetric, setSelectedMetric] = useState("completion");
  const [selectedTrackFilter, setSelectedTrackFilter] = useState("all");

  // Student-focused mock metrics to match dashboard layout
  const mockStudentStats = {
    totalXp: 1450,
    activeWorkspaces: 3,
    completionRate: 85,
    avgAiScore: 88,
  };

  const mockTracks = [
    { id: 101, name: "Smart Campus Waste Tracking", sponsor: "Sunrise School", completion: 90, xp: 412, statusTag: "Top" },
    { id: 102, name: "Personal Eco-Footprint Tracker", sponsor: "Self-Driven", completion: 100, xp: 412, statusTag: "Shortlisted" },
    { id: 103, name: "AI Attendance System", sponsor: "Sunrise School", completion: 30, xp: 120, statusTag: "Needs focus" },
    { id: 104, name: "Autonomous Supply Route", sponsor: "EcoTech", completion: 60, xp: 280, statusTag: "Active" },
  ];

  const mockFunnelStages = [
    { stage: "Started", count: 3, percentage: 100 },
    { stage: "Problem Canvas", count: 3, percentage: 100 },
    { stage: "Ideate (SCAMPER)", count: 2, percentage: 66, isBiggestDrop: true },
    { stage: "Idea Evaluation", count: 1, percentage: 33 },
    { stage: "Submit Project", count: 1, percentage: 33 },
  ];

  return (
    <div className="company-layout" style={{ '--primary-color': '#7c3aed' }}>
      {/* 1. SIDEBAR */}
      <aside className={`company-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => setActiveTab("Dashboard")}>
            <div className="sidebar-logo" style={{ background: '#7c3aed', color: '#fff' }}>SP</div>
            {!sidebarCollapsed && (
              <div className="sidebar-title">
                <h2>Student Panel</h2>
                <span>Learner Workspace</span>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
              <path d="M9 3v18"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-menu">
          <div>
            {!sidebarCollapsed && <span className="menu-group-title">Overview</span>}
            <ul className="menu-items">
              <li className={`menu-item ${activeTab === "Dashboard" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Dashboard")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  {!sidebarCollapsed && "Dashboard"}
                </button>
              </li>
            </ul>
          </div>

          <div>
            {!sidebarCollapsed && <span className="menu-group-title">Workspace</span>}
            <ul className="menu-items">
              <li className={`menu-item ${activeTab === "Projects" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Projects")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>
                  </svg>
                  {!sidebarCollapsed && "My Projects & Challenges"}
                </button>
              </li>
              <li className={`menu-item ${activeTab === "Catalog" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Catalog")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
                  </svg>
                  {!sidebarCollapsed && "Challenge Catalog"}
                </button>
              </li>
              <li className={`menu-item ${activeTab === "Submissions" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Submissions")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                  {!sidebarCollapsed && "Submissions & Feedback"}
                </button>
              </li>
            </ul>
          </div>

          <div>
            {!sidebarCollapsed && <span className="menu-group-title">Insights</span>}
            <ul className="menu-items">
              <li className={`menu-item ${activeTab === "Leaderboard" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Leaderboard")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34c3-.57 5-2.88 5-6.66H4c0 3.78 2 6.09 5 6.66Z"/>
                  </svg>
                  {!sidebarCollapsed && "Leaderboard"}
                </button>
              </li>
              <li className={`menu-item ${activeTab === "Reports" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Reports")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>
                  </svg>
                  {!sidebarCollapsed && "Reports"}
                </button>
              </li>
              <li className={`menu-item ${activeTab === "Awards" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Awards")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                  </svg>
                  {!sidebarCollapsed && "Awards"}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        <div className="sidebar-footer">
          <ul className="menu-items">
            <li className={`menu-item ${activeTab === "Settings" ? "active" : ""}`}>
              <button onClick={() => setActiveTab("Settings")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2.5 2.5 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2.5 2.5 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2.5 2.5 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2.5 2.5 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {!sidebarCollapsed && "Settings"}
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* 2. MAIN VIEW */}
      <main className="company-main">
        {activeTab === "Projects" && <StudentProjects />}
        {activeTab === "Catalog" && <StudentCatalog />}
        {activeTab === "Submissions" && <StudentSubmissions />}
        {activeTab === "Leaderboard" && <StudentLeaderboard />}
        {activeTab === "Reports" && <StudentReports />}
        {activeTab === "Awards" && <StudentAwards />}
        {activeTab === "Settings" && <StudentProfile />}

        {activeTab === "Dashboard" && (
          <>
            {/* DASHBOARD HEADER BANNER */}
            <StudentHeaderBanner 
              title="Sandra" 
              subtitle="Student Innovation Workspace • Track active challenges, XP progression, AI evaluation feedback, and milestone submissions."
              track={selectedTrackFilter}
              onTrackChange={setSelectedTrackFilter}
              onExploreCatalog={() => setActiveTab("Catalog")}
            />

            {/* 4 STAT CARDS */}
            <section className="stats-grid">
              {/* Total XP */}
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Total XP earned</span>
                  <div className="stat-tile blue">⚡</div>
                </div>
                <div className="stat-value">{mockStudentStats.totalXp} XP</div>
                <div className="stat-footnote">
                  <span className="dot-indicator green" /> +320 XP this week
                </div>
              </div>

              {/* Active Workspaces */}
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Active workspaces</span>
                  <div className="stat-tile yellow">🚀</div>
                </div>
                <div className="stat-value">{mockStudentStats.activeWorkspaces}</div>
                <div className="stat-footnote">2 school, 1 personal startup</div>
              </div>

              {/* Completion Rate */}
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Completion rate</span>
                  <div className="stat-tile green">✅</div>
                </div>
                <div className="stat-value">{mockStudentStats.completionRate}%</div>
                <div className="stat-footnote">Up 6% from last week</div>
              </div>

              {/* Avg AI Score */}
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Avg AI score</span>
                  <div className="stat-tile star">★</div>
                </div>
                <div className="stat-value">{mockStudentStats.avgAiScore}<span>/100</span></div>
                <div className="stat-footnote">Across 4 evaluated milestones</div>
              </div>
            </section>

            {/* PERFORMANCE TABLE & WORKFLOW FUNNEL */}
            <div className="dashboard-grid-2">
              {/* Active Projects Table */}
              <section className="dashboard-panel">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-heading">Active challenges & projects</h3>
                    <p className="panel-subtext">Click any row to jump into the 4-phase workspace.</p>
                  </div>
                  <div className="metric-toggles">
                    {["completion", "xp"].map((m) => (
                      <button
                        key={m}
                        className={`metric-toggle-btn ${selectedMetric === m ? "active" : ""}`}
                        onClick={() => setSelectedMetric(m)}
                      >
                        {m === "completion" ? "Completion" : "Total XP"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="summary-bar">
                  <span className="summary-title">All active tracks</span>
                  <span className="summary-pill">3 active • 85% avg completion • avg score 88</span>
                </div>

                <table className="perf-table-clean">
                  <thead>
                    <tr>
                      <th>Project Title</th>
                      <th>Sponsor</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTracks.map((trk) => (
                      <tr key={trk.id} style={{ cursor: "pointer" }} onClick={() => setActiveTab("Projects")}>
                        <td>
                          <div className="dept-name-cell">
                            {trk.name}
                            {trk.statusTag === "Top" && <span className="tag-badge top" style={{ background: '#f3e8ff', color: '#7c3aed' }}>Top</span>}
                            {trk.statusTag === "Shortlisted" && <span className="tag-badge needs-help" style={{ background: '#f0fdf4', color: '#16a34a' }}>Shortlisted</span>}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{trk.sponsor}</span>
                        </td>
                        <td>
                          <div className="dist-bar-track">
                            <div
                              className="dist-bar-fill"
                              style={{ width: `${trk.completion}%`, background: '#7c3aed' }}
                            />
                          </div>
                        </td>
                        <td style={{ fontWeight: 700, color: "var(--theme-navy)" }}>{trk.completion}%</td>
                        <td style={{ color: "var(--text-muted)", fontSize: "16px", fontWeight: 700 }}>›</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Workflow Funnel */}
              <section className="dashboard-panel">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-heading">4-phase progression funnel</h3>
                    <p className="panel-subtext">Milestone velocity across current student workspaces</p>
                  </div>
                </div>

                <div className="funnel-list">
                  {mockFunnelStages.map((step) => (
                    <div key={step.stage} className="funnel-row">
                      <span className="funnel-label">{step.stage}</span>
                      <div className="funnel-track">
                        <div
                          className={`funnel-bar ${step.isBiggestDrop ? "drop-bar" : ""}`}
                          style={{ width: `${step.percentage}%`, background: '#7c3aed' }}
                        />
                      </div>
                      <span className="funnel-count">{step.count} active</span>
                    </div>
                  ))}
                </div>

                <div className="funnel-alert-box" style={{ background: '#f3e8ff', borderColor: '#e9d5ff', color: '#6b21a8' }}>
                  💡 <strong>AI Tip:</strong> Finish your Phase 3 evaluation notes for Smart Campus Waste to unlock corporate sponsor visibility!
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}