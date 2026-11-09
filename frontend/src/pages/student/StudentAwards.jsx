import React, { useState } from "react";
import "./StudentPanel.css";

export default function StudentAwards() {
  const [studentBadges] = useState([
    { 
      id: 1, 
      title: "Top 5% Global Platform Innovator", 
      category: "Global Standing", 
      badgeIcon: "🏆", 
      code: "CERT-STU-8492-AX", 
      issued: "Nov 12, 2026", 
      issuer: "AI Innovation Committee",
      status: "Cryptographically Verified" 
    },
    { 
      id: 2, 
      title: "SCAMPER Mastermind Badge", 
      category: "AI Proficiency", 
      badgeIcon: "💡", 
      code: "CERT-STU-3910-SC", 
      issued: "Oct 29, 2026", 
      issuer: "Automated Evaluation Engine",
      status: "Cryptographically Verified" 
    },
    { 
      id: 3, 
      title: "EcoTech Sponsor Direct Access", 
      category: "Corporate Milestone", 
      badgeIcon: "🚀", 
      code: "CERT-STU-5521-ET", 
      issued: "Nov 03, 2026", 
      issuer: "EcoTech Solutions Corp",
      status: "Direct Sponsor Invite" 
    },
    { 
      id: 4, 
      title: "Problem Framing Pioneer", 
      category: "Phase 1 Milestone", 
      badgeIcon: "⭐", 
      code: "CERT-STU-1044-PF", 
      issued: "Oct 15, 2026", 
      issuer: "Sunrise Academic Board",
      status: "Cryptographically Verified" 
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleCopyHash = (code) => {
    navigator.clipboard.writeText(code);
    triggerToast(`📋 Cryptographic verification hash copied: ${code}`);
  };

  const handleDownloadPdf = (title) => {
    triggerToast(`📄 Generating secure PDF certificate for "${title}"...`);
  };

  const filtered = studentBadges.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.issuer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: '12px', zIndex: 1000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', fontWeight: 600, fontSize: '13.5px', borderLeft: '4px solid #7c3aed' }}>
          {toastMessage}
        </div>
      )}

      {/* 1. HERO BANNER */}
      <section className="header-banner" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)" }}>
        <div className="banner-left">
          <div className="banner-subtitle" style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, marginBottom: '4px' }}>INSIGHTS • SECURE CREDENTIAL VAULT</div>
          <h1 className="banner-title">Honors & Certificates</h1>
          <div className="banner-subtitle">4 verified credentials • 1 active corporate sponsor invitation</div>
          <p className="banner-desc">Inspect your blockchain-verifiable completion certificates, cryptographic hash signatures, and direct corporate milestone recognition.</p>
        </div>
      </section>

      {/* 2. CREATIVE STATUS HUB (REPLACES PLAIN STAT BOXES) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        
        {/* VAULT INTEGRITY CARD */}
        <div className="dashboard-panel" style={{ padding: '20px', background: 'linear-gradient(145deg, #ffffff 0%, #fcfaff 100%)', border: '1px solid #ede9fe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Vault Integrity</span>
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#f0fdf4', color: '#16a34a', padding: '3px 8px', borderRadius: '6px' }}>100% Secured</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>4 / 4 Verified</div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>All earned platform badges are backed by SHA-256 cryptographic hashes.</p>
        </div>

        {/* SPONSOR INVITE STATUS */}
        <div className="dashboard-panel" style={{ padding: '20px', background: 'linear-gradient(145deg, #ffffff 0%, #fcfaff 100%)', border: '1px solid #ede9fe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Corporate Access</span>
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#fef3c7', color: '#d97706', padding: '3px 8px', borderRadius: '6px' }}>Exclusive</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>1 Direct Invite</div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>EcoTech Solutions unlocked direct collaboration access based on your Phase 3 score.</p>
        </div>

        {/* COHORT PERCENTILE */}
        <div className="dashboard-panel" style={{ padding: '20px', background: 'linear-gradient(145deg, #ffffff 0%, #fcfaff 100%)', border: '1px solid #ede9fe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Global Standing</span>
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#f3e8ff', color: '#7c3aed', padding: '3px 8px', borderRadius: '6px' }}>Top Tier</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', marginBottom: '4px' }}>Top 5% Innovator</div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Ranked among top performing students across all active innovation tracks.</p>
        </div>

      </div>

      {/* 3. CREDENTIAL CARDS PANEL */}
      <section className="dashboard-panel">
        <div className="panel-header-row" style={{ marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: '260px', maxWidth: '380px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="text"
              className="search-input-clean"
              placeholder="Search credentials by title, issuer, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            {filtered.length} credentials shown
          </span>
        </div>

        {/* MODERN CARD GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filtered.map((badge) => (
            <div key={badge.id} style={{ border: '1px solid #e2e8f0', borderRadius: '16px', background: '#ffffff', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '36px' }}>{badge.badgeIcon}</span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#f3e8ff', color: '#7c3aed' }}>
                  {badge.category}
                </span>
              </div>

              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', lineHeight: '1.4' }}>{badge.title}</h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Issued by: <strong style={{ color: '#0f172a' }}>{badge.issuer}</strong></div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Date: <strong style={{ color: '#0f172a' }}>{badge.issued}</strong></div>
              </div>

              {/* HASH BOX WITH FUNCTIONAL COPY BUTTON */}
              <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #e2e8f0' }}>
                <code style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700, fontFamily: 'monospace' }}>
                  {badge.code}
                </code>
                <button 
                  onClick={() => handleCopyHash(badge.code)}
                  style={{ background: '#e2e8f0', border: 'none', color: '#334155', cursor: 'pointer', fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px' }}
                >
                  Copy
                </button>
              </div>

              {/* STATUS & DOWNLOAD BUTTON */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '4px 10px', borderRadius: '8px' }}>
                  ✓ {badge.status}
                </span>
              </div>

              <button 
                onClick={() => handleDownloadPdf(badge.title)}
                style={{ width: '100%', padding: '10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <span>Download Secure PDF</span> 📄
              </button>

            </div>
          ))}
        </div>
      </section>
    </>
  );
}