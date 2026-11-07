import React, { useState } from "react";
import "./CompanyPanel.css";
import EmployeesPage from "./EmployeesPage";
import TeamsGroupsPage from "./TeamsGroupsPage";
import AssignmentsPage from "./AssignmentsPage";
import ChallengesPage from "./ChallengesPage";
import LeaderboardPage from "./LeaderboardPage";
import ReportsAiPage from "./ReportsAiPage";
import AwardsPage from "./AwardsPage";
import SettingsPage from "./SettingsPage";

import StickerArt from "./StickerArt";
import explorerArt from "../../assets/institute-explorer.webp";

import {
  mockCompany,
  mockStats,
  mockDepartments,
  mockFunnelStages
} from "./mockData";

export default function CompanyPanel() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [selectedMetric, setSelectedMetric] = useState("completion");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");

  return (
    <div className="company-layout">
      {/* 1. SIDEBAR */}
      <aside className={`company-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand" onClick={() => setActiveTab("Dashboard")}>
            <div className="sidebar-logo">CP</div>
            {!sidebarCollapsed && (
              <div className="sidebar-title">
                <h2>Company Panel</h2>
                <span>Admin workspace</span>
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
              <li className={`menu-item ${activeTab === "Employees" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Employees")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {!sidebarCollapsed && "Employees"}
                </button>
              </li>
              <li className={`menu-item ${activeTab === "Teams & Groups" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Teams & Groups")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
                  </svg>
                  {!sidebarCollapsed && "Teams & Groups"}
                </button>
              </li>
              <li className={`menu-item ${activeTab === "Assignments" ? "active" : ""}`}>
                <button onClick={() => setActiveTab("Assignments")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/>
                  </svg>
                  {!sidebarCollapsed && "Assignments"}
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
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {!sidebarCollapsed && "Settings"}
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* 2. MAIN VIEW */}
      <main className="company-main">
        {activeTab === "Employees" && <EmployeesPage />}
        {activeTab === "Teams & Groups" && <TeamsGroupsPage />}
        {activeTab === "Assignments" && <AssignmentsPage />}
        {activeTab === "Challenges" && <ChallengesPage />}
        {activeTab === "Leaderboard" && <LeaderboardPage />}
        {activeTab === "Reports" && <ReportsAiPage />}
        {activeTab === "Awards" && <AwardsPage />}
        {activeTab === "Settings" && <SettingsPage />}

        {activeTab === "Dashboard" && (
          <>
            {/* HEADER BANNER */}
            <section className="header-banner">
              <div className="banner-left">
                <h1 className="banner-title">{mockCompany.name}</h1>
                <div className="banner-subtitle">Company Panel</div>
                <p className="banner-desc">How your innovation teams are performing across active challenges.</p>

                <div className="banner-controls">
                  <span className="banner-filter-label">Dept</span>
                  <select
                    className="banner-dropdown"
                    value={selectedDeptFilter}
                    onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  >
                    <option value="all">All departments</option>
                    <option value="eng">Engineering & R&D</option>
                    <option value="pdx">Product Design & UX</option>
                    <option value="mkt">Growth & Marketing</option>
                    <option value="ops">Customer Operations</option>
                  </select>

                  <button className="btn-banner-action" onClick={() => navigator.clipboard.writeText(mockCompany.invite_code)}>
                    Invite code
                  </button>
                  <button className="btn-banner-action" onClick={() => setActiveTab("Teams & Groups")}>
                    + Add dept
                  </button>
                  <button className="btn-banner-action" onClick={() => setActiveTab("Assignments")}>
                    + Assign challenge
                  </button>
                </div>
              </div>
              <StickerArt className="inst-header-art" src={explorerArt} />
            </section>

            {/* 4 STAT CARDS */}
            <section className="stats-grid">
              {/* Total Members */}
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Total employees</span>
                  <div className="stat-tile blue">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                </div>
                <div className="stat-value">{mockStats.totalEmployees}</div>
                <div className="stat-footnote">
                  <span className="dot-indicator green" /> 38 active right now
                </div>
              </div>

              {/* Active Assignments */}
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Active assignments</span>
                  <div className="stat-tile yellow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                    </svg>
                  </div>
                </div>
                <div className="stat-value">{mockStats.activeAssignments}</div>
                <div className="stat-footnote">3 due this week</div>
              </div>

              {/* Completion Rate */}
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Completion</span>
                  <div className="stat-tile green">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
                    </svg>
                  </div>
                </div>
                <div className="stat-value">{Math.round(mockStats.completionRate)}%</div>
                <div className="stat-footnote">Up 4% from last week</div>
              </div>

              {/* Avg AI Score (Star Icon matching Institute Panel) */}
              <div className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-label">Avg AI score</span>
                  <div className="stat-tile star">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                </div>
                <div className="stat-value">{Math.round(mockStats.avgAiScore)}<span>/100</span></div>
                <div className="stat-footnote">Across all submissions</div>
              </div>
            </section>

            {/* 5. PERFORMANCE BY DEPARTMENT & WORKFLOW FUNNEL */}
            <div className="dashboard-grid-2">
              {/* Department Table */}
              <section className="dashboard-panel">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-heading">Performance by department</h3>
                    <p className="panel-subtext">Select a department to view team breakdown.</p>
                  </div>
                  <div className="metric-toggles">
                    {["completion", "avgAiScore", "avgXp"].map((m) => (
                      <button
                        key={m}
                        className={`metric-toggle-btn ${selectedMetric === m ? "active" : ""}`}
                        onClick={() => setSelectedMetric(m)}
                      >
                        {m === "completion" ? "Completion" : m === "avgAiScore" ? "Avg AI score" : "Avg XP"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="summary-bar">
                  <span className="summary-title">All departments</span>
                  <span className="summary-pill">268 employees • 67% completion • avg score 74 • avg 1,220 XP</span>
                </div>

                <table className="perf-table-clean">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Distribution</th>
                      <th>Done</th>
                      <th>Members</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockDepartments.map((dept) => {
                      const val = dept[selectedMetric];
                      const displayVal = selectedMetric === "completion" ? `${val}%` : val;
                      return (
                        <tr key={dept.id} style={{ cursor: "pointer" }} onClick={() => setActiveTab("Teams & Groups")}>
                          <td>
                            <div className="dept-name-cell">
                              {dept.name}
                              {dept.statusTag === "Needs help" && <span className="tag-badge needs-help">Needs help</span>}
                              {dept.statusTag === "Top" && <span className="tag-badge top">Top</span>}
                            </div>
                          </td>
                          <td>
                            <div className="dist-bar-track">
                              <div
                                className={`dist-bar-fill ${dept.statusTag === "Needs help" ? "amber" : ""}`}
                                style={{ width: `${Math.min(dept.completion, 100)}%` }}
                              />
                            </div>
                          </td>
                          <td style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{displayVal}</td>
                          <td style={{ color: "var(--text-secondary)" }}>
                            {dept.id === 101 ? 74 : dept.id === 102 ? 62 : dept.id === 103 ? 48 : 84}
                          </td>
                          <td style={{ color: "var(--text-muted)", fontSize: "16px", fontWeight: 700 }}>›</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>

              {/* Workflow Funnel */}
              <section className="dashboard-panel">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-heading">Workflow funnel</h3>
                    <p className="panel-subtext">Enterprise AI Challenge • All departments • 268 members</p>
                  </div>
                </div>

                <div className="funnel-list">
                  {mockFunnelStages.map((step) => (
                    <div key={step.stage} className="funnel-row">
                      <span className="funnel-label">{step.stage}</span>
                      <div className="funnel-track">
                        <div
                          className={`funnel-bar ${step.isBiggestDrop ? "drop-bar" : ""}`}
                          style={{ width: `${step.percentage}%` }}
                        />
                      </div>
                      <span className="funnel-count">{step.count}</span>
                    </div>
                  ))}
                </div>

                <div className="funnel-alert-box">
                  <strong>Bottleneck identified:</strong> SCAMPER ideation stage has a 21.6% drop-off. 26 members need mentor feedback.
                </div>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}