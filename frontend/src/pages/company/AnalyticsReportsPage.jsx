import React from "react";
import "./CompanyPanel.css";
import { mockInstitutionParticipation, mockFunnelData } from "./mockData";

export default function AnalyticsReportsPage() {
  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">ANALYTICS • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Innovation Analytics & Benchmarking</h1>
          <div className="banner-metric-pill-text">14 partner institutions • 312 solutions evaluated</div>
          <p className="subpage-banner-desc">
            Benchmark college participation, track stage conversion funnels, and quantify crowdsourced R&D ROI.
          </p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-hollow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              Download PDF Report
            </button>
          </div>
        </div>
      </section>

      {/* 2. TWO-COLUMN ANALYTICS */}
      <div className="dashboard-grid-2">
        {/* Institution Benchmarking Table */}
        <section className="dashboard-panel">
          <div className="panel-header-row">
            <div>
              <h3 className="panel-heading">Institution Participation & Ranking</h3>
              <p className="panel-subtext">Benchmarked by total submissions and average AI score.</p>
            </div>
          </div>

          <table className="perf-table-clean">
            <thead>
              <tr>
                <th>Institution</th>
                <th>Participants</th>
                <th>Submissions</th>
                <th>Avg AI Score</th>
              </tr>
            </thead>
            <tbody>
              {mockInstitutionParticipation.map((inst, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: "var(--theme-navy)" }}>{inst.name}</td>
                  <td>{inst.participants}</td>
                  <td style={{ fontWeight: 700 }}>{inst.submissions}</td>
                  <td>
                    <span className="code-pill" style={{ background: "#EFF6FF", color: "#1D58D8" }}>
                      {inst.avgScore}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Workflow Conversion Funnel */}
        <section className="dashboard-panel">
          <div className="panel-header-row">
            <div>
              <h3 className="panel-heading">Challenge Lifecycle Funnel</h3>
              <p className="panel-subtext">Attrition from accepting challenge to final submission.</p>
            </div>
          </div>

          <div className="funnel-list">
            {mockFunnelData.map((f, i) => (
              <div key={i} className="funnel-row">
                <span className="funnel-label" style={{ width: "160px" }}>{f.stage}</span>
                <div className="funnel-track">
                  <div
                    className={`funnel-bar ${f.isBottleneck ? "drop-bar" : ""}`}
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
                <span className="funnel-count">{f.count}</span>
              </div>
            ))}
          </div>

          <div className="funnel-alert-box" style={{ marginTop: "24px" }}>
            <strong>Bottleneck Analysis:</strong> 17.7% drop observed between 5 Whys and SCAMPER Ideation. Students require prompt templates for systematic idea variation.
          </div>
        </section>
      </div>
    </div>
  );
}