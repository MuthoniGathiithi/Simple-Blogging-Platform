import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  // Scroll detection for sections on home page
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);

      if (location.pathname !== '/') return;

      const sections = [
        { id: 'about', name: 'about' },
        { id: 'how-it-works', name: 'how-it-works' },
        { id: 'contact', name: 'contact' }
      ];

      let currentSection = '';
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) currentSection = section.name;
        }
      }
      setActiveSection(currentSection || 'home');
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const scrollToSection = (id) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 120);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false); // close mobile menu after click
  };

  const handleSignInClick = () => navigate('/signin');
  const handleGetStartedClick = () => navigate('/signup');

  const activeColor = '#4F46E5';
  const inactiveColor = scrolled ? '#fff' : '#111827';
  const navBackground = scrolled ? '#000' : 'rgba(255,255,255,0.95)';
  const logoColor = location.pathname === '/' && activeSection === 'home' ? activeColor : scrolled ? '#fff' : '#111827';
  const primaryButtonBg = isActive('/signup') ? activeColor : scrolled ? '#fff' : '#111827';
  const primaryButtonText = isActive('/signup') ? '#fff' : scrolled ? '#111827' : '#fff';

  const linkStyle = {
    background: 'transparent',
    border: 'none',
    fontSize: '1.25rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '6px 0',
    transition: 'color 0.15s',
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: navBackground,
      backdropFilter: 'blur(10px)',
      zIndex: 60,
      padding: '12px 24px',
      transition: 'background-color 0.2s',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Link to="/" style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: logoColor,
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}>
          Funzo Hub
        </Link>

        {/* Desktop Links */}
        <div className="desktop-links" style={{
          display: 'none',
          alignItems: 'center',
          gap: '24px'
        }}>
          <button onClick={() => scrollToSection('home')} style={{ ...linkStyle, color: activeSection === 'home' ? activeColor : inactiveColor }}>Home</button>
          <button onClick={() => scrollToSection('about')} style={{ ...linkStyle, color: activeSection === 'about' ? activeColor : inactiveColor }}>About Us</button>
          <button onClick={() => scrollToSection('how-it-works')} style={{ ...linkStyle, color: activeSection === 'how-it-works' ? activeColor : inactiveColor }}>How It Works</button>
          <button onClick={() => scrollToSection('contact')} style={{ ...linkStyle, color: activeSection === 'contact' ? activeColor : inactiveColor }}>Contact</button>

          <button onClick={handleSignInClick} style={{ ...linkStyle, fontWeight: 500, color: isActive('/signin') ? activeColor : inactiveColor }}>Sign In</button>
          <button onClick={handleGetStartedClick} style={{
            background: primaryButtonBg,
            border: 'none',
            color: primaryButtonText,
            fontSize: '0.95rem',
            fontWeight: 600,
            padding: '8px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
          }}>Get Started</button>
        </div>

        {/* Mobile Hamburger */}
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
          display: 'block',
          background: 'transparent',
          border: 'none',
          fontSize: '1.5rem',
          cursor: 'pointer',
          color: logoColor,
        }}>
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '16px 0',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          <button onClick={() => scrollToSection('home')} style={{ ...linkStyle, color: activeSection === 'home' ? activeColor : inactiveColor }}>Home</button>
          <button onClick={() => scrollToSection('about')} style={{ ...linkStyle, color: activeSection === 'about' ? activeColor : inactiveColor }}>About Us</button>
          <button onClick={() => scrollToSection('how-it-works')} style={{ ...linkStyle, color: activeSection === 'how-it-works' ? activeColor : inactiveColor }}>How It Works</button>
          <button onClick={() => scrollToSection('contact')} style={{ ...linkStyle, color: activeSection === 'contact' ? activeColor : inactiveColor }}>Contact</button>
          <button onClick={handleSignInClick} style={{ ...linkStyle, fontWeight: 500, color: isActive('/signin') ? activeColor : inactiveColor }}>Sign In</button>
          <button onClick={handleGetStartedClick} style={{
            background: primaryButtonBg,
            border: 'none',
            color: primaryButtonText,
            fontSize: '0.85rem',
            fontWeight: 600,
            padding: '8px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
          }}>Get Started</button>
        </div>
      )}

      {/* Media Queries */}
      <style>{`
        @media(min-width: 768px) {
          .desktop-links { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
