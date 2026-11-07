import React, { useState } from "react";
import "./CompanyPanel.css";
import { mockEmployeesData } from "./mockData";

import StickerArt from "./StickerArt";
import explorerArt from "../../assets/institute-explorer.webp";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(mockEmployeesData);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'invited' | 'deactivated'
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: "", email: "", department: "Engineering & R&D", tier: "Senior" });

  // Counts for the 4 mini dashboard cards
  const countAll = employees.length;
  const countActive = employees.filter(e => e.is_active).length;
  const countInvited = 9; // Pending sign-up invites
  const countDeactivated = employees.filter(e => !e.is_active).length;

  const filtered = employees.filter((emp) => {
    const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = deptFilter === "all" || emp.department === deptFilter;
    let matchStatus = true;
    if (statusFilter === "active") matchStatus = emp.is_active;
    if (statusFilter === "deactivated") matchStatus = !emp.is_active;
    if (statusFilter === "invited") matchStatus = false; // Toggle to empty or pending
    return matchSearch && matchDept && matchStatus;
  });

  const getInitials = (name) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const created = {
      id: `usr_${Date.now()}`,
      name: newEmployee.name,
      email: newEmployee.email,
      department: newEmployee.department,
      academic_tier: newEmployee.tier,
      is_active: true,
      last_active_at: "Just now",
      total_xp: 0,
      completed_count: 0,
      avg_overall_score: null,
      badge_count: 0
    };
    setEmployees([created, ...employees]);
    setShowAddModal(false);
    setNewEmployee({ name: "", email: "", department: "Engineering & R&D", tier: "Senior" });
  };

  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">MANAGE • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Employees</h1>
          <div className="banner-metric-pill-text">{countAll} enrolled • {countActive} active this week</div>
          <p className="subpage-banner-desc">Track progress, scores and access for everyone in your company.</p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-action">
              Bulk upload
            </button>
            <button className="btn-banner-action" onClick={() => setShowAddModal(true)}>
              + Add member
            </button>
          </div>
        </div>
        <StickerArt className="inst-header-art" src={explorerArt} />
      </section>

      {/* 2. MINI DASHBOARD CARD FILTER STRIP */}
      <section className="mini-dashboard-grid">
        {/* All Employees */}
        <div 
          className={`mini-dash-card ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >
          <div className="mini-dash-tile blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">All employees</span>
            <div className="mini-dash-value">{countAll}</div>
            <span className="mini-dash-subtext">Across 4 departments</span>
          </div>
        </div>

        {/* Active */}
        <div 
          className={`mini-dash-card ${statusFilter === "active" ? "active" : ""}`}
          onClick={() => setStatusFilter("active")}
        >
          <div className="mini-dash-tile green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Active</span>
            <div className="mini-dash-value">{countActive}</div>
            <span className="mini-dash-subtext">Active this week</span>
          </div>
        </div>

        {/* Invited */}
        <div 
          className={`mini-dash-card ${statusFilter === "invited" ? "active" : ""}`}
          onClick={() => setStatusFilter("invited")}
        >
          <div className="mini-dash-tile yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Invited</span>
            <div className="mini-dash-value">{countInvited}</div>
            <span className="mini-dash-subtext">Waiting to sign up</span>
          </div>
        </div>

        {/* Deactivated */}
        <div 
          className={`mini-dash-card ${statusFilter === "deactivated" ? "active" : ""}`}
          onClick={() => setStatusFilter("deactivated")}
        >
          <div className="mini-dash-tile gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Deactivated</span>
            <div className="mini-dash-value">{countDeactivated}</div>
            <span className="mini-dash-subtext">Access paused</span>
          </div>
        </div>
      </section>

      {/* 3. TABLE CARD */}
      <div className="data-card">
        {/* Search & Department Selector */}
        <div className="table-filter-header">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              className="search-input-clean"
              placeholder="Search by name or email..."
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
            <span className="count-badge">{filtered.length} employees</span>
          </div>
        </div>

        {/* Main Table */}
        <table className="perf-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>XP</th>
              <th>Progress</th>
              <th>Score</th>
              <th>Last Active</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => {
              const progressPct = Math.round((emp.completed_count / (emp.enrolled_count || 4)) * 100);
              return (
                <tr key={emp.id}>
                  {/* Name with Avatar */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="avatar-chip">{getInitials(emp.name)}</div>
                      <div>
                        <div style={{ fontWeight: 700, color: "var(--theme-navy)" }}>{emp.name}</div>
                        <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{emp.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Department & Tier */}
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--theme-navy)" }}>{emp.department}</div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{emp.academic_tier}</div>
                  </td>

                  {/* XP & Level */}
                  <td>
                    <div style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{emp.total_xp}</div>
                    <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Level {Math.floor(emp.total_xp / 400) + 1}</div>
                  </td>

                  {/* Progress Bar Line */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="dist-bar-track" style={{ width: "90px" }}>
                        <div className="dist-bar-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--theme-navy)" }}>{progressPct}%</span>
                    </div>
                  </td>

                  {/* Score */}
                  <td>
                    {emp.avg_overall_score ? (
                      <span className="code-pill" style={{ background: "#EFF6FF", color: "#1D58D8" }}>
                        {emp.avg_overall_score}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>--</span>
                    )}
                  </td>

                  {/* Last Active */}
                  <td style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{emp.last_active_at}</td>

                  {/* Status Pill */}
                  <td>
                    <span className={`status-pill ${emp.is_active ? "active" : "inactive"}`}>
                      ● {emp.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions (Pencil & Ban) */}
                  <td>
                    <div style={{ display: "flex", gap: "8px", color: "var(--text-muted)", cursor: "pointer" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                      </svg>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/>
                      </svg>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Invite New Member</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  placeholder="e.g. Alex Morgan"
                />
              </div>
              <div className="form-group">
                <label>Work Email</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  placeholder="alex@acme.com"
                />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select
                  className="form-select"
                  value={newEmployee.department}
                  onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                >
                  <option value="Engineering & R&D">Engineering & R&D</option>
                  <option value="Product Design & UX">Product Design & UX</option>
                  <option value="Growth & Marketing">Growth & Marketing</option>
                  <option value="Customer Operations">Customer Operations</option>
                </select>
              </div>
              <div className="form-group">
                <label>Academic / Seniority Tier</label>
                <select
                  className="form-select"
                  value={newEmployee.tier}
                  onChange={(e) => setNewEmployee({ ...newEmployee, tier: e.target.value })}
                >
                  <option value="Senior">Senior Level</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Associate">Associate</option>
                  <option value="Junior / Intern">Junior / Intern</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}