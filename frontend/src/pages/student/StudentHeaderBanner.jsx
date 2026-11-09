import React from "react";
import StickerArt from "./StickerArt";
import mascotImage from "./institute-explorer.webp";

export default function StudentHeaderBanner({ title, subtitle, track, onTrackChange, onExploreCatalog }) {
  return (
    <div 
      className="inst-welcome-banner header-banner purple-banner" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '14px',
        position: 'relative',
        overflow: 'visible',
        borderRadius: '18px',
        padding: '24px 340px 24px 32px',
        boxSizing: 'border-box',
        minHeight: '180px',
        boxShadow: '0 8px 20px -4px rgba(124, 58, 237, 0.3)'
      }}
    >
      <div style={{ zIndex: 2, maxWidth: '100%' }}>
        <h1 className="inst-title" style={{ color: '#ffffff', margin: '0 0 4px 0', fontSize: '24px', fontWeight: 700 }}>
          {title || "Sandra"}
        </h1>
        <p className="inst-subtitle" style={{ color: '#ede9fe', margin: 0, fontSize: '13.5px', lineHeight: '1.4' }}>
          {subtitle || "Student Innovation Workspace • Track active challenges, XP progression, and AI evaluation feedback."}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', zIndex: 2 }}>
        {onTrackChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '6px 12px', borderRadius: '8px' }}>
            <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>Track</span>
            <select 
              value={track} 
              onChange={(e) => onTrackChange(e.target.value)}
              style={{ background: '#fff', border: 'none', padding: '4px 8px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#0f172a', cursor: 'pointer', outline: 'none' }}
            >
              <option value="all">All tracks</option>
              <option value="school">School Track</option>
              <option value="startup">Startup Track</option>
            </select>
          </div>
        )}
        
        {onExploreCatalog && (
          <button 
            onClick={onExploreCatalog}
            style={{ padding: '8px 16px', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(225,29,72,0.3)' }}
          >
            Explore catalog
          </button>
        )}
      </div>

      {/* Floating Mascot Sticker */}
      <StickerArt 
        src={mascotImage} 
        baseRotate={2} 
        style={{ 
          position: 'absolute', 
          right: '36px', 
          bottom: '-12px', 
          width: '320px',
          zIndex: 1 
        }} 
      />
    </div>
  );
}