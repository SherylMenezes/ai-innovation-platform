import React, { useState } from "react";
import "./CompanyPanel.css";

import StickerArt from "./StickerArt";
import explorerArt from "../../assets/institute-explorer.webp";

// Sub-pages matching BRD & Backlog
import SubmissionsReviewPage from "./SubmissionsReviewPage";
import ChallengesPage from "./ChallengesPage";
import TalentDiscoveryPage from "./TalentDiscoveryPage";
import TeamsGroupsPage from "./TeamsGroupsPage";
import LeaderboardPage from "./LeaderboardPage";
import AnalyticsReportsPage from "./AnalyticsReportsPage";
import AwardsPage from "./AwardsPage";
import SettingsPage from "./SettingsPage";

import {
  mockCompany,
  mockDashboardMetrics,
  mockCompanyChallenges,
  mockFunnelData,
  mockInstitutionParticipation
} from "./mockData";

export default function CompanyPanel() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");

  return (
    <div className="company-layout">
      {/* SIDEBAR */}
      <aside className={`company-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => setActiveTab("Dashboard")}>
            <div className="sidebar-logo">CP</div>
            {!sidebarCollapsed && (
              <div className="sidebar-title">
                <h2>Company Panel</h2>
                <span>Enterprise workspace</span>
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
            {!sidebarCollapsed && <span className="menu-group-title">Manage</span>}
            <ul className="menu-items">
              <li className={`menu-item ${activeTab === "Submissions" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Submissions")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>
                  </svg>
                  {!sidebarCollapsed && "Submissions & AI"}
                </button>
              </li>
              <li className={`menu-item ${activeTab === "Challenges" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Challenges")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>
                  </svg>
                  {!sidebarCollapsed && "Challenges"}
                </button>
              </li>
              <li className={`menu-item ${activeTab === "Talent" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Talent")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {!sidebarCollapsed && "Talent Discovery"}
                </button>
              </li>
              <li className={`menu-item ${activeTab === "Teams" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Teams")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                  </svg>
                  {!sidebarCollapsed && "Squads & Mentors"}
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
              <li className={`menu-item ${activeTab === "Analytics" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Analytics")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>
                  </svg>
                  {!sidebarCollapsed && "Analytics"}
                </button>
              </li>
              <li className={`menu-item ${activeTab === "Awards" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Awards")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
                  </svg>
                  {!sidebarCollapsed && "Awards & Grants"}
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
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {!sidebarCollapsed && "Settings"}
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="company-main">
        {activeTab === "Submissions" && <SubmissionsReviewPage />}
        {activeTab === "Challenges" && <ChallengesPage />}
        {activeTab === "Talent" && <TalentDiscoveryPage />}
        {activeTab === "Teams" && <TeamsGroupsPage />}
        {activeTab === "Leaderboard" && <LeaderboardPage />}
        {activeTab === "Analytics" && <AnalyticsReportsPage />}
        {activeTab === "Awards" && <AwardsPage />}
        {activeTab === "Settings" && <SettingsPage />}

        {activeTab === "Dashboard" && (
          <>
            {/* 1. HEADER BANNER */}
            <section className="header-banner">
              <div className="banner-left">
                <h1 className="banner-title">{mockCompany.name}</h1>
                <div className="banner-subtitle">Enterprise Innovation Panel</div>
                <p className="banner-desc">Crowdsourcing challenges, reviewing AI solutions, and scouting engineering talent.</p>

                <div className="banner-controls">
                  <span className="banner-filter-label">Challenge</span>
                  <select className="banner-dropdown">
                    <option value="all">All active challenges (4)</option>
                    <option value="101">Autonomous Agents in Cold-Chain</option>
                    <option value="102">Zero-Shot Support Triage</option>
                  </select>

                  <button className="btn-banner-action" onClick={() => setActiveTab("Challenges")}>
                    + Post Challenge
                  </button>
                  <button className="btn-banner-action" onClick={() => setActiveTab("Submissions")}>
                    View Submissions ({mockDashboardMetrics.totalSubmissions})
                  </button>
                </div>
              </div>
              <StickerArt className="inst-header-art stu-hero-art grp-hero-art" src={explorerArt} baseRotate={-4} />
            </section>

            {/* 2. STAT CARDS */}
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Active challenges</span>
                  <div className="stat-tile blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>
                    </svg>
                  </div>
                </div>
                <div className="stat-value">{mockDashboardMetrics.activeChallenges}</div>
                <div className="stat-footnote">
                  <span className="dot-indicator green" /> Across {mockDashboardMetrics.partnerInstitutions} institutions
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Total submissions</span>
                  <div className="stat-tile yellow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                </div>
                <div className="stat-value">{mockDashboardMetrics.totalSubmissions}</div>
                <div className="stat-footnote">42 shortlisted for review</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Active participants</span>
                  <div className="stat-tile green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    </svg>
                  </div>
                </div>
                <div className="stat-value">{mockDashboardMetrics.activeParticipants}</div>
                <div className="stat-footnote">Student & Graduate innovators</div>
              </div>

              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Avg AI Quality</span>
                  <div className="stat-tile star">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                </div>
                <div className="stat-value">{mockDashboardMetrics.avgAiQualityScore}<span>/100</span></div>
                <div className="stat-footnote">Gemini Rubric evaluation</div>
              </div>
            </section>

            {/* 3. PERFORMANCE BREAKDOWN & FUNNEL */}
            <div className="dashboard-grid-2">
              <section className="dashboard-panel">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-heading">Active Enterprise Challenges</h3>
                    <p className="panel-subtext">Click on any challenge to inspect incoming submissions.</p>
                  </div>
                </div>

                <table className="perf-table-clean">
                  <thead>
                    <tr>
                      <th>Challenge Brief</th>
                      <th>Submissions</th>
                      <th>Avg Score</th>
                      <th>Time Left</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCompanyChallenges.map((c) => (
                      <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setActiveTab("Submissions")}>
                        <td>
                          <div style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{c.title}</div>
                          <span className="code-pill">{c.category}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: "var(--theme-navy)" }}>{c.submissions_count}</td>
                        <td>
                          <span className="code-pill" style={{ background: "#EFF6FF", color: "#1D58D8" }}>{c.avg_score}/100</span>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                          {c.days_left > 0 ? `${c.days_left} days left` : "Closed"}
                        </td>
                        <td style={{ color: "var(--text-muted)", fontSize: "16px", fontWeight: 700 }}>›</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="dashboard-panel">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-heading">Solution Lifecycle Funnel</h3>
                    <p className="panel-subtext">Aggregated participant progress across all active company briefs.</p>
                  </div>
                </div>

                <div className="funnel-list">
                  {mockFunnelData.map((f, i) => (
                    <div key={i} className="funnel-row">
                      <span className="funnel-label">{f.stage}</span>
                      <div className="funnel-track">
                        <div className={`funnel-bar ${f.isBottleneck ? "drop-bar" : ""}`} style={{ width: `${f.pct}%` }} />
                      </div>
                      <span className="funnel-count">{f.count}</span>
                    </div>
                  ))}
                </div>

                <div className="funnel-alert-box">
                  <strong>Conversion Insight:</strong> 17.7% drop at SCAMPER ideation. Consider offering an interim mentor office hour.
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}