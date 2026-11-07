import React from "react";
import "./CompanyPanel.css";
import { mockAiLogsData } from "./mockData";

export default function ReportsAiPage() {
  const countSuccess = mockAiLogsData.filter(l => l.succeeded).length;
  const pctSuccess = Math.round((countSuccess / mockAiLogsData.length) * 100);

  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">INSIGHTS • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Reports & AI Logs</h1>
          <div className="banner-metric-pill-text">14,820 API calls • 99.4% Gemini accuracy rate</div>
          <p className="subpage-banner-desc">Audit real-time AI invocation telemetry: SCAMPER, 5 Whys, and automated rubric scorecards.</p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-hollow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              Export CSV
            </button>
            <button className="btn-banner-solid">
              Audit Token Usage
            </button>
          </div>
        </div>
      </section>

      {/* 2. MINI DASHBOARD CARDS */}
      <section className="mini-dashboard-grid">
        <div className="mini-dash-card active">
          <div className="mini-dash-tile blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Total Prompts</span>
            <div className="mini-dash-value">14,820</div>
            <span className="mini-dash-subtext">Across cohort</span>
          </div>
        </div>

        <div className="mini-dash-card">
          <div className="mini-dash-tile green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Success Rate</span>
            <div className="mini-dash-value">{pctSuccess}%</div>
            <span className="mini-dash-subtext">HTTP 200 responses</span>
          </div>
        </div>

        <div className="mini-dash-card">
          <div className="mini-dash-tile yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Top Framework</span>
            <div className="mini-dash-value">SCAMPER</div>
            <span className="mini-dash-subtext">Ideation stage</span>
          </div>
        </div>

        <div className="mini-dash-card">
          <div className="mini-dash-tile gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Default Model</span>
            <div className="mini-dash-value">Gemini</div>
            <span className="mini-dash-subtext">2.5 Flash Lite</span>
          </div>
        </div>
      </section>

      {/* 3. TABLE CARD */}
      <div className="data-card">
        <div className="table-filter-header">
          <div className="summary-title" style={{ fontSize: "15px" }}>Recent Invocations (ai_usage_logs)</div>
          <span className="count-badge">{mockAiLogsData.length} records</span>
        </div>

        <table className="perf-table">
          <thead>
            <tr>
              <th>Log ID</th>
              <th>Employee User</th>
              <th>AI Feature Framework</th>
              <th>Model</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {mockAiLogsData.map((log) => (
              <tr key={log.id}>
                <td><code className="code-pill">#{log.id}</code></td>
                <td style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{log.userName}</td>
                <td>
                  <span className="code-pill" style={{ textTransform: "uppercase" }}>{log.feature}</span>
                </td>
                <td style={{ color: "var(--text-secondary)" }}>{log.model}</td>
                <td>
                  <span className={`status-pill ${log.succeeded ? "active" : "inactive"}`}>
                    ● {log.succeeded ? "Success (200)" : "Failed"}
                  </span>
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{log.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}