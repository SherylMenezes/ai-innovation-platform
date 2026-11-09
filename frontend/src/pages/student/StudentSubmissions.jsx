import React, { useState } from "react";
import "./StudentPanel.css";

import StickerArt from "./StickerArt";
import submissionMascotImage from "./institute-assignments.webp";

export default function StudentSubmissions() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [toastMessage, setToastMessage] = useState("");

  const [submissions, setSubmissions] = useState([
    {
      id: 1,
      title: "Smart Campus Waste Tracking System",
      track: "Institution Assignment",
      submittedDate: "Nov 4, 2026",
      status: "Evaluated",
      score: "92/100",
      aiFeedback: "Excellent data schema and modular separation. Consider optimizing your FastAPI routing endpoints for faster payload response times."
    },
    {
      id: 2,
      title: "AI-Powered Automated Attendance",
      track: "Institution Assignment",
      submittedDate: "Nov 1, 2026",
      status: "Evaluated",
      score: "85/100",
      aiFeedback: "Strong facial recognition workflow integration. UI states handle loading states smoothly, though error handling for webcam permissions can be refined."
    },
    {
      id: 3,
      title: "Autonomous Logistics & Supply Chain Route Optimizer",
      track: "Company Track",
      submittedDate: "Pending Submission",
      status: "In Progress",
      score: "-",
      aiFeedback: "Draft stage. Complete your milestone documentation and run your test suite before final submission."
    }
  ]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const filtered = submissions.filter(item => {
    if (filterStatus === "all") return true;
    if (filterStatus === "evaluated") return item.status === "Evaluated";
    if (filterStatus === "progress") return item.status === "In Progress";
    return true;
  });

  return (
    <div className="inst-content-container">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: '12px', zIndex: 3000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', fontWeight: 600, fontSize: '13.5px', borderLeft: '4px solid #7c3aed' }}>
          {toastMessage}
        </div>
      )}

      {/* 1. HERO BANNER WITH SUBMISSIONS MASCOT STICKER */}
      <section 
        className="header-banner" 
        style={{ 
          background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", 
          marginBottom: "24px",
          position: "relative",
          overflow: "visible",
          borderRadius: "18px",
          padding: "24px 280px 24px 32px",
          color: "white",
          minHeight: "180px",
          boxSizing: 'border-box'
        }}
      >
        <div className="banner-left" style={{ zIndex: 2 }}>
          <div className="banner-subtitle" style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, marginBottom: '4px' }}>WORKSPACE • SUBMISSIONS & FEEDBACK</div>
          <h1 className="banner-title" style={{ color: '#fff', fontSize: '24px', fontWeight: 700, margin: '0 0 6px 0' }}>Submissions & AI Evaluation</h1>
          <div className="banner-subtitle" style={{ color: '#ede9fe', fontSize: '13.5px', margin: '0 0 14px 0' }}>Track your project milestones, review automated AI grading feedback, and monitor your score progression.</div>
          <div className="banner-controls" style={{ marginTop: '16px' }}>
            <button 
              className="btn-banner-action" 
              onClick={() => triggerToast("📂 Ready to upload new project milestone files.")}
              style={{ background: "#ffffff", color: "#7c3aed", fontWeight: 700, padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              + Submit New Milestone
            </button>
          </div>
        </div>

        {/* Interactive Submissions Mascot Sticker */}
        <StickerArt 
          src={submissionMascotImage} 
          baseRotate={2} 
          style={{ 
            position: 'absolute', 
            right: '36px', 
            bottom: '-12px', 
            width: '220px' 
          }} 
        />
      </section>

      {/* 2. FILTER TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setFilterStatus("all")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterStatus === "all" ? '#7c3aed' : '#ffffff', color: filterStatus === "all" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          All Submissions ({submissions.length})
        </button>
        <button 
          onClick={() => setFilterStatus("evaluated")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterStatus === "evaluated" ? '#7c3aed' : '#ffffff', color: filterStatus === "evaluated" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          Evaluated ({submissions.filter(i => i.status === "Evaluated").length})
        </button>
        <button 
          onClick={() => setFilterStatus("progress")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterStatus === "progress" ? '#7c3aed' : '#ffffff', color: filterStatus === "progress" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          In Progress ({submissions.filter(i => i.status === "In Progress").length})
        </button>
      </div>

      {/* 3. SUBMISSIONS CARDS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.map((item) => (
          <div key={item.id} className="inst-card" style={{ padding: '24px', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed' }}>
                    {item.track}
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', background: item.status === 'Evaluated' ? '#dcfce7' : '#fef9c3', color: item.status === 'Evaluated' ? '#16a34a' : '#ca8a04' }}>
                    {item.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{item.title}</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Submitted on: {item.submittedDate}</span>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block' }}>AI Score</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: item.status === 'Evaluated' ? '#16a34a' : '#94a3b8' }}>{item.score}</span>
              </div>
            </div>

            {/* AI Feedback Box */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🤖 Automated AI Evaluation & Recommendations</span>
              </div>
              <p style={{ fontSize: '13.5px', color: '#334155', margin: '0', lineHeight: '1.5' }}>
                {item.aiFeedback}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => triggerToast(`📥 Downloading evaluation report for "${item.title}"`)}
                style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                Download Report
              </button>
              <button 
                onClick={() => triggerToast(`🔍 Opening detailed rubric for "${item.title}"`)}
                style={{ padding: '8px 16px', background: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                View Full Rubric →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}