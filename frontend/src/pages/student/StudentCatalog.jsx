import React, { useState } from "react";
import "./StudentPanel.css";

export default function StudentCatalog() {
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Student-focused form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    theme: "AI & Sustainability",
    targetAudience: "Students & Campus Staff",
    techStack: "React, FastAPI, Supabase",
    timelineWeeks: "4"
  });

  const [catalogItems, setCatalogItems] = useState([
    {
      id: 1,
      title: "Smart Campus Waste Tracking System",
      type: "Institution",
      xp: "+300 XP",
      desc: "Institution-assigned task to optimize waste segregation and recycling tracking across school zones.",
      sponsor: "Sunrise Public School • Grade 8–10"
    },
    {
      id: 2,
      title: "AI-Powered Automated Attendance",
      type: "Institution",
      xp: "+350 XP",
      desc: "Facial recognition integration for seamless morning homeroom logging.",
      sponsor: "Sunrise Public School • Grade 9–12"
    },
    {
      id: 3,
      title: "Autonomous Logistics & Supply Chain Route Optimizer",
      type: "Company Track",
      xp: "+500 XP",
      desc: "Company challenge to reduce urban fleet fuel consumption using predictive ML routing.",
      sponsor: "EcoTech Solutions • Grade 11–12"
    },
    {
      id: 4,
      title: "Personal Eco-Footprint Tracker",
      type: "Startup Idea",
      xp: "+450 XP",
      desc: "Build your own indie startup concept tracking daily personal carbon metrics.",
      sponsor: "Self-Driven • Open Level"
    }
  ]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      triggerToast("⚠️ Please enter a title for your startup idea.");
      return;
    }

    const newItem = {
      id: Date.now(),
      title: formData.title,
      type: "Startup Idea",
      xp: "+450 XP",
      desc: formData.description || "Self-driven indie startup concept workspace.",
      sponsor: "Self-Driven • Open Level"
    };

    setCatalogItems([newItem, ...catalogItems]);
    setIsModalOpen(false);
    triggerToast("🚀 Your startup idea workspace was created successfully!");
    
    setFormData({
      title: "",
      description: "",
      theme: "AI & Sustainability",
      targetAudience: "",
      techStack: "",
      timelineWeeks: "4"
    });
  };

  const filtered = catalogItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.desc.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || 
                        (filterType === "institution" && item.type === "Institution") ||
                        (filterType === "company" && item.type === "Company Track") ||
                        (filterType === "startup" && item.type === "Startup Idea");
    return matchesSearch && matchesType;
  });

  return (
    <div className="inst-content-container">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: '12px', zIndex: 3000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', fontWeight: 600, fontSize: '13.5px', borderLeft: '4px solid #7c3aed' }}>
          {toastMessage}
        </div>
      )}

      {/* STUDENT STARTUP IDEA CREATION MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '580px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0', boxSizing: 'border-box', maxHeight: '90vh', overflowY: 'auto' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>Create Your Startup Idea</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>Launch a self-driven project workspace to build and pitch your innovation.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Startup Project Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. AI Campus Energy Saver" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Problem Description */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Problem & Solution Overview</label>
                <textarea 
                  rows="3" 
                  placeholder="What problem are you solving and how does your solution work?" 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              {/* Theme & Target Audience */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Innovation Theme</label>
                  <select 
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="AI & Sustainability">AI & Sustainability</option>
                    <option value="Smart Campus & IoT">Smart Campus & IoT</option>
                    <option value="EdTech & Automation">EdTech & Automation</option>
                    <option value="Healthcare & Safety">Healthcare & Safety</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Target Audience</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Students & Faculty" 
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Tech Stack & Timeline */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Proposed Tech Stack</label>
                  <input 
                    type="text" 
                    placeholder="e.g. React, Python, FastAPI" 
                    value={formData.techStack}
                    onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Timeline (Weeks)</label>
                  <input 
                    type="number" 
                    value={formData.timelineWeeks}
                    onChange={(e) => setFormData({ ...formData, timelineWeeks: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  style={{ padding: '10px 22px', background: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13.5px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)' }}
                >
                  Launch Workspace ➔
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 1. HERO BANNER - PURPLE THEME */}
      <section className="header-banner" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", marginBottom: "24px" }}>
        <div className="banner-left">
          <div className="banner-subtitle" style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, marginBottom: '4px' }}>WORKSPACE • CHALLENGE CATALOG</div>
          <h1 className="banner-title">Challenge Catalog</h1>
          <div className="banner-subtitle">Explore verified institution assignments, join company-sponsored tracks, or launch your own startup idea.</div>
          <div className="banner-controls" style={{ marginTop: '16px' }}>
            <button 
              className="btn-banner-action" 
              onClick={() => setIsModalOpen(true)}
              style={{ background: "#ffffff", color: "#7c3aed", fontWeight: 700 }}
            >
              + Create My Own Idea
            </button>
          </div>
        </div>
      </section>

      {/* 2. FILTER TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setFilterType("all")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterType === "all" ? '#7c3aed' : '#ffffff', color: filterType === "all" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          All Challenges ({catalogItems.length})
        </button>
        <button 
          onClick={() => setFilterType("institution")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterType === "institution" ? '#7c3aed' : '#ffffff', color: filterType === "institution" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          Institution ({catalogItems.filter(i => i.type === "Institution").length})
        </button>
        <button 
          onClick={() => setFilterType("company")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterType === "company" ? '#7c3aed' : '#ffffff', color: filterType === "company" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          Company ({catalogItems.filter(i => i.type === "Company Track").length})
        </button>
        <button 
          onClick={() => setFilterType("startup")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterType === "startup" ? '#7c3aed' : '#ffffff', color: filterType === "startup" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          Startup Idea ({catalogItems.filter(i => i.type === "Startup Idea").length})
        </button>
      </div>

      {/* 3. SEARCH BAR */}
      <section className="dashboard-panel" style={{ padding: '16px', marginBottom: '24px' }}>
        <div className="search-input-wrapper" style={{ width: '100%', maxWidth: '100%' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            className="search-input-clean"
            placeholder="Search institution or company challenges..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* 4. CATALOG CARDS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filtered.map((item) => (
          <div key={item.id} className="inst-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid #e2e8f0', borderRadius: '16px', background: '#ffffff' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '8px', background: '#f3e8ff', color: '#7c3aed' }}>
                  {item.type}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a' }}>{item.xp}</span>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: '0 0 8px 0' }}>{item.title}</h3>
              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px 0' }}>{item.desc}</p>
            </div>
            
            <div>
              <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                Sponsor: <span style={{ fontWeight: 600, color: '#475569' }}>{item.sponsor}</span>
              </div>
              <button 
                onClick={() => triggerToast(`🚀 Enrolled in "${item.title}"!`)}
                style={{ width: '100%', padding: '10px', background: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                Enroll & Start →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}