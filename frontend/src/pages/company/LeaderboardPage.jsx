import React, { useState } from "react";
import "./CompanyPanel.css";
import { mockTopPerformers, mockDepartments } from "./mockData";

export default function LeaderboardPage() {
  const [scope, setScope] = useState("individual"); // 'individual' | 'department'

  const topScore = Math.max(...mockTopPerformers.map(u => u.avgScore));
  const topXp = Math.max(...mockTopPerformers.map(u => u.xp));

  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">INSIGHTS • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Leaderboard</h1>
          <div className="banner-metric-pill-text">Gamified standings • Top XP: {topXp} • Top AI score: {topScore}/100</div>
          <p className="subpage-banner-desc">Live standings based on completed milestones, AI rubric scores, and peer collaboration.</p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-hollow" onClick={() => setScope("individual")}>
              Individual Leaders
            </button>
            <button className="btn-banner-solid" onClick={() => setScope("department")}>
              Department Standings
            </button>
          </div>
        </div>
      </section>

      {/* 2. MINI DASHBOARD CARDS */}
      <section className="mini-dashboard-grid">
        <div className={`mini-dash-card ${scope === "individual" ? "active" : ""}`} onClick={() => setScope("individual")}>
          <div className="mini-dash-tile blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34c3-.57 5-2.88 5-6.66H4c0 3.78 2 6.09 5 6.66Z"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Leader</span>
            <div className="mini-dash-value">{mockTopPerformers[0].name.split(" ")[0]}</div>
            <span className="mini-dash-subtext">Rank #1 overall</span>
          </div>
        </div>

        <div className="mini-dash-card">
          <div className="mini-dash-tile yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Top score</span>
            <div className="mini-dash-value">{topScore}/100</div>
            <span className="mini-dash-subtext">Rubric evaluation</span>
          </div>
        </div>

        <div className="mini-dash-card">
          <div className="mini-dash-tile green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Top streak</span>
            <div className="mini-dash-value">8 Days</div>
            <span className="mini-dash-subtext">Consecutive active</span>
          </div>
        </div>

        <div className={`mini-dash-card ${scope === "department" ? "active" : ""}`} onClick={() => setScope("department")}>
          <div className="mini-dash-tile gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Top dept</span>
            <div className="mini-dash-value">R&D</div>
            <span className="mini-dash-subtext">82% completion</span>
          </div>
        </div>
      </section>

      {/* 3. TABLE CARD */}
      <div className="data-card">
        <div className="table-filter-header">
          <div className="summary-title" style={{ fontSize: "15px" }}>
            {scope === "individual" ? "Individual Rank Standings" : "Department Standings"}
          </div>
          <div className="metric-toggles">
            <button className={`metric-toggle-btn ${scope === "individual" ? "active" : ""}`} onClick={() => setScope("individual")}>
              Individual
            </button>
            <button className={`metric-toggle-btn ${scope === "department" ? "active" : ""}`} onClick={() => setScope("department")}>
              Department
            </button>
          </div>
        </div>

        {scope === "individual" ? (
          <table className="perf-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}>Rank</th>
                <th>Innovator</th>
                <th>Squad / Team</th>
                <th>Streak</th>
                <th>Avg AI Score</th>
                <th>Badges</th>
                <th>Total XP</th>
              </tr>
            </thead>
            <tbody>
              {mockTopPerformers.map((user, idx) => (
                <tr key={user.id}>
                  <td>
                    <div className={`top-rank-badge ${idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : idx === 2 ? "rank-3" : "rank-other"}`}>
                      {idx + 1}
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{user.name}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{user.team}</td>
                  <td style={{ fontWeight: 700 }}>🔥 {idx + 4} Days</td>
                  <td>
                    <span className="code-pill" style={{ background: "#EFF6FF", color: "#1D58D8" }}>{user.avgScore}/100</span>
                  </td>
                  <td>
                    <span className="code-pill">🏅 {8 - idx} Badges</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: "var(--theme-blue-primary)", fontSize: "14px" }}>{user.xp} XP</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="perf-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}>Rank</th>
                <th>Department</th>
                <th>Seniority Tier</th>
                <th>Completion Rate</th>
                <th>Avg AI Score</th>
                <th>Avg XP / Member</th>
              </tr>
            </thead>
            <tbody>
              {mockDepartments.map((dept, idx) => (
                <tr key={dept.id}>
                  <td>
                    <div className={`top-rank-badge ${idx === 0 ? "rank-1" : idx === 1 ? "rank-2" : idx === 2 ? "rank-3" : "rank-other"}`}>
                      {idx + 1}
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{dept.name}</td>
                  <td>{dept.academic_tier}</td>
                  <td>
                    <span style={{ fontWeight: 700 }}>{dept.completion}%</span>
                  </td>
                  <td>
                    <span className="code-pill" style={{ background: "#EFF6FF", color: "#1D58D8" }}>{dept.avgAiScore}/100</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: "var(--theme-blue-primary)" }}>{dept.avgXp} XP</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}