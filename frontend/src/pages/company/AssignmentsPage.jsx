import React, { useState } from "react";
import "./CompanyPanel.css";
import { mockAssignmentsData, mockChallengesData } from "./mockData";

import StickerArt from "./StickerArt";
import assignmentsArt from "../../assets/institute-assignments.webp";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState(mockAssignmentsData);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newAssign, setNewAssign] = useState({ challenge_id: 1, target_type: "department", target_name: "Engineering & R&D", due_at: "2026-11-20", note: "" });

  const countAll = assignments.length;
  const countActive = assignments.filter(a => a.status === "active").length;
  const countDueSoon = 2;
  const countClosed = 0;

  const filtered = assignments.filter(a => {
    const matchSearch = a.challengeTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        a.target_name.toLowerCase().includes(searchTerm.toLowerCase());
    let matchStatus = true;
    if (filterStatus === "active") matchStatus = a.status === "active";
    if (filterStatus === "closed") matchStatus = a.status === "closed";
    return matchSearch && matchStatus;
  });

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    const ch = mockChallengesData.find(c => c.id === Number(newAssign.challenge_id));
    const created = {
      id: Date.now(),
      challengeTitle: ch ? ch.title : "New Sprint Challenge",
      target_type: newAssign.target_type,
      target_name: newAssign.target_name,
      due_at: newAssign.due_at,
      status: "active",
      enrolled_count: 28,
      completed_count: 0,
      note: newAssign.note || "Strategic cohort milestone."
    };
    setAssignments([created, ...assignments]);
    setShowModal(false);
  };

  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">MANAGE • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Assignments</h1>
          <div className="banner-metric-pill-text">{countActive} active challenge goals • 2 due this week</div>
          <p className="subpage-banner-desc">Assign strategic innovation problems to departments, teams, or individuals with deadlines.</p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-action">
              Extend Deadlines
            </button>
            <button className="btn-banner-action" onClick={() => setShowModal(true)}>
              + Assign challenge
            </button>
          </div>
        </div>
        <StickerArt className="inst-header-art" src={assignmentsArt} baseRotate={-4} />
      </section>

      {/* 2. MINI DASHBOARD CARDS */}
      <section className="mini-dashboard-grid">
        <div className={`mini-dash-card ${filterStatus === "all" ? "active" : ""}`} onClick={() => setFilterStatus("all")}>
          <div className="mini-dash-tile blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">All assignments</span>
            <div className="mini-dash-value">{countAll}</div>
            <span className="mini-dash-subtext">Across company</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterStatus === "active" ? "active" : ""}`} onClick={() => setFilterStatus("active")}>
          <div className="mini-dash-tile green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Active</span>
            <div className="mini-dash-value">{countActive}</div>
            <span className="mini-dash-subtext">Currently ongoing</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterStatus === "due" ? "active" : ""}`} onClick={() => setFilterStatus("due")}>
          <div className="mini-dash-tile yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Due soon</span>
            <div className="mini-dash-value">{countDueSoon}</div>
            <span className="mini-dash-subtext">Due in &lt; 48 hours</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterStatus === "closed" ? "active" : ""}`} onClick={() => setFilterStatus("closed")}>
          <div className="mini-dash-tile gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="15" y1="9" y2="15"/><line x1="15" x2="9" y1="9" y2="15"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Closed</span>
            <div className="mini-dash-value">{countClosed}</div>
            <span className="mini-dash-subtext">Completed sprints</span>
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
              placeholder="Search assignments by title or target..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="count-badge">{filtered.length} assignments</span>
        </div>

        <table className="perf-table">
          <thead>
            <tr>
              <th>Challenge Sprint</th>
              <th>Target Group</th>
              <th>Due Date</th>
              <th>Cohort Progress</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const pct = a.enrolled_count > 0 ? Math.round((a.completed_count / a.enrolled_count) * 100) : 0;
              return (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{a.challengeTitle}</div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{a.note}</div>
                  </td>
                  <td>
                    <span className="code-pill" style={{ textTransform: "capitalize" }}>
                      {a.target_type}: {a.target_name}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--theme-navy)" }}>{a.due_at}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="dist-bar-track" style={{ width: "90px" }}>
                        <div className="dist-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--theme-navy)" }}>
                        {a.completed_count}/{a.enrolled_count} ({pct}%)
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${a.status === "active" ? "active" : "inactive"}`}>
                      ● {a.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px", color: "var(--text-muted)", cursor: "pointer" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      </svg>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ASSIGN MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Assign Innovation Challenge</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateAssignment}>
              <div className="form-group">
                <label>Select Challenge</label>
                <select
                  className="form-select"
                  value={newAssign.challenge_id}
                  onChange={(e) => setNewAssign({ ...newAssign, challenge_id: e.target.value })}
                >
                  {mockChallengesData.map((c) => (
                    <option key={c.id} value={c.id}>{c.title} ({c.challenge_type})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Target Scope</label>
                <select
                  className="form-select"
                  value={newAssign.target_type}
                  onChange={(e) => setNewAssign({ ...newAssign, target_type: e.target.value })}
                >
                  <option value="department">Specific Department</option>
                  <option value="team">Specific Squad / Team</option>
                  <option value="institution">Company-Wide (All Employees)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Target Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newAssign.target_name}
                  onChange={(e) => setNewAssign({ ...newAssign, target_name: e.target.value })}
                  placeholder="e.g. Engineering & R&D"
                />
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  required
                  className="form-input"
                  value={newAssign.due_at}
                  onChange={(e) => setNewAssign({ ...newAssign, due_at: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}