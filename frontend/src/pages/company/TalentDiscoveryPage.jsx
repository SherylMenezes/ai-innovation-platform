import React, { useState } from "react";
import "./CompanyPanel.css";
import { mockTalentPool } from "./mockData";

import StickerArt from "./StickerArt";
import studentsArt from "../../assets/institute-students.webp";

export default function TalentDiscoveryPage() {
  const [talents] = useState(mockTalentPool);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const filtered = talents.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        t.topDomain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTier = tierFilter === "all" || t.tier === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">TALENT DISCOVERY • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Talent Discovery</h1>
          <div className="banner-metric-pill-text">486 active innovators • High-performing problem solvers</div>
          <p className="subpage-banner-desc">
            Discover and hire verified student innovators based on deterministic challenge performance and AI scores.
          </p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-hollow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              </svg>
              Saved Candidates
            </button>
            <button className="btn-banner-solid">
              + Send Internship Invite
            </button>
          </div>
        </div>
        <StickerArt className="inst-header-art stu-hero-art grp-hero-art" src={studentsArt} baseRotate={-4} />
      </section>

      {/* 2. MINI DASHBOARD CARDS */}
      <section className="mini-dashboard-grid">
        <div className="mini-dash-card active">
          <div className="mini-dash-tile blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Vetted Pool</span>
            <div className="mini-dash-value">{talents.length}</div>
            <span className="mini-dash-subtext">Completed $\ge 3$ challenges</span>
          </div>
        </div>

        <div className="mini-dash-card">
          <div className="mini-dash-tile green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Avg AI Quality</span>
            <div className="mini-dash-value">86.8</div>
            <span className="mini-dash-subtext">Across submissions</span>
          </div>
        </div>

        <div className="mini-dash-card">
          <div className="mini-dash-tile yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Total Badges</span>
            <div className="mini-dash-value">26</div>
            <span className="mini-dash-subtext">Earned by top 5</span>
          </div>
        </div>

        <div className="mini-dash-card">
          <div className="mini-dash-tile gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="15" y1="9" y2="15"/>
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Colleges</span>
            <div className="mini-dash-value">4</div>
            <span className="mini-dash-subtext">Represented</span>
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
              placeholder="Search by student, domain skill, or university..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="dropdown-counter-pill">
            <select
              className="clean-select"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
            >
              <option value="all">All Seniority Tiers</option>
              <option value="Graduate">Graduate</option>
              <option value="Grade 11-12">Grade 11-12</option>
              <option value="Professional">Professional</option>
            </select>
            <span className="count-badge">{filtered.length} candidates</span>
          </div>
        </div>

        <table className="perf-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Institution / College</th>
              <th>Tier</th>
              <th>Top Domain Expertise</th>
              <th>Challenges Solved</th>
              <th>Avg AI Score</th>
              <th>XP Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td>
                  <div style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{t.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>🏅 {t.badgesCount} Verified Badges</div>
                </td>
                <td style={{ fontWeight: 600, color: "var(--theme-navy)" }}>{t.institution}</td>
                <td><span className="code-pill">{t.tier}</span></td>
                <td>
                  <span className="code-pill" style={{ background: "#EFF6FF", color: "#1D58D8" }}>{t.topDomain}</span>
                </td>
                <td style={{ fontWeight: 700, color: "var(--theme-navy)" }}>{t.solutionsSubmitted} Completed</td>
                <td>
                  <span style={{ fontWeight: 800, color: t.avgAiScore >= 85 ? "#059669" : "var(--theme-navy)" }}>
                    {t.avgAiScore}/100
                  </span>
                </td>
                <td>
                  <span style={{ fontWeight: 800, color: "var(--theme-blue-primary)" }}>{t.xp} XP</span>
                </td>
                <td>
                  <button className="btn-banner-action" style={{ padding: "6px 12px", fontSize: "12px" }}>
                    Offer Internship
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}