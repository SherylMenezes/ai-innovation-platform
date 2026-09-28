import React from "react";
import "./LandingPage.css";

export default function LandingPage({ onGetStarted, onLogin }) {
  const features = [
    {
      icon: "🎯",
      theme: "icon-blue",
      title: "Real-World Challenges",
      desc: "Tackle verified problems across healthcare, sustainability, agriculture, and finance."
    },
    {
      icon: "🧠",
      theme: "icon-purple",
      title: "4-Level Framework",
      desc: "Progress step-by-step from Problem Canvas to Ideation, Evaluation, and Project Delivery."
    },
    {
      icon: "🏆",
      theme: "icon-amber",
      title: "Gamified Growth",
      desc: "Earn XP, unlock achievement badges, and climb ranks from Explorer to Innovation Lead."
    },
    {
      icon: "🚀",
      theme: "icon-green",
      title: "AI Co-Pilot",
      desc: "Leverage intelligent feedback loops and structured evaluations to sharpen your ideas."
    }
  ];

  return (
    <div className="landing-container">
      {/* Top Floating Glass Navigation */}
      <header className="landing-nav">
        <div className="landing-brand">
          <span>AI Innovation Platform</span>
        </div>
        <div className="landing-nav-actions">
          <button type="button" className="btn-secondary" onClick={onLogin}>
            Log In
          </button>
          <button type="button" className="btn-primary" onClick={onGetStarted}>
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-pill">
          Empowering the Next Wave of Problem Solvers
        </div>
        <h1 className="landing-title">
          Turn Bold Challenges into <span className="landing-title-gradient">Impactful Solutions</span>
        </h1>
        <p className="landing-subtitle">
          An enterprise-grade innovation playground designed to guide you through ideation, 
          evaluation, and structured execution with AI-powered coaching.
        </p>

        <div className="landing-cta-group">
          <button type="button" className="btn-primary btn-hero-lg" onClick={onGetStarted}>
            Explore Challenges →
          </button>
          <button type="button" className="btn-secondary btn-hero-lg" onClick={onLogin}>
            Sign In to Dashboard
          </button>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="landing-features">
        {features.map((f, i) => (
          <div key={i} className="landing-feature-card">
            <div className={`feature-icon-wrapper ${f.theme}`}>
              {f.icon}
            </div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}