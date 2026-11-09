import React, { useState } from "react";
import "./StudentPanel.css";

export default function StudentPortfolio() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const portfolioProjects = [
    {
      id: 1,
      title: "Smart Campus Waste Tracking System",
      category: "Institution Project",
      sponsor: "Sunrise Public School & EcoTech Solutions",
      status: "Shortlisted for Incubation",
      score: "92/100",
      description: "An IoT-enabled sensor network designed to monitor bin capacity in real-time, reducing overflow and optimizing municipal pickup routes.",
      metrics: "420 Tokens • Phase 3 Complete",
      date: "Nov 12, 2026"
    },
    {
      id: 2,
      title: "Autonomous IoT Supply Route Optimizer",
      category: "Corporate Sponsored",
      sponsor: "EcoTech Solutions Corp",
      status: "In Evaluation",
      score: "88/100",
      description: "A machine learning pipeline applying SCAMPER ideation axioms to minimize transit fuel wastage and streamline logistics.",
      metrics: "680 Tokens • Phase 2 Active",
      date: "Nov 04, 2026"
    },
    {
      id: 3,
      title: "AI-Powered Library Book Finder",
      category: "Institution Project",
      sponsor: "Sunrise Academic Board",
      status: "Completed & Verified",
      score: "95/100",
      description: "A semantic search catalog built with vector embeddings to help students instantly locate academic resources across campus libraries.",
      metrics: "510 Tokens • Final Submission",
      date: "Oct 20, 2026"
    }
  ];

  const filteredProjects = portfolioProjects.filter(p => {
    if (activeFilter === "all") return true;
    if (activeFilter === "institution") return p.category.includes("Institution");
    if (activeFilter === "corporate") return p.category.includes("Corporate");
    return true;
  });

  return (
    <div className="inst-content-container">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: '12px', zIndex: 1000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', fontWeight: 600, fontSize: '13.5px', borderLeft: '4px solid #7c3aed' }}>
          {toastMessage}
        </div>
      )}

      {/* HERO BANNER */}
      <div 
        className="inst-welcome-banner" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          borderRadius: '20px',
          padding: '30px',
          color: '#fff',
          boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.3)',
          marginBottom: '24px'
        }}
      >
        <div style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, letterSpacing: '0.5px' }}>STUDENT WORKSPACE • INNOVATION PORTFOLIO</div>
        <h1 className="inst-title" style={{ color: '#ffffff', fontSize: '28px', fontWeight: 900, margin: 0 }}>My Innovation Portfolio</h1>
        <p className="inst-subtitle" style={{ color: '#ede9fe', margin: 0, fontSize: '13.5px', maxWidth: '600px', lineHeight: '1.5' }}>
          Showcasing your completed problem canvases, technical prototypes, and direct corporate sponsor invitations.
        </p>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { id: 'all', label: 'All Projects (3)' },
            { id: 'institution', label: 'Institution Tracks' },
            { id: 'corporate', label: 'Corporate Sponsored' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: activeFilter === tab.id ? '#7c3aed' : '#f1f5f9',
                color: activeFilter === tab.id ? '#ffffff' : '#475569',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>
          Showing {filteredProjects.length} verified items
        </span>
      </div>

      {/* PORTFOLIO GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {filteredProjects.map(proj => (
          <div 
            key={proj.id} 
            style={{ 
              background: '#ffffff', 
              border: '1px solid #e2e8f0', 
              borderRadius: '16px', 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, background: '#f3e8ff', color: '#7c3aed', padding: '4px 10px', borderRadius: '6px' }}>
                {proj.category}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '4px 8px', borderRadius: '6px' }}>
                ★ {proj.score}
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>{proj.title}</h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 10px 0' }}>Sponsor/School: <strong style={{ color: '#0f172a' }}>{proj.sponsor}</strong></p>
              <p style={{ fontSize: '13px', color: '#334155', margin: 0, lineHeight: '1.5' }}>{proj.description}</p>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
              <span>{proj.metrics}</span>
              <strong style={{ color: '#7c3aed' }}>{proj.status}</strong>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button 
                onClick={() => triggerToast(`📂 Inspecting project canvas for "${proj.title}"...`)}
                style={{ flex: 1, padding: '10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                View Canvas ➔
              </button>
              <button 
                onClick={() => triggerToast(`📄 Exporting portfolio artifact PDF for "${proj.title}"...`)}
                style={{ padding: '10px 14px', background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
              >
                PDF 📄
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}