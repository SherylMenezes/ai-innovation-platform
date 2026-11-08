import React, { useState } from "react";
import "./CompanyPanel.css";
import { mockCompanyChallenges } from "./mockData";

import StickerArt from "./StickerArt";
import challengesArt from "../../assets/institute-challenges.webp";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState(mockCompanyChallenges);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newCh, setNewCh] = useState({ title: "", challenge_type: "company", visibility: "institution", description: "" });

  const countAll = challenges.length;
  const countCompany = challenges.filter(c => c.challenge_type === "company").length;
  const countIndustry = challenges.filter(c => c.challenge_type === "industry").length;
  const countMicro = challenges.filter(c => c.challenge_type === "micro").length;

  const filtered = challenges.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.description.toLowerCase().includes(searchTerm.toLowerCase());
    let matchType = true;
    if (filterType === "company") matchType = c.challenge_type === "company";
    if (filterType === "industry") matchType = c.challenge_type === "industry";
    if (filterType === "micro") matchType = c.challenge_type === "micro";
    return matchSearch && matchType;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const item = {
      id: Date.now(),
      title: newCh.title,
      challenge_type: newCh.challenge_type,
      visibility: newCh.visibility,
      description: newCh.description,
      submissions_count: 0,
      avg_score: null,
      created_at: "Just now"
    };
    setChallenges([item, ...challenges]);
    setShowModal(false);
    setNewCh({ title: "", challenge_type: "company", visibility: "institution", description: "" });
  };

  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">MANAGE • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Challenges</h1>
          <div className="banner-metric-pill-text">{countAll} innovation challenges • 59 submissions across squads</div>
          <p className="subpage-banner-desc">Internal enterprise hackathons, strategic problem briefs, and 48-hour micro-sprints.</p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-action">
              Challenge Library
            </button>
            <button className="btn-banner-action" onClick={() => setShowModal(true)}>
              + Create challenge
            </button>
          </div>
        </div>
        <StickerArt className="inst-header-art stu-hero-art grp-hero-art" src={challengesArt} baseRotate={-4} />
      </section>

      {/* 2. MINI DASHBOARD CARDS */}
      <section className="mini-dashboard-grid">
        <div className={`mini-dash-card ${filterType === "all" ? "active" : ""}`} onClick={() => setFilterType("all")}>
          <div className="mini-dash-tile blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">All challenges</span>
            <div className="mini-dash-value">{countAll}</div>
            <span className="mini-dash-subtext">Active briefs</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterType === "company" ? "active" : ""}`} onClick={() => setFilterType("company")}>
          <div className="mini-dash-tile green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Company core</span>
            <div className="mini-dash-value">{countCompany}</div>
            <span className="mini-dash-subtext">Internal problems</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterType === "industry" ? "active" : ""}`} onClick={() => setFilterType("industry")}>
          <div className="mini-dash-tile yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Industry benchmark</span>
            <div className="mini-dash-value">{countIndustry}</div>
            <span className="mini-dash-subtext">Cross-sector goals</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterType === "micro" ? "active" : ""}`} onClick={() => setFilterType("micro")}>
          <div className="mini-dash-tile gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Micro-sprints</span>
            <div className="mini-dash-value">{countMicro}</div>
            <span className="mini-dash-subtext">48-hour challenges</span>
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
              placeholder="Search challenges by title or problem brief..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="count-badge">{filtered.length} challenges</span>
        </div>

        <table className="perf-table">
          <thead>
            <tr>
              <th>Challenge Title</th>
              <th>Type</th>
              <th>Visibility</th>
              <th>Submissions</th>
              <th>Avg AI Score</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <div style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{c.title}</div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-muted)", maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.description}
                  </div>
                </td>
                <td>
                  <span className="code-pill" style={{ textTransform: "uppercase" }}>{c.challenge_type}</span>
                </td>
                <td>
                  <span className={`status-pill ${c.visibility === "institution" ? "active" : "inactive"}`}>
                    {c.visibility}
                  </span>
                </td>
                <td style={{ fontWeight: 700, color: "var(--theme-navy)" }}>
                  {c.submissions_count} squads
                </td>
                <td>
                  {c.avg_score ? (
                    <span className="code-pill" style={{ background: "#EFF6FF", color: "#1D58D8" }}>
                      {c.avg_score}/100
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>--</span>
                  )}
                </td>
                <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{c.created_at}</td>
                <td>
                  <div style={{ display: "flex", gap: "8px", color: "var(--text-muted)", cursor: "pointer" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                    </svg>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE CHALLENGE MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create Internal Challenge</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Supply Chain AI"
                  className="form-input"
                  value={newCh.title}
                  onChange={(e) => setNewCh({ ...newCh, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select
                  className="form-select"
                  value={newCh.challenge_type}
                  onChange={(e) => setNewCh({ ...newCh, challenge_type: e.target.value })}
                >
                  <option value="company">Company Internal Problem</option>
                  <option value="industry">Industry Benchmark</option>
                  <option value="micro">Micro-Sprint (48 Hr)</option>
                  <option value="theme">Thematic Innovation</option>
                </select>
              </div>
              <div className="form-group">
                <label>Brief</label>
                <textarea
                  className="form-input"
                  rows={3}
                  required
                  placeholder="Describe the problem parameters..."
                  value={newCh.description}
                  onChange={(e) => setNewCh({ ...newCh, description: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Publish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}