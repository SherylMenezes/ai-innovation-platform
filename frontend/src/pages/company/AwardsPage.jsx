// frontend/src/pages/company/pages/AwardsPage.jsx
import React, { useState } from "react";
import "./CompanyPanel.css";
import { mockCompanyAwards, mockCompanyChallenges } from "./mockData";

export default function AwardsPage() {
  const [awards, setAwards] = useState(mockCompanyAwards || []);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  
  const [newAward, setNewAward] = useState({
    title: "",
    award_type: "Grand Prize & Internship",
    challenge_title: "Autonomous Agents in Cold-Chain Logistics",
    recipient: "",
    institution: "",
    reward_amount: "₹2,50,000"
  });

  // Safe helper to extract award category string
  const getAwardType = (aw) => aw?.award_type || aw?.awardType || "Award";

  const countAll = awards.length;
  const countGrandPrize = awards.filter((a) =>
    getAwardType(a).toLowerCase().includes("grand")
  ).length;
  const countInternships = awards.filter((a) => {
    const t = getAwardType(a).toLowerCase();
    return t.includes("interview") || t.includes("internship");
  }).length;

  const filtered = awards.filter((a) => {
    const typeStr = getAwardType(a).toLowerCase();
    const recipientStr = (a.recipient || a.recipientName || "").toLowerCase();
    const titleStr = (a.title || "").toLowerCase();
    const instStr = (a.institution || "").toLowerCase();
    const q = searchTerm.toLowerCase();

    const matchSearch =
      titleStr.includes(q) || recipientStr.includes(q) || instStr.includes(q);

    let matchType = true;
    if (filterType === "grand") matchType = typeStr.includes("grand");
    if (filterType === "internship") {
      matchType = typeStr.includes("interview") || typeStr.includes("internship");
    }

    return matchSearch && matchType;
  });

  const handleIssueAward = (e) => {
    e.preventDefault();
    const created = {
      id: Date.now(),
      awardType: newAward.award_type,
      award_type: newAward.award_type,
      challengeTitle: newAward.challenge_title,
      recipient: newAward.recipient,
      recipientName: newAward.recipient,
      institution: newAward.institution || "Recognized Partner College",
      rewardAmount: newAward.reward_amount,
      certificateCode: `ACME-WINNER-${Math.floor(1000 + Math.random() * 9000)}`,
      certificate_code: `ACME-WINNER-${Math.floor(1000 + Math.random() * 9000)}`,
      issuedAt: "Just now",
      issued_at: "Just now"
    };
    setAwards([created, ...awards]);
    setShowModal(false);
    setNewAward({
      title: "",
      award_type: "Grand Prize & Internship",
      challenge_title: "Autonomous Agents in Cold-Chain Logistics",
      recipient: "",
      institution: "",
      reward_amount: "₹2,50,000"
    });
  };

  return (
    <div className="page-container">
      {/* 1. SUB-PAGE BANNER */}
      <section className="subpage-banner">
        <div className="banner-left">
          <div className="banner-breadcrumb">RECOGNITION • ACME INNOVATIONS CORP</div>
          <h1 className="subpage-banner-title">Awards & Grants Management</h1>
          <div className="banner-metric-pill-text">
            {countAll} declared awards • Industry-backed credentials
          </div>
          <p className="subpage-banner-desc">
            Declare challenge winners, grant corporate stipends, offer fast-track internships, and issue verified certificates.
          </p>

          <div className="subpage-banner-actions">
            <button className="btn-banner-hollow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
              Certificate Templates
            </button>
            <button className="btn-banner-solid" onClick={() => setShowModal(true)}>
              + Declare Winner
            </button>
          </div>
        </div>
      </section>

      {/* 2. MINI DASHBOARD CARDS */}
      <section className="mini-dashboard-grid">
        <div
          className={`mini-dash-card ${filterType === "all" ? "active" : ""}`}
          onClick={() => setFilterType("all")}
        >
          <div className="mini-dash-tile blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" />
              <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Total Declared</span>
            <div className="mini-dash-value">{countAll}</div>
            <span className="mini-dash-subtext">Issued awards</span>
          </div>
        </div>

        <div
          className={`mini-dash-card ${filterType === "grand" ? "active" : ""}`}
          onClick={() => setFilterType("grand")}
        >
          <div className="mini-dash-tile green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Grand Prizes</span>
            <div className="mini-dash-value">{countGrandPrize}</div>
            <span className="mini-dash-subtext">Cash prizes + trophy</span>
          </div>
        </div>

        <div
          className={`mini-dash-card ${filterType === "internship" ? "active" : ""}`}
          onClick={() => setFilterType("internship")}
        >
          <div className="mini-dash-tile yellow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Internship Offers</span>
            <div className="mini-dash-value">{countInternships}</div>
            <span className="mini-dash-subtext">Talent fast-tracked</span>
          </div>
        </div>

        <div className="mini-dash-card">
          <div className="mini-dash-tile gray">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <path d="M3 9h18" />
            </svg>
          </div>
          <div className="mini-dash-info">
            <span className="mini-dash-label">Verified PDFs</span>
            <div className="mini-dash-value">100%</div>
            <span className="mini-dash-subtext">Supabase Storage</span>
          </div>
        </div>
      </section>

      {/* 3. TABLE VIEW */}
      <div className="data-card">
        <div className="table-filter-header">
          <div className="search-input-wrapper">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className="search-input-clean"
              placeholder="Search awards by title, winner, or university..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span className="count-badge">{filtered.length} credentials</span>
        </div>

        <table className="perf-table">
          <thead>
            <tr>
              <th>Award Category</th>
              <th>Challenge Brief</th>
              <th>Recipient Team / Candidate</th>
              <th>Institution</th>
              <th>Prize / Reward</th>
              <th>Certificate Hash</th>
              <th>Issued</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((aw) => {
              const displayType = (getAwardType(aw) || "").replace(/_/g, " ");
              const recipientName = aw.recipient || aw.recipientName || "Recipient";
              const certCode = aw.certificateCode || aw.certificate_code || "CERT-PENDING";
              const issuedDate = aw.issuedAt || aw.issued_at || "Recent";
              const reward = aw.rewardAmount || aw.reward_amount || "Trophy";

              return (
                <tr key={aw.id}>
                  <td>
                    <span
                      className="code-pill"
                      style={{
                        background: "#EFF6FF",
                        color: "#1D58D8",
                        fontWeight: 800,
                        textTransform: "capitalize"
                      }}
                    >
                      {displayType}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700, color: "var(--theme-navy)", fontSize: "12.5px" }}>
                    {aw.challengeTitle || "Enterprise Innovation Sprint"}
                  </td>
                  <td style={{ fontWeight: 800, color: "var(--theme-navy)" }}>{recipientName}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{aw.institution || "Partner College"}</td>
                  <td>
                    <span style={{ fontWeight: 800, color: "#059669" }}>{reward}</span>
                  </td>
                  <td>
                    <code className="code-pill" style={{ background: "#F1F5F9", color: "var(--theme-navy)" }}>
                      {certCode}
                    </code>
                  </td>
                  <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{issuedDate}</td>
                  <td>
                    <button className="action-link">Download PDF 📄</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 4. DECLARE WINNER MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Declare Winner & Issue Award</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleIssueAward}>
              <div className="form-group">
                <label>Select Challenge</label>
                <select
                  className="form-select"
                  value={newAward.challenge_title}
                  onChange={(e) => setNewAward({ ...newAward, challenge_title: e.target.value })}
                >
                  {(mockCompanyChallenges || []).map((c) => (
                    <option key={c.id} value={c.title}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Award Classification</label>
                <select
                  className="form-select"
                  value={newAward.award_type}
                  onChange={(e) => setNewAward({ ...newAward, award_type: e.target.value })}
                >
                  <option value="Grand Prize & Internship">Grand Prize & Corporate Internship</option>
                  <option value="Fast-Track R&D Interview">Fast-Track R&D Technical Interview</option>
                  <option value="Innovation Cash Grant">Innovation Cash Grant</option>
                  <option value="Certificate of Excellence">Certificate of Excellence</option>
                </select>
              </div>

              <div className="form-group">
                <label>Recipient Squad or Candidate Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alpha Squad (Devansh Mehta)"
                  className="form-input"
                  value={newAward.recipient}
                  onChange={(e) => setNewAward({ ...newAward, recipient: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Recipient College / Institution</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PCCE Verna"
                  className="form-input"
                  value={newAward.institution}
                  onChange={(e) => setNewAward({ ...newAward, institution: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Prize / Stipend Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₹2,50,000 + 6-Month AI Internship"
                  className="form-input"
                  value={newAward.reward_amount}
                  onChange={(e) => setNewAward({ ...newAward, reward_amount: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Generate Certificate & Notify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}