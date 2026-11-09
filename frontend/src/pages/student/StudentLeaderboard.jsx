import React, { useState } from "react";
import "./StudentPanel.css";

export default function StudentLeaderboard() {
  const [filterTab, setFilterTab] = useState("global");

  // Global Platform Learners Data
  const globalLeaders = [
    { rank: 1, name: "Aarav Bhat", school: "Sunrise Public School", projects: "6 Projects", xp: "1954 XP", aiScore: 92, badge: "Rank 1" },
    { rank: 2, name: "Sandra", school: "Sunrise Public School", projects: "4 Projects", xp: "1450 XP", aiScore: 88, badge: "Top 10%", isUser: true },
    { rank: 3, name: "Riya Sharma", school: "St. Xavier's High School", projects: "5 Projects", xp: "1380 XP", aiScore: 88, badge: "Vanguard" },
    { rank: 4, name: "Aditee Patil", school: "Sunrise Public School", projects: "4 Projects", xp: "1290 XP", aiScore: 86, badge: "Challenger" },
    { rank: 5, name: "Sandra D'Souza", school: "Greenwood International", projects: "3 Projects", xp: "1150 XP", aiScore: 82, badge: "Challenger" },
    { rank: 6, name: "Nyla Fernandes", school: "St. Xavier's High School", projects: "3 Projects", xp: "1040 XP", aiScore: 80, badge: "Active" },
    { rank: 7, name: "Karan Mehta", school: "Sunrise Public School", projects: "2 Projects", xp: "980 XP", aiScore: 78, badge: "Active" },
  ];

  // School Classmates Data (Sunrise Public School Only)
  const schoolLeaders = [
    { rank: 1, name: "Aarav Bhat", school: "Sunrise Public School • Grade 10", projects: "6 Projects", xp: "1954 XP", aiScore: 92, badge: "School #1" },
    { rank: 2, name: "Sandra", school: "Sunrise Public School • Grade 10", projects: "4 Projects", xp: "1450 XP", aiScore: 88, badge: "School #2", isUser: true },
    { rank: 3, name: "Aditee Patil", school: "Sunrise Public School • Grade 10", projects: "4 Projects", xp: "1290 XP", aiScore: 86, badge: "School #3" },
    { rank: 4, name: "Karan Mehta", school: "Sunrise Public School • Grade 9", projects: "2 Projects", xp: "980 XP", aiScore: 78, badge: "Active" },
  ];

  // Weekly Gain Data
  const weeklyLeaders = [
    { rank: 1, name: "Sandra", school: "Sunrise Public School", projects: "+320 XP this week", xp: "1450 XP", aiScore: 88, badge: "🔥 Weekly Leader", isUser: true },
    { rank: 2, name: "Aarav Bhat", school: "Sunrise Public School", projects: "+280 XP this week", xp: "1954 XP", aiScore: 92, badge: "Runner Up" },
    { rank: 3, name: "Riya Sharma", school: "St. Xavier's High School", projects: "+210 XP this week", xp: "1380 XP", aiScore: 88, badge: "Fast Mover" },
  ];

  const getDisplayedLeaders = () => {
    if (filterTab === "school") return schoolLeaders;
    if (filterTab === "week") return weeklyLeaders;
    return globalLeaders;
  };

  const activeList = getDisplayedLeaders();
  const userRank = activeList.find(l => l.isUser)?.rank || 2;

  return (
    <div className="inst-content-container">
      
      {/* 1. HERO BANNER - PURPLE THEME */}
      <section className="header-banner" style={{ background: "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)", marginBottom: "24px" }}>
        <div className="banner-left" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="banner-subtitle" style={{ fontSize: '11px', fontWeight: '700', opacity: 0.8, marginBottom: '4px' }}>INSIGHTS • STUDENT LEADERBOARD</div>
            <h1 className="banner-title">Student Standings</h1>
            <div className="banner-subtitle">See how your XP, project progress, and AI evaluation scores compare against fellow learners.</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '10px 18px', borderRadius: '12px', backdropFilter: 'blur(4px)', fontSize: '13.5px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.2)' }}>
            🏆 Your Rank: #{userRank}
          </div>
        </div>
      </section>

      {/* 2. FILTER TABS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setFilterTab("global")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterTab === "global" ? '#7c3aed' : '#ffffff', color: filterTab === "global" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          🌐 All Platform Students
        </button>
        <button 
          onClick={() => setFilterTab("school")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterTab === "school" ? '#7c3aed' : '#ffffff', color: filterTab === "school" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          🏫 Sunrise School Classmates
        </button>
        <button 
          onClick={() => setFilterTab("week")}
          style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: filterTab === "week" ? '#7c3aed' : '#ffffff', color: filterTab === "week" ? '#ffffff' : '#475569', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          ⚡ Weekly Progress
        </button>
      </div>

      {/* 3. LEADERBOARD LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeList.map((leader) => (
          <div 
            key={leader.rank} 
            className="inst-card" 
            style={{ 
              padding: '20px 24px', 
              border: leader.isUser ? '2px solid #7c3aed' : '1px solid #e2e8f0', 
              borderRadius: '16px', 
              background: leader.isUser ? '#f3e8ff' : '#ffffff', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '800', 
                color: leader.rank === 1 ? '#d97706' : leader.rank === 2 ? '#7c3aed' : '#64748b',
                width: '32px',
                textAlign: 'center'
              }}>
                #{leader.rank}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '2px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{leader.name}</h3>
                  {leader.isUser && (
                    <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: '#7c3aed', color: '#ffffff' }}>
                      You
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12.5px', color: '#64748b' }}>
                  {leader.school} • <strong style={{ color: '#475569' }}>{leader.projects}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#7c3aed' }}>{leader.xp}</div>
                <div style={{ fontSize: '11.5px', color: '#64748b' }}>Avg AI Score: <strong style={{ color: '#0f172a' }}>{leader.aiScore}/100</strong></div>
              </div>
              <span style={{ 
                fontSize: '12px', 
                fontWeight: '700', 
                padding: '6px 14px', 
                borderRadius: '10px', 
                background: leader.rank === 1 ? '#fef3c7' : '#f1f5f9', 
                color: leader.rank === 1 ? '#d97706' : '#475569',
                border: '1px solid #e2e8f0'
              }}>
                {leader.badge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}