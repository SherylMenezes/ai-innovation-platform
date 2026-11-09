import React, { useState } from "react";
import "./StudentPanel.css";

export default function StudentReports() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState("");

  const studentAiLogs = [
    { 
      id: 401, 
      stage: "Problem Canvas", 
      promptTitle: "Identify target user pain points for Smart Campus Waste tracking sensors", 
      model: "Gemini 2.5 Flash", 
      tokens: "420 tkn", 
      latency: "0.34s", 
      alignmentScore: "96%",
      status: "Optimized", 
      date: "Today, 11:15 AM" 
    },
    { 
      id: 402, 
      stage: "SCAMPER Ideation", 
      promptTitle: "Apply 'Substitute' & 'Combine' axioms to traditional recycling bins", 
      model: "Gemini 2.5 Flash", 
      tokens: "680 tkn", 
      latency: "0.51s", 
      alignmentScore: "94%",
      status: "Optimized", 
      date: "Yesterday, 3:40 PM" 
    },
    { 
      id: 403, 
      stage: "Idea Evaluation", 
      promptTitle: "Generate corporate rubric feedback and failure-mode risk matrices", 
      model: "Gemini 2.5 Flash", 
      tokens: "950 tkn", 
      latency: "0.82s", 
      alignmentScore: "98%",
      status: "Reviewed", 
      date: "Nov 10, 2026" 
    },
    { 
      id: 404, 
      stage: "Problem Canvas", 
      promptTitle: "Synthesize IoT telemetry data requirements into functional specifications", 
      model: "Gemini 2.5 Flash", 
      tokens: "510 tkn", 
      latency: "0.42s", 
      alignmentScore: "91%",
      status: "Optimized", 
      date: "Nov 04, 2026" 
    },
    { 
      id: 405, 
      stage: "SCAMPER Ideation", 
      promptTitle: "Brainstorm low-cost solar power management options for remote nodes", 
      model: "Gemini 2.5 Flash", 
      tokens: "720 tkn", 
      latency: "0.60s", 
      alignmentScore: "95%",
      status: "Optimized", 
      date: "Oct 28, 2026" 
    }
  ];

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const filteredLogs = studentAiLogs.filter(log => {
    const matchesSearch = log.promptTitle.toLowerCase().includes(searchTerm.toLowerCase()) || log.stage.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === "all" || log.stage.toLowerCase().includes(activeFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: '12px', zIndex: 1000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', fontWeight: 600, fontSize: '13.5px', borderLeft: '4px solid #7c3aed' }}>
          {toastMessage}
        </div>
      )}

      {/* HERO BANNER */}
      <section className="header-banner" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" }}>
        <div className="banner-left">
          <div className="banner-subtitle" style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, marginBottom: '4px' }}>INSIGHTS • AI PROMPT TELEMETRY & AUDIT</div>
          <h1 className="banner-title">AI Collaboration Analytics</h1>
          <div className="banner-subtitle">54 active session logs • 98.6% contextual reasoning accuracy</div>
          <p className="banner-desc">Review your automated prompt history, token efficiency, and AI critique scorecards across your 4 active innovation workspaces.</p>

          <div className="banner-controls" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button className="btn-banner-action" onClick={() => triggerToast("📥 Telemetry report successfully exported as CSV.")} style={{ background: "#ffffff", color: "#7c3aed", fontWeight: 700, cursor: 'pointer' }}>
              Export Telemetry CSV
            </button>
            <button className="btn-banner-action" onClick={() => triggerToast("⚡ Token budget optimal: 3,280 / 10,000 monthly allotment used.")} style={{ background: "rgba(255, 255, 255, 0.2)", color: "#ffffff", border: "1px solid rgba(255, 255, 255, 0.3)", cursor: 'pointer' }}>
              Audit Token Budget
            </button>
          </div>
        </div>
      </section>

      {/* STAT CARDS */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Total Prompts Executed</span>
            <div className="stat-tile blue">⚡</div>
          </div>
          <div className="stat-value">54</div>
          <div className="stat-footnote">Across 4 active tracks</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Avg Context Footprint</span>
            <div className="stat-tile green">🧠</div>
          </div>
          <div className="stat-value">656 tkn</div>
          <div className="stat-footnote">High context efficiency</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Dominant Framework</span>
            <div className="stat-tile yellow">💡</div>
          </div>
          <div className="stat-value">SCAMPER</div>
          <div className="stat-footnote">42% ideation weight</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-label">Alignment Score</span>
            <div className="stat-tile star">★</div>
          </div>
          <div className="stat-value">98.6<span>%</span></div>
          <div className="stat-footnote">Evaluator verified</div>
        </div>
      </section>

      {/* TABLE PANEL */}
      <section className="dashboard-panel" style={{ marginTop: '24px' }}>
        <div className="panel-header-row" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '260px', maxWidth: '380px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              className="search-input-clean"
              placeholder="Search prompt objectives or stages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {["all", "canvas", "scamper", "evaluation"].map((stage) => (
              <button
                key={stage}
                onClick={() => setActiveFilter(stage)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: activeFilter === stage ? '#7c3aed' : '#f1f5f9',
                  color: activeFilter === stage ? '#ffffff' : '#475569',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        <table className="perf-table-clean">
          <thead>
            <tr>
              <th>ID</th>
              <th>Milestone Stage</th>
              <th>Prompt Objective & Focus</th>
              <th>Tokens</th>
              <th>Latency</th>
              <th>Alignment</th>
              <th>Status</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <code style={{ fontFamily: 'monospace', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', color: '#7c3aed', fontWeight: 700 }}>
                    #{log.id}
                  </code>
                </td>
                <td>
                  <span className="tag-badge" style={{ background: '#f3e8ff', color: '#7c3aed', fontWeight: 700 }}>
                    {log.stage}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: "var(--theme-navy)", maxWidth: '300px' }}>{log.promptTitle}</td>
                <td style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600 }}>{log.tokens}</td>
                <td style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600 }}>{log.latency}</td>
                <td>
                  <strong style={{ color: "#16a34a", fontSize: "13px" }}>{log.alignmentScore}</strong>
                </td>
                <td>
                  <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#16a34a", background: "#f0fdf4", padding: "4px 10px", borderRadius: "8px" }}>
                    ● {log.status}
                  </span>
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{log.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}