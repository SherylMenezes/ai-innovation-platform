import React, { useState } from "react";
import "./CompanyPanel.css";
import { mockSubmissions, mockCompanyChallenges } from "./mockData";

import StickerArt from "./StickerArt";
import assignmentsArt from "../../assets/institute-assignments.webp";

export default function SubmissionsReviewPage() {
  const [submissions, setSubmissions] = useState(mockSubmissions);
  const [selectedChallenge, setSelectedChallenge] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'shortlisted' | 'reviewed' | 'pending'
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSubmissionModal, setActiveSubmissionModal] = useState(null);

  const countAll = submissions.length;
  const countShortlisted = submissions.filter(s => s.status === "shortlisted").length;
  const countReviewed = submissions.filter(s => s.status === "reviewed").length;
  const countPending = submissions.filter(s => s.status === "submitted").length;

  const filtered = submissions.filter(sub => {
    const matchSearch = sub.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        sub.leaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        sub.institution.toLowerCase().includes(searchTerm.toLowerCase());
    const matchChallenge = selectedChallenge === "all" || sub.challengeId === Number(selectedChallenge);
    let matchStatus = true;
    if (statusFilter === "shortlisted") matchStatus = sub.status === "shortlisted";
    if (statusFilter === "reviewed") matchStatus = sub.status === "reviewed";
    if (statusFilter === "pending") matchStatus = sub.status === "submitted";
    return matchSearch && matchChallenge && matchStatus;
  });

  const toggleShortlist = (id) => {
    setSubmissions(submissions.map(s => {
      if (s.id === id) {
        const nextStatus = s.status === "shortlisted" ? "reviewed" : "shortlisted";
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">EVALUATION • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Submissions & AI Review</h1>
          <div className="banner-metric-pill-text">
            {countAll} project submissions • {countShortlisted} candidates shortlisted for awards
          </div>
          <p className="subpage-banner-desc">
            Review solutions ranked automatically by Gemini on Innovation, Impact, Feasibility, and Code Quality.
          </p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-hollow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              Export AI Scorecards
            </button>
            <button className="btn-banner-solid" onClick={() => setStatusFilter("shortlisted")}>
              ★ View Shortlisted Only
            </button>
          </div>
        </div>
        <StickerArt className="inst-header-art stu-hero-art grp-hero-art" src={assignmentsArt} baseRotate={-4} />
      </section>

      {/* 2. MINI DASHBOARD CARDS */}
      <section className="mini-dashboard-grid">
        <div className={`mini-dash-card ${statusFilter === "all" ? "active" : ""}`} onClick={() => setStatusFilter("all")}>
          <div className="mini-dash-tile blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Total Received</span>
            <div className="mini-dash-value">{countAll}</div>
            <span className="mini-dash-subtext">All submitted solutions</span>
          </div>
        </div>

        <div className={`mini-dash-card ${statusFilter === "shortlisted" ? "active" : ""}`} onClick={() => setStatusFilter("shortlisted")}>
          <div className="mini-dash-tile star">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Shortlisted</span>
            <div className="mini-dash-value">{countShortlisted}</div>
            <span className="mini-dash-subtext">Selected for awards</span>
          </div>
        </div>

        <div className={`mini-dash-card ${statusFilter === "reviewed" ? "active" : ""}`} onClick={() => setStatusFilter("reviewed")}>
          <div className="mini-dash-tile green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Evaluated</span>
            <div className="mini-dash-value">{countReviewed}</div>
            <span className="mini-dash-subtext">Internal review done</span>
          </div>
        </div>

        <div className={`mini-dash-card ${statusFilter === "pending" ? "active" : ""}`} onClick={() => setStatusFilter("pending")}>
          <div className="mini-dash-tile yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Unreviewed</span>
            <div className="mini-dash-value">{countPending}</div>
            <span className="mini-dash-subtext">Needs company eyes</span>
          </div>
        </div>
      </section>

      {/* 3. TABLE VIEW */}
      <div className="data-card">
        <div className="table-filter-header">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              className="search-input-clean"
              placeholder="Search by team name, team lead, or college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="dropdown-counter-pill">
            <select
              className="clean-select"
              value={selectedChallenge}
              onChange={(e) => setSelectedChallenge(e.target.value)}
            >
              <option value="all">All Challenges</option>
              {mockCompanyChallenges.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <span className="count-badge">{filtered.length} submissions</span>
          </div>
        </div>

        <table className="perf-table">
          <thead>
            <tr>
              <th style={{ width: "50px" }}>AI Rank</th>
              <th>Solution & Team</th>
              <th>Institution / Tier</th>
              <th>Artifact Format</th>
              <th>AI Score</th>
              <th>Status</th>
              <th>Reviewer Feedback</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((sub) => (
              <tr key={sub.id}>
                <td>
                  <div className={`top-rank-badge ${sub.aiRank === 1 ? "rank-1" : sub.aiRank === 2 ? "rank-2" : sub.aiRank === 3 ? "rank-3" : "rank-other"}`}>
                    #{sub.aiRank}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{sub.teamName}</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>
                    Lead: <strong>{sub.leaderName}</strong> • {sub.challengeTitle}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: "var(--theme-navy)" }}>{sub.institution}</div>
                  <span className="code-pill">{sub.academicTier}</span>
                </td>
                <td style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                  📄 {sub.format}
                </td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontWeight: 800, color: sub.aiScore >= 90 ? "#059669" : "var(--theme-navy)", fontSize: "14px" }}>
                      {sub.aiScore}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>/100</span>
                  </div>
                </td>
                <td>
                  <span className={`status-pill ${sub.status === "shortlisted" ? "active" : sub.status === "reviewed" ? "active" : "inactive"}`}>
                    ● {sub.status}
                  </span>
                </td>
                <td>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {sub.companyNote || "No notes added yet."}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      className={`btn-banner-action ${sub.status === "shortlisted" ? "amber" : ""}`}
                      style={{ padding: "5px 10px", fontSize: "11.5px" }}
                      onClick={() => toggleShortlist(sub.id)}
                    >
                      {sub.status === "shortlisted" ? "★ Shortlisted" : "☆ Shortlist"}
                    </button>
                    <button 
                      className="btn-secondary"
                      style={{ padding: "5px 10px", fontSize: "11.5px" }}
                      onClick={() => setActiveSubmissionModal(sub)}
                    >
                      Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DETAILED AI SCORECARD MODAL */}
      {activeSubmissionModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ width: "560px" }}>
            <div className="modal-header">
              <h3 className="modal-title">AI Evaluation: {activeSubmissionModal.teamName}</h3>
              <button className="modal-close" onClick={() => setActiveSubmissionModal(null)}>✕</button>
            </div>
            <div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                Challenge: <strong>{activeSubmissionModal.challengeTitle}</strong> ({activeSubmissionModal.institution})
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
                <div style={{ background: "#F8FAFD", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Innovation Index</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--theme-navy)" }}>{activeSubmissionModal.rubric.innovation}/100</div>
                </div>
                <div style={{ background: "#F8FAFD", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Real-World Impact</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--theme-navy)" }}>{activeSubmissionModal.rubric.impact}/100</div>
                </div>
                <div style={{ background: "#F8FAFD", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Execution Feasibility</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--theme-navy)" }}>{activeSubmissionModal.rubric.feasibility}/100</div>
                </div>
                <div style={{ background: "#F8FAFD", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Technical Rigor</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--theme-navy)" }}>{activeSubmissionModal.rubric.technical}/100</div>
                </div>
              </div>

              <div className="form-group">
                <label>Company Reviewer Notes</label>
                <textarea 
                  className="form-input" 
                  rows={3} 
                  defaultValue={activeSubmissionModal.companyNote} 
                  placeholder="Enter mentor critique or hiring recommendation..."
                />
              </div>

              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setActiveSubmissionModal(null)}>Close</button>
                <button className="btn-primary" onClick={() => { toggleShortlist(activeSubmissionModal.id); setActiveSubmissionModal(null); }}>
                  Save & Shortlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}