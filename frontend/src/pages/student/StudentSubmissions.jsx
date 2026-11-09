import React, { useState } from "react";
import "./StudentPanel.css";

export default function StudentSubmissions() {
  const [filterTab, setFilterTab] = useState("all");

  const submissions = [
    {
      id: 1,
      phase: "Phase 3: Idea Evaluation",
      submittedDate: "Submitted Nov 10, 2026",
      sponsor: "EcoTech Solutions",
      title: "Smart Campus Waste Tracking System",
      framing: "95%",
      feasibility: "90%",
      innovation: "91%",
      score: 92,
      status: "Shortlisted",
      feedback: "Exceptional problem framing and feasibility matrix. Sensor placement logistics for campus collection bins should be further clarified in Phase 4."
    },
    {
      id: 2,
      phase: "Phase 4: Submit Project",
      submittedDate: "Submitted Nov 02, 2026",
      sponsor: "EcoTech Solutions",
      title: "Personal Eco-Footprint Tracker App",
      framing: "98%",
      feasibility: "94%",
      innovation: "96%",
      score: 96,
      status: "Invite Received",
      feedback: "Top 5% score across platform submissions! EcoTech Solutions has sent a direct collaboration invitation for prototype funding."
    },
    {
      id: 3,
      phase: "Phase 1: Problem Canvas",
      submittedDate: "Submitted Oct 24, 2026",
      sponsor: "Sunrise Public School",
      title: "AI-Powered Automated Attendance Tracker",
      framing: "88%",
      feasibility: "82%",
      innovation: "82%",
      score: 84,
      status: "Approved",
      feedback: "Solid foundation for automated logging. Ensure student biometric privacy constraints are thoroughly documented during Phase 2 ideation."
    }
  ];

  const filtered = submissions.filter(sub => {
    if (filterTab === "all") return true;
    if (filterTab === "invites" && sub.status === "Invite Received") return true;
    if (filterTab === "shortlisted" && sub.status === "Shortlisted") return true;
    if (filterTab === "approved" && sub.status === "Approved") return true;
    return false;
  });

  return (
    <div className="inst-content-container">
      {/* 1. HERO BANNER - PURPLE THEME */}
      <section className="header-banner" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", marginBottom: "24px" }}>
        <div className="banner-left" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="banner-subtitle" style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, marginBottom: '4px' }}>WORKSPACE • SUBMISSIONS & FEEDBACK</div>
            <h1 className="banner-title">Submissions & AI Feedback</h1>
            <div className="banner-subtitle">Review evaluation scorecards, AI critique reports, and corporate collaboration updates.</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '10px 18px', borderRadius: '12px', backdropFilter: 'blur(4px)', fontSize: '13.5px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.2)' }}>
            ✨ 4 Evaluated Milestones
          </div>
        </div>
      </section>

      {/* 2. FILTER TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setFilterTab("all")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterTab === "all" ? '#7c3aed' : '#ffffff', color: filterTab === "all" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          All Submissions ({submissions.length})
        </button>
        <button 
          onClick={() => setFilterTab("invites")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterTab === "invites" ? '#7c3aed' : '#ffffff', color: filterTab === "invites" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          🚀 Invites Received
        </button>
        <button 
          onClick={() => setFilterTab("shortlisted")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterTab === "shortlisted" ? '#7c3aed' : '#ffffff', color: filterTab === "shortlisted" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          ★ Shortlisted
        </button>
        <button 
          onClick={() => setFilterTab("approved")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterTab === "approved" ? '#7c3aed' : '#ffffff', color: filterTab === "approved" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          ✅ Approved
        </button>
      </div>

      {/* 3. SUBMISSIONS FEED LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filtered.map((sub) => (
          <div key={sub.id} className="inst-card" style={{ padding: '24px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11.5px', fontWeight: '700', padding: '3px 10px', borderRadius: '6px', background: '#f3e8ff', color: '#7c3aed' }}>
                    {sub.phase}
                  </span>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{sub.submittedDate} • Sponsor: <strong style={{ color: '#475569' }}>{sub.sponsor}</strong></span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{sub.title}</h3>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#16a34a' }}>{sub.score}<span style={{ fontSize: '12px', color: '#94a3b8' }}>/100</span></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#475569', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '10px 0' }}>
              <div>Problem Framing: <strong style={{ color: '#0f172a' }}>{sub.framing}</strong></div>
              <div>Feasibility: <strong style={{ color: '#0f172a' }}>{sub.feasibility}</strong></div>
              <div>Innovation: <strong style={{ color: '#0f172a' }}>{sub.innovation}</strong></div>
            </div>

            <div style={{ background: '#fdf4ff', border: '1px solid #f5d0fe', borderRadius: '12px', padding: '14px 18px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '18px' }}>🤖</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#7c3aed', marginBottom: '2px' }}>AI Evaluator Feedback</div>
                <p style={{ fontSize: '13px', color: '#581c87', margin: 0, lineHeight: '1.5' }}>{sub.feedback}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}