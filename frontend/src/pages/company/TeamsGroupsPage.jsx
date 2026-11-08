import React, { useState } from "react";
import "./CompanyPanel.css";
import { mockGroupsData, mockTeamsData, mockCompanyChallenges } from "./mockData";

import StickerArt from "./StickerArt";
import groupsArt from "../../assets/institute-groups.webp";


export default function TeamsGroupsPage() {
  const [activeTab, setActiveTab] = useState("teams"); // 'teams' | 'departments'
  const [teams, setTeams] = useState(mockTeamsData);
  const [departments, setDepartments] = useState(mockGroupsData);
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'active' | 'mentored' | 'archived'
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Slide-over Squad Drawer State
  const [selectedSquad, setSelectedSquad] = useState(null);

  // Modals
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);

  // Form States
  const [newTeam, setNewTeam] = useState({
    name: "",
    group_id: 101,
    leader: "",
    challenge_id: 101,
    mentor_name: "Dr. Kimberly Reed"
  });

  const [newDept, setNewDept] = useState({
    name: "",
    tier: "Senior",
    academic_tier: "Senior Level"
  });

  // Card Counters
  const countAll = teams.length;
  const countActive = teams.filter((t) => t.status === "active").length;
  const countMentored = teams.length;
  const countDepts = departments.length;

  // Filtered Teams
  const filteredTeams = teams.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.leader.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter === "all" || t.department === deptFilter;
    let matchStatus = true;
    if (filterStatus === "active") matchStatus = t.status === "active";
    if (filterStatus === "archived") matchStatus = t.status === "archived";
    return matchSearch && matchDept && matchStatus;
  });

  // Filtered Departments
  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateTeam = (e) => {
    e.preventDefault();
    const deptObj = departments.find((d) => d.id === Number(newTeam.group_id));
    const chObj = mockCompanyChallenges.find((c) => c.id === Number(newTeam.challenge_id));

    const created = {
      id: Date.now(),
      name: newTeam.name,
      department: deptObj ? deptObj.name : "Engineering & R&D",
      leader: newTeam.leader,
      membersCount: 1,
      status: "active",
      challengeName: chObj ? chObj.title : "Enterprise AI Sprint",
      mentor: newTeam.mentor_name,
      members: [
        { name: newTeam.leader, role: "leader", joined: "Just now" }
      ]
    };

    setTeams([created, ...teams]);
    setShowAddTeamModal(false);
    setNewTeam({ name: "", group_id: 101, leader: "", challenge_id: 101, mentor_name: "Dr. Kimberly Reed" });
  };

  const handleCreateDepartment = (e) => {
    e.preventDefault();
    const createdDept = {
      id: Date.now(),
      name: newDept.name,
      kind: "department",
      academic_tier: newDept.tier,
      invite_code: `${newDept.name.substring(0, 3).toUpperCase()}-CORP-2026`,
      completion: 0,
      avgAiScore: 0,
      avgXp: 0,
      statusTag: "New"
    };
    setDepartments([...departments, createdDept]);
    setShowAddDeptModal(false);
    setNewDept({ name: "", tier: "Senior", academic_tier: "Senior Level" });
  };

  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">ORGANIZATION • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Teams & Groups</h1>
          <div className="banner-metric-pill-text">
            {countAll} innovation squads • {countDepts} departments • Industry mentor mapping
          </div>
          <p className="subpage-banner-desc">
            Organize cross-functional problem-solving squads, assign domain mentors, and maintain departmental cohorts.
          </p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-hollow" onClick={() => setShowAddDeptModal(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
              + Add Department
            </button>
            <button className="btn-banner-solid" onClick={() => setShowAddTeamModal(true)}>
              + Create Squad
            </button>
          </div>
        </div>
        <StickerArt className="inst-header-art stu-hero-art grp-hero-art" src={groupsArt} baseRotate={-4} />
      </section>

      {/* 2. MINI DASHBOARD CARDS */}
      <section className="mini-dashboard-grid">
        <div
          className={`mini-dash-card ${filterStatus === "all" ? "active" : ""}`}
          onClick={() => { setFilterStatus("all"); setActiveTab("teams"); }}
        >
          <div className="mini-dash-tile blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">All Squads</span>
            <div className="mini-dash-value">{countAll}</div>
            <span className="mini-dash-subtext">Across {countDepts} units</span>
          </div>
        </div>

        <div
          className={`mini-dash-card ${filterStatus === "active" ? "active" : ""}`}
          onClick={() => { setFilterStatus("active"); setActiveTab("teams"); }}
        >
          <div className="mini-dash-tile green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Active Sprints</span>
            <div className="mini-dash-value">{countActive}</div>
            <span className="mini-dash-subtext">Currently working</span>
          </div>
        </div>

        <div
          className={`mini-dash-card ${filterStatus === "mentored" ? "active" : ""}`}
          onClick={() => { setFilterStatus("mentored"); setActiveTab("teams"); }}
        >
          <div className="mini-dash-tile yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Mentored</span>
            <div className="mini-dash-value">{countMentored}</div>
            <span className="mini-dash-subtext">Expert paired</span>
          </div>
        </div>

        <div
          className={`mini-dash-card ${activeTab === "departments" ? "active" : ""}`}
          onClick={() => setActiveTab("departments")}
        >
          <div className="mini-dash-tile gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M3 9h18" /><path d="M9 21V9" />
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Departments</span>
            <div className="mini-dash-value">{countDepts}</div>
            <span className="mini-dash-subtext">Business units</span>
          </div>
        </div>
      </section>

      {/* 3. DUAL-TAB SWITCHER */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "4px" }}>
        <button
          className={`tab-btn ${activeTab === "teams" ? "active" : ""}`}
          onClick={() => setActiveTab("teams")}
        >
          Project Squads ({teams.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "departments" ? "active" : ""}`}
          onClick={() => setActiveTab("departments")}
        >
          Departments & Hierarchy ({departments.length})
        </button>
      </div>

      {/* 4. MAIN DATA VIEW */}
      <div className="data-card">
        {/* Search & Department Selector */}
        <div className="table-filter-header">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className="search-input-clean"
              placeholder={activeTab === "teams" ? "Search squads by team name or lead..." : "Search departments..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {activeTab === "teams" && (
            <div className="dropdown-counter-pill">
              <select
                className="clean-select"
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
              <span className="count-badge">{filteredTeams.length} squads</span>
            </div>
          )}
        </div>

        {/* TAB 1: SQUADS TABLE */}
        {activeTab === "teams" ? (
          <table className="perf-table">
            <thead>
              <tr>
                <th>Squad Name</th>
                <th>Department Unit</th>
                <th>Squad Leader</th>
                <th>Assigned Challenge</th>
                <th>Squad Size</th>
                <th>Assigned Mentor</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((t) => (
                <tr
                  key={t.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedSquad(t)}
                >
                  <td>
                    <div style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{t.name}</div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>ID: #{t.id}</span>
                  </td>
                  <td>
                    <span className="code-pill">{t.department}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--theme-navy)" }}>{t.leader}</div>
                    <span style={{ fontSize: "11px", color: "#059669" }}>👑 Squad Captain</span>
                  </td>
                  <td>
                    <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", maxWidth: "230px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.challengeName}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{t.membersCount}</span> members
                  </td>
                  <td>
                    <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--theme-blue-primary)" }}>
                      🎓 {t.mentor || "Dr. Kimberly Reed"}
                    </span>
                  </td>
                  <td>
                    <span className={`status-pill ${t.status === "active" ? "active" : "inactive"}`}>
                      ● {t.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "var(--text-muted)", fontSize: "16px", fontWeight: 700 }}>›</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* TAB 2: DEPARTMENTS TABLE */
          <table className="perf-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Classification</th>
                <th>Seniority Tier</th>
                <th>Department Join Code</th>
                <th>Active Squads</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDepts.map((d) => {
                const squadsInDept = teams.filter((t) => t.department === d.name).length;
                return (
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{d.name}</div>
                      <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Unit #{d.id}</span>
                    </td>
                    <td>
                      <span className="code-pill" style={{ textTransform: "capitalize" }}>{d.kind}</span>
                    </td>
                    <td>{d.academic_tier}</td>
                    <td>
                      <code className="code-pill" style={{ background: "#F1F5F9", color: "var(--theme-navy)" }}>
                        {d.invite_code}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{squadsInDept}</span> Squads
                    </td>
                    <td>
                      <button className="action-link" onClick={() => { setDeptFilter(d.name); setActiveTab("teams"); }}>
                        View Squads →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. SLIDE-OVER SQUAD DRAWER (Matches TeamDrawer.jsx) */}
      {selectedSquad && (
        <div className="modal-overlay" onClick={() => setSelectedSquad(null)}>
          <div
            className="modal-content"
            style={{
              position: "fixed",
              right: 0,
              top: 0,
              bottom: 0,
              width: "480px",
              maxWidth: "90vw",
              height: "100vh",
              borderRadius: "20px 0 0 20px",
              padding: "32px",
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="code-pill">{selectedSquad.department}</span>
                <h3 className="modal-title" style={{ marginTop: "6px" }}>{selectedSquad.name}</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedSquad(null)}>✕</button>
            </div>

            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Target Problem Brief</div>
              <div style={{ fontWeight: 700, color: "var(--theme-navy)", marginTop: "2px" }}>
                {selectedSquad.challengeName}
              </div>

              {/* Mentor Box */}
              <div style={{ background: "var(--tile-blue-bg)", padding: "14px", borderRadius: "12px", marginTop: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", color: "var(--theme-blue-primary)" }}>
                  Assigned Domain Mentor
                </div>
                <div style={{ fontWeight: 800, color: "var(--theme-navy)", marginTop: "4px" }}>
                  {selectedSquad.mentor || "Dr. Kimberly Reed"}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Senior AI Architect • Assigned via `mentor_assignments`
                </div>
              </div>

              {/* Member Roster (from team_members table) */}
              <div style={{ marginTop: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 800, color: "var(--theme-navy)" }}>
                    Squad Members ({selectedSquad.membersCount})
                  </h4>
                  <button className="action-link" style={{ fontSize: "12px" }}>+ Add Member</button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F8FAFD", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--theme-navy)" }}>{selectedSquad.leader}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Joined at cohort launch</div>
                    </div>
                    <span className="tag-badge top" style={{ background: "#FEF3C7", color: "#92400E" }}>👑 Leader</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F8FAFD", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--theme-navy)" }}>Alex Morgan</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Role: Frontend & UX</div>
                    </div>
                    <span className="code-pill">Member</span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "#F8FAFD", borderRadius: "8px" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--theme-navy)" }}>Rohan Sen</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Role: Pipeline Engineer</div>
                    </div>
                    <span className="code-pill">Member</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "32px", display: "flex", gap: "10px" }}>
                <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedSquad(null)}>
                  Close
                </button>
                <button className="btn-primary" style={{ flex: 1 }}>
                  Schedule Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE SQUAD MODAL */}
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
                <label>Parent Department Unit</label>
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
                <label>Team Captain (Squad Leader)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Devansh Mehta"
                  className="form-input"
                  value={newTeam.leader}
                  onChange={(e) => setNewTeam({ ...newTeam, leader: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Target Challenge Brief</label>
                <select
                  className="form-select"
                  value={newTeam.challenge_id}
                  onChange={(e) => setNewTeam({ ...newTeam, challenge_id: e.target.value })}
                >
                  {mockCompanyChallenges.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddTeamModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Squad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD DEPARTMENT MODAL */}
      {showAddDeptModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Add Department Unit</h3>
              <button className="modal-close" onClick={() => setShowAddDeptModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateDepartment}>
              <div className="form-group">
                <label>Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Robotics & Hardware Lab"
                  className="form-input"
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Seniority / Academic Tier</label>
                <select
                  className="form-select"
                  value={newDept.tier}
                  onChange={(e) => setNewDept({ ...newDept, tier: e.target.value })}
                >
                  <option value="Senior">Senior Level</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Associate">Associate</option>
                  <option value="Junior / Intern">Junior / Intern</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddDeptModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}