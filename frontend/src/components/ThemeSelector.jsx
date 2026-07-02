import React, { useState, useEffect, useRef } from 'react';
import { Palette } from 'lucide-react';

const themes = [
  { id: 'default', name: 'Deep Indigo', colors: ['#6366f1', '#ec4899'] },
  { id: 'emerald', name: 'Emerald Aurora', colors: ['#10b981', '#06b6d4'] },
  { id: 'sunset', name: 'Sunset Glow', colors: ['#f59e0b', '#ef4444'] },
  { id: 'ocean', name: 'Ocean Breeze', colors: ['#06b6d4', '#3b82f6'] },
  { id: 'dracula', name: 'Dracula Neon', colors: ['#a855f7', '#f43f5e'] },
  { id: 'light', name: 'Glassmorphic Light', colors: ['#4f46e5', '#db2777'], isLight: true }
];

export default function ThemeSelector() {
  const [activeTheme, setActiveTheme] = useState(localStorage.getItem('theme') || 'default');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    applyTheme(activeTheme);

    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeTheme]);

  const applyTheme = (themeId) => {
    document.body.classList.forEach((className) => {
      if (className.startsWith('theme-')) {
        document.body.classList.remove(className);
      }
    });

    if (themeId !== 'default') {
      document.body.classList.add(`theme-${themeId}`);
    }
    
    localStorage.setItem('theme', themeId);
    setActiveTheme(themeId);
  };

  const handleSelect = (themeId) => {
    applyTheme(themeId);
    setIsOpen(false);
  };

  const activeThemeDetails = themes.find(t => t.id === activeTheme) || themes[0];

  return (
    <div className="theme-selector-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="btn btn-secondary" 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.6rem 1rem',
          fontSize: '0.85rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--card-border)',
          cursor: 'pointer',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-main)',
          transition: 'all 0.3s ease'
        }}
      >
        <Palette size={16} />
        <span style={{ fontWeight: 600 }}>Theme: {activeThemeDetails.name}</span>
      </button>

      {isOpen && (
        <div 
          className="theme-dropdown glass-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '220px',
            zIndex: 1000,
            padding: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'var(--glass-effect)'
          }}
        >
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelect(t.id)}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                background: activeTheme === t.id ? 'var(--primary-light)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                fontWeight: activeTheme === t.id ? '700' : '500',
                transition: 'all 0.2s ease',
                borderLeft: activeTheme === t.id ? '3px solid var(--primary)' : '3px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = activeTheme === t.id ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = activeTheme === t.id ? 'var(--primary-light)' : 'transparent';
              }}
            >
              <span>{t.name}</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.colors[0], display: 'inline-block', boxShadow: '0 0 4px rgba(0,0,0,0.2)' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.colors[1], display: 'inline-block', boxShadow: '0 0 4px rgba(0,0,0,0.2)' }} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
