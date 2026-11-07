import React, { useState } from "react";
import "./CompanyPanel.css";
import { mockAwardsData } from "./mockData";

export default function AwardsPage() {
  const [awards, setAwards] = useState(mockAwardsData);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newAward, setNewAward] = useState({ title: "", award_type: "innovation_award", recipient: "" });

  const countAll = awards.length;
  const countInnovation = awards.filter(a => a.award_type === "innovation_award").length;
  const countTop = awards.filter(a => a.award_type === "top_student").length;
  const countCert = awards.filter(a => a.award_type === "certificate").length;

  const filtered = awards.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        a.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
    let matchType = true;
    if (filterType === "innovation") matchType = a.award_type === "innovation_award";
    if (filterType === "top") matchType = a.award_type === "top_student";
    if (filterType === "cert") matchType = a.award_type === "certificate";
    return matchSearch && matchType;
  });

  const handleIssueAward = (e) => {
    e.preventDefault();
    const created = {
      id: Date.now(),
      title: newAward.title,
      award_type: newAward.award_type,
      recipientName: newAward.recipient,
      certificate_code: `CERT-ACME-${Math.floor(1000 + Math.random() * 9000)}`,
      issued_at: "Today"
    };
    setAwards([created, ...awards]);
    setShowModal(false);
    setNewAward({ title: "", award_type: "innovation_award", recipient: "" });
  };

  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">INSIGHTS • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Awards & Certifications</h1>
          <div className="banner-metric-pill-text">{countAll} recognized milestones • Verified PDF certificate hashes</div>
          <p className="subpage-banner-desc">Issue blockchain-verifiable completion certificates, innovation awards, and team badges.</p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-hollow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
              </svg>
              View Templates
            </button>
            <button className="btn-banner-solid" onClick={() => setShowModal(true)}>
              + Issue award
            </button>
          </div>
        </div>
      </section>

      {/* 2. MINI DASHBOARD CARDS */}
      <section className="mini-dashboard-grid">
        <div className={`mini-dash-card ${filterType === "all" ? "active" : ""}`} onClick={() => setFilterType("all")}>
          <div className="mini-dash-tile blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">All awards</span>
            <div className="mini-dash-value">{countAll}</div>
            <span className="mini-dash-subtext">Issued credentials</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterType === "innovation" ? "active" : ""}`} onClick={() => setFilterType("innovation")}>
          <div className="mini-dash-tile green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Innovation</span>
            <div className="mini-dash-value">{countInnovation}</div>
            <span className="mini-dash-subtext">Squad trophies</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterType === "top" ? "active" : ""}`} onClick={() => setFilterType("top")}>
          <div className="mini-dash-tile yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Top Innovator</span>
            <div className="mini-dash-value">{countTop}</div>
            <span className="mini-dash-subtext">Individual honors</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterType === "cert" ? "active" : ""}`} onClick={() => setFilterType("cert")}>
          <div className="mini-dash-tile gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><path d="M3 9h18"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Certificates</span>
            <div className="mini-dash-value">{countCert}</div>
            <span className="mini-dash-subtext">PDF verification</span>
          </div>
        </div>
      </section>

      {/* 3. TABLE CARD */}
      <div className="data-card">
        <div className="table-filter-header">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              className="search-input-clean"
              placeholder="Search awards by title or recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="count-badge">{filtered.length} credentials</span>
        </div>

        <table className="perf-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Recipient</th>
              <th>Verification Code</th>
              <th>Issued</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((aw) => (
              <tr key={aw.id}>
                <td>
                  <div style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{aw.title}</div>
                </td>
                <td>
                  <span className="code-pill" style={{ textTransform: "capitalize" }}>
                    {aw.award_type.replace("_", " ")}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: "var(--theme-navy)" }}>{aw.recipientName}</td>
                <td>
                  <code className="code-pill" style={{ background: "#F1F5F9", color: "var(--theme-navy)" }}>
                    {aw.certificate_code}
                  </code>
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{aw.issued_at}</td>
                <td>
                  <button className="action-link">Download PDF 📄</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ISSUE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Issue Recognition Award</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleIssueAward}>
              <div className="form-group">
                <label>Award Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q4 Breakthrough Innovator"
                  className="form-input"
                  value={newAward.title}
                  onChange={(e) => setNewAward({ ...newAward, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  className="form-select"
                  value={newAward.award_type}
                  onChange={(e) => setNewAward({ ...newAward, award_type: e.target.value })}
                >
                  <option value="innovation_award">Innovation Award</option>
                  <option value="top_student">Top Innovator</option>
                  <option value="certificate">Completion Certificate</option>
                </select>
              </div>
              <div className="form-group">
                <label>Recipient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Al-Mansoor or Alpha Squad"
                  className="form-input"
                  value={newAward.recipient}
                  onChange={(e) => setNewAward({ ...newAward, recipient: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}