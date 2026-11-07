import React, { useState } from "react";
import "./CompanyPanel.css";
import { mockGroupsData, mockTeamsData } from "./mockData";

import StickerArt from "./StickerArt";
import groupsArt from "../../assets/institute-groups.webp";

export default function TeamsGroupsPage() {
  const [teams, setTeams] = useState(mockTeamsData);
  const [departments] = useState(mockGroupsData);
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'active' | 'mentored' | 'archived'
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: "", group_id: 101, leader: "" });

  const countAll = teams.length;
  const countActive = teams.filter(t => t.status === "active").length;
  const countMentored = teams.length; // all mapped to mentors
  const countArchived = 0;

  const filtered = teams.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        t.leader.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter === "all" || t.department === deptFilter;
    let matchStatus = true;
    if (filterStatus === "active") matchStatus = t.status === "active";
    if (filterStatus === "archived") matchStatus = t.status === "archived";
    return matchSearch && matchDept && matchStatus;
  });

  const handleCreateTeam = (e) => {
    e.preventDefault();
    const created = {
      id: Date.now(),
      name: newTeam.name,
      department: departments.find(d => d.id === Number(newTeam.group_id))?.name || "Engineering & R&D",
      leader: newTeam.leader || "Self-assigned",
      membersCount: 1,
      status: "active",
      challengeName: "Autonomous Agents in Supply Chain"
    };
    setTeams([created, ...teams]);
    setShowAddTeamModal(false);
    setNewTeam({ name: "", group_id: 101, leader: "" });
  };

  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">MANAGE • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Teams & Groups</h1>
          <div className="banner-metric-pill-text">{countAll} innovation squads • {departments.length} departments</div>
          <p className="subpage-banner-desc">Manage project squads, department hierarchies, and mentor assignments.</p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-action">
              Manage Depts
            </button>
            <button className="btn-banner-action" onClick={() => setShowAddTeamModal(true)}>
              + Create squad
            </button>
          </div>
        </div>
        <StickerArt className="inst-header-art stu-hero-art grp-hero-art" src={groupsArt} baseRotate={-4} />
      </section>

      {/* 2. MINI DASHBOARD CARDS */}
      <section className="mini-dashboard-grid">
        <div className={`mini-dash-card ${filterStatus === "all" ? "active" : ""}`} onClick={() => setFilterStatus("all")}>
          <div className="mini-dash-tile blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">All squads</span>
            <div className="mini-dash-value">{countAll}</div>
            <span className="mini-dash-subtext">Across {departments.length} departments</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterStatus === "active" ? "active" : ""}`} onClick={() => setFilterStatus("active")}>
          <div className="mini-dash-tile green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Active sprints</span>
            <div className="mini-dash-value">{countActive}</div>
            <span className="mini-dash-subtext">In challenge sprints</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterStatus === "mentored" ? "active" : ""}`} onClick={() => setFilterStatus("mentored")}>
          <div className="mini-dash-tile yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Mentored</span>
            <div className="mini-dash-value">{countMentored}</div>
            <span className="mini-dash-subtext">Assigned expert mentor</span>
          </div>
        </div>

        <div className={`mini-dash-card ${filterStatus === "archived" ? "active" : ""}`} onClick={() => setFilterStatus("archived")}>
          <div className="mini-dash-tile gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Archived</span>
            <div className="mini-dash-value">{countArchived}</div>
            <span className="mini-dash-subtext">Previous cohorts</span>
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
              placeholder="Search squads by name or lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="dropdown-counter-pill">
            <select
              className="clean-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="all">All departments</option>
              <option value="Engineering & R&D">Engineering & R&D</option>
              <option value="Product Design & UX">Product Design & UX</option>
              <option value="Growth & Marketing">Growth & Marketing</option>
              <option value="Customer Operations">Customer Operations</option>
            </select>
            <span className="count-badge">{filtered.length} squads</span>
          </div>
        </div>

        <table className="perf-table">
          <thead>
            <tr>
              <th>Squad Name</th>
              <th>Department</th>
              <th>Team Lead</th>
              <th>Assigned Challenge</th>
              <th>Squad Size</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>
                  <div style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{t.name}</div>
                </td>
                <td>
                  <span className="code-pill">{t.department}</span>
                </td>
                <td style={{ fontWeight: 700, color: "var(--theme-navy)" }}>{t.leader}</td>
                <td style={{ color: "var(--text-secondary)", fontSize: "12.5px" }}>{t.challengeName}</td>
                <td>
                  <span style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{t.membersCount}</span> members
                </td>
                <td>
                  <span className={`status-pill ${t.status === "active" ? "active" : "inactive"}`}>
                    ● {t.status}
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
            ))}
          </tbody>
        </table>
      </div>

      {/* CREATE TEAM MODAL */}
      {showAddTeamModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Create Innovation Squad</h3>
              <button className="modal-close" onClick={() => setShowAddTeamModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label>Squad Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next-Gen Core Agents"
                  className="form-input"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Department Unit</label>
                <select
                  className="form-select"
                  value={newTeam.group_id}
                  onChange={(e) => setNewTeam({ ...newTeam, group_id: e.target.value })}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Team Lead</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  className="form-input"
                  value={newTeam.leader}
                  onChange={(e) => setNewTeam({ ...newTeam, leader: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddTeamModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Squad</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}