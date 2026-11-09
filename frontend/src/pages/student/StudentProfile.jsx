import React, { useState } from "react";
import "./StudentPanel.css";

export default function StudentProfile() {
  const [profile, setProfile] = useState({
    name: "Sandra",
    email: "sandra.student@sunrise.edu",
    cohort: "Grade 10 - Science & AI Cohort",
    institution: "Sunrise Public School",
    sponsorTrack: "EcoTech Solutions Track",
    joinCode: "SUNRISE-2026",
    reminderDays: 3,
    notifications: true,
    aiHints: true,
  });

  const [inputCode, setInputCode] = useState("");
  const [codeMessage, setCodeMessage] = useState({ text: "", type: "" });
  const [saved, setSaved] = useState(false);

  // Verification lookup for Join Codes
  const handleVerifyCode = (e) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();

    if (!cleanCode) {
      setCodeMessage({ text: "⚠️ Please enter a valid access code.", type: "error" });
      return;
    }

    if (cleanCode.includes("SUNRISE")) {
      setProfile(prev => ({ ...prev, institution: "Sunrise Public School", joinCode: cleanCode }));
      setCodeMessage({ text: "✅ Successfully joined Sunrise Public School!", type: "success" });
      setInputCode("");
    } else if (cleanCode.includes("ECOTECH") || cleanCode.includes("CORP")) {
      setProfile(prev => ({ ...prev, sponsorTrack: "EcoTech Solutions Corporate Track", joinCode: cleanCode }));
      setCodeMessage({ text: "🚀 Successfully enrolled in EcoTech Corporate Track!", type: "success" });
      setInputCode("");
    } else {
      setCodeMessage({ text: "❌ Invalid code. Please check with your teacher or sponsor.", type: "error" });
    }

    setTimeout(() => setCodeMessage({ text: "", type: "" }), 4000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="inst-content-container">
      {/* 1. HERO BANNER */}
      <section 
        className="header-banner" 
        style={{ 
          background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", 
          marginBottom: "24px",
          borderRadius: "20px",
          padding: "24px 30px",
          color: "#fff"
        }}
      >
        <div className="banner-left">
          <div className="banner-subtitle" style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, marginBottom: '4px' }}>
            SETTINGS • LEARNER AFFILIATION
          </div>
          <h1 className="banner-title" style={{ fontSize: '24px', margin: 0, color: '#ffffff' }}>Student Profile & Access Tokens</h1>
          <div className="banner-subtitle" style={{ color: '#ede9fe', marginTop: '4px' }}>
            Manage your personal profile and redeem institution or company join codes to unlock exclusive challenges.
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* 2. JOIN INSTITUTION / COMPANY CARD */}
        <div 
          className="inst-card" 
          style={{ 
            padding: "28px", 
            borderRadius: "16px", 
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '24px' }}>🔑</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Join Institution or Track</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>Enter code provided by your school or company sponsor.</p>
            </div>
          </div>

          <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <input
                type="text"
                placeholder="e.g. SUNRISE-2026 or ECOTECH-PRO"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none", boxSizing: "border-box", textTransform: 'uppercase' }}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              style={{ padding: "10px", background: "#7c3aed", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
            >
              Verify & Connect Token ➔
            </button>

            {codeMessage.text && (
              <div style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 600, background: codeMessage.type === 'success' ? '#f0fdf4' : '#fef2f2', color: codeMessage.type === 'success' ? '#16a34a' : '#dc2626', border: `1px solid ${codeMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
                {codeMessage.text}
              </div>
            )}
          </form>

          {/* Current Verified Affiliations */}
          <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Affiliations</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{profile.institution}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Verified Institution</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '6px' }}>Verified ✓</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{profile.sponsorTrack}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Corporate Track</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 700, background: '#f3e8ff', color: '#7c3aed', padding: '2px 8px', borderRadius: '6px' }}>Enrolled 🚀</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. EDIT PROFILE SETTINGS */}
        <div 
          className="inst-card" 
          style={{ 
            padding: "28px", 
            borderRadius: "16px", 
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Account Details & Preferences</h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                Full Name
              </label>
              <input
                type="text"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none", background: "#f8fafc", boxSizing: "border-box" }}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
                Student Email
              </label>
              <input
                type="email"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "13.5px", outline: "none", background: "#f8fafc", boxSizing: "border-box" }}
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexDirection: "column" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={profile.notifications}
                  onChange={(e) => setProfile({ ...profile, notifications: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: "#7c3aed" }}
                />
                Email reminders for milestone deadlines
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={profile.aiHints}
                  onChange={(e) => setProfile({ ...profile, aiHints: e.target.checked })}
                  style={{ width: "16px", height: "16px", accentColor: "#7c3aed" }}
                />
                Show real-time AI critique hints during drafting
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                type="submit"
                style={{ 
                  padding: "10px 20px", 
                  background: "#7c3aed", 
                  color: "#ffffff", 
                  border: "none", 
                  borderRadius: "10px", 
                  fontWeight: 700, 
                  fontSize: "13px", 
                  cursor: "pointer"
                }}
              >
                Save Preferences
              </button>
              {saved && (
                <span style={{ color: "#16a34a", fontSize: "12.5px", fontWeight: 700 }}>
                  ✓ Updated!
                </span>
              )}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}