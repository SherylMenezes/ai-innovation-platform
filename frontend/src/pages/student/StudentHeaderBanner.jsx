import React from 'react';

export default function StudentHeaderBanner({ title, subtitle, badgeText, children }) {
  return (
    <div 
      className="inst-welcome-banner" 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '24px',
        padding: '24px 32px',
        borderRadius: '18px',
        color: 'white',
        boxShadow: '0 8px 20px -4px rgba(249, 115, 22, 0.3)'
      }}
    >
      <div style={{ zIndex: 2, maxWidth: '70%' }}>
        <h1 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '700' }}>{title}</h1>
        <p style={{ margin: '0 0 14px 0', opacity: 0.95, fontSize: '13.5px' }}>{subtitle}</p>
        
        {children && (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {children}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2 }}>
        {badgeText && (
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            padding: '8px 16px', 
            borderRadius: '12px', 
            backdropFilter: 'blur(4px)', 
            fontWeight: '600', 
            fontSize: '13px' 
          }}>
            {badgeText}
          </div>
        )}
      </div>
    </div>
  );
}