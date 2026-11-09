import React, { useState } from 'react';

export default function StudentDashboard({ stats, assignedChallenges, onNavigate }) {
  const [toastMessage, setToastMessage] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Richer Mock Data for Dashboard Features
  const recentActivity = [
    {
      id: 1,
      icon: "🤖",
      iconBg: "#f3e8ff",
      title: "AI Evaluation Completed",
      subtitle: "Smart Library Book Finder • Scored 88/100 (Shortlisted)",
      time: "2 hours ago"
    },
    {
      id: 2,
      icon: "🏆",
      iconBg: "#f0fdf4",
      title: "Unlocked 'Canvas Pioneer' Badge",
      subtitle: "Completed Phase 1 Problem Canvas on first attempt • +100 XP",
      time: "Yesterday"
    },
    {
      id: 3,
      icon: "📝",
      iconBg: "#eff6ff",
      title: "New Milestone Assigned",
      subtitle: "AI-Powered Automated Attendance Tracker • Phase 1 Started",
      time: "3 days ago"
    }
  ];

  const skillBreakdown = [
    { name: "Problem Framing & Canvas", score: 90, color: "#7c3aed" },
    { name: "Ideation & Feasibility", score: 78, color: "#7c3aed" },
    { name: "Technical Execution", score: 82, color: "#16a34a" },
    { name: "AI Review Consistency", score: 88, color: "#2563eb" }
  ];

  const badges = [
    { id: 1, icon: "🚀", title: "First Launch", desc: "Joined Platform", unlocked: true },
    { id: 2, icon: "🧠", title: "AI Master", desc: "Scored 85+", unlocked: true },
    { id: 3, icon: "⚡", title: "Fast Submission", desc: "48h Early", unlocked: true },
    { id: 4, icon: "🔥", title: "Streak Keeper", desc: "5 Days Active", unlocked: true },
    { id: 5, icon: "🛡️", title: "Quality Code", desc: "Zero Errors", unlocked: false }
  ];

  const defaultChallenges = assignedChallenges && assignedChallenges.length > 0 ? assignedChallenges : [
    { id: 101, type: "Institution Assigned", title: "Smart Campus Waste Tracking System", deadline: "In 3 days", phase: "Phase 3: Idea Evaluation" },
    { id: 102, type: "Company Sponsored", title: "Autonomous IoT Supply Route Optimizer", deadline: "In 6 days", phase: "Phase 2: SCAMPER Ideation" }
  ];

  const defaultStats = stats || { assignedCount: 3, completedCount: 5, avgAiScore: 88, earnedXp: 1450 };

  return (
    <div className="inst-content-container">
      
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0f172a', color: '#fff', padding: '12px 20px', borderRadius: '12px', zIndex: 1000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', fontWeight: 600, fontSize: '13.5px', borderLeft: '4px solid #7c3aed' }}>
          {toastMessage}
        </div>
      )}

      {/* 1. Integrated XP Progress Header Banner (Purple Theme) */}
      <div 
        className="inst-welcome-banner" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="inst-title" style={{ color: '#ffffff' }}>Student Dashboard</h1>
            <p className="inst-subtitle" style={{ color: '#ede9fe' }}>Track your active tasks, progress metrics, and upcoming challenge deadlines.</p>
          </div>
          <div className="inst-badge-pill" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>🔥 Level 3 Learner</div>
        </div>

        {/* Live XP Progress Track */}
        <div style={{ width: '100%', background: 'rgba(0,0,0,0.15)', borderRadius: '10px', padding: '10px 14px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', marginBottom: '6px', color: '#fff' }}>
            <span>Level 3 Progression</span>
            <span>1,450 / 2,000 XP (550 XP to Level 4)</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.25)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '72.5%', height: '100%', background: '#ffffff', borderRadius: '4px', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Action Button for Catalog */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              if (onNavigate) onNavigate('Catalog');
              else triggerToast("📂 Navigating to Challenge Catalog...");
            }}
            style={{ padding: '8px 16px', background: '#ffffff', color: '#7c3aed', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
          >
            Explore catalog ➔
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="inst-stats-grid">
        <div className="inst-card">
          <span className="inst-stat-label">Assigned Challenges</span>
          <h3 className="inst-stat-value">{defaultStats.assignedCount}</h3>
          <span className="inst-stat-sub" style={{ color: '#7c3aed' }}>2 due this week</span>
        </div>
        <div className="inst-card">
          <span className="inst-stat-label">Completed Projects</span>
          <h3 className="inst-stat-value">{defaultStats.completedCount}</h3>
          <span className="inst-stat-sub" style={{ color: '#16a34a' }}>100% success rate</span>
        </div>
        <div className="inst-card">
          <span className="inst-stat-label">Average AI Score</span>
          <h3 className="inst-stat-value">{defaultStats.avgAiScore}/100</h3>
          <span className="inst-stat-sub" style={{ color: '#2563eb' }}>Top 10% rank</span>
        </div>
        <div className="inst-card">
          <span className="inst-stat-label">Earned XP</span>
          <h3 className="inst-stat-value">{defaultStats.earnedXp}</h3>
          <span className="inst-stat-sub" style={{ color: '#9333ea' }}>+250 XP today</span>
        </div>
      </div>

      {/* 3. Urgent Deadline Alert Box */}
      <div style={{ 
        background: '#f3e8ff', 
        border: '1px solid #e9d5ff', 
        padding: '16px 20px', 
        borderRadius: '14px', 
        marginBottom: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '22px' }}>⏳</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '14px', color: '#6b21a8', fontWeight: '700' }}>Next Submission Due Soon!</h4>
            <p style={{ margin: 0, fontSize: '12.5px', color: '#581c87' }}>Smart Campus Waste Tracking System is due in <strong>3 days</strong>.</p>
          </div>
        </div>
        <button className="inst-btn inst-btn--primary" onClick={() => { if (onNavigate) onNavigate('Projects'); else triggerToast("Navigating to projects..."); }}>Jump In</button>
      </div>

      {/* 4. Assigned to Me List */}
      <h2 className="inst-section-title">📌 Assigned to Me</h2>
      <div className="inst-list-container" style={{ marginBottom: '32px' }}>
        {defaultChallenges.map(item => (
          <div key={item.id} className="inst-list-item">
            <div>
              <span className="inst-pill-tag" style={{ background: '#f3e8ff', color: '#7c3aed' }}>{item.type}</span>
              <h4 className="inst-item-title">{item.title}</h4>
              <p className="inst-item-sub">Due: {item.deadline} • {item.phase}</p>
            </div>
            <button className="inst-btn inst-btn--primary" onClick={() => { if (onNavigate) onNavigate('Projects'); else triggerToast("Continuing work..."); }}>Continue Work</button>
          </div>
        ))}
      </div>

      {/* 5. Two-Column Grid: Skill Breakdown & Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        {/* Left Column: AI Skill Breakdown */}
        <div>
          <h2 className="inst-section-title">📊 Skill Breakdown</h2>
          <div className="inst-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {skillBreakdown.map((skill, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                    <span>{skill.name}</span>
                    <span>{skill.score}%</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: '#f1f5f9', borderRadius: '4px' }}>
                    <div style={{ width: `${skill.score}%`, height: '100%', background: skill.color, borderRadius: '4px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Activity Feed */}
        <div>
          <h2 className="inst-section-title">⚡ Recent Activity</h2>
          <div className="inst-list-container">
            {recentActivity.map(act => (
              <div key={act.id} className="inst-list-item" style={{ padding: '14px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: act.iconBg, padding: '8px 10px', borderRadius: '10px', fontSize: '18px' }}>{act.icon}</div>
                  <div>
                    <h4 className="inst-item-title" style={{ margin: '0 0 2px 0', fontSize: '13.5px' }}>{act.title}</h4>
                    <p className="inst-item-sub" style={{ fontSize: '11.5px' }}>{act.subtitle}</p>
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', whiteSpace: 'nowrap' }}>{act.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 6. Earned Badges Row */}
      <h2 className="inst-section-title">🎖️ Earned Badges</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {badges.map(b => (
          <div 
            key={b.id} 
            className="inst-card" 
            style={{ 
              textAlign: 'center', 
              padding: '16px', 
              opacity: b.unlocked ? 1 : 0.45,
              border: b.unlocked ? '1px solid #e9d5ff' : '1px solid #e2e8f0',
              background: b.unlocked ? '#ffffff' : '#f8fafc'
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{b.icon}</div>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', display: 'block' }}>{b.title}</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>{b.desc}</span>
          </div>
        ))}
      </div>

    </div>
  );
}