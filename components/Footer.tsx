
import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { useTheme } from '../contexts/ThemeContext';

const navLinks = [
    { to: "/about", label: "About" },
    { to: "/capabilities", label: "Capabilities" },
    { to: "/reasoning-architecture", label: "Reasoning Architecture" },
    { to: "/research", label: "Research" },
    { to: "/involved", label: "Get Involved" },
    { to: "/docs", label: "Docs" },
];

export function Footer() {
  const { theme: currentTheme, toggleTheme } = useTheme();

  return (
    <footer className="border-t border-[var(--color-edge)] py-4 bg-[var(--color-surface)]">
      <div className="max-w-[1180px] mx-auto px-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="flex items-center gap-3 text-[var(--color-ink)] font-medium">
          <Logo />
          <span>Built openly for the public good.</span>
        </div>
        <div className="md:ml-auto flex flex-wrap gap-x-4 gap-y-2 text-sm items-center">
            <Link to="/" className="hover:underline">Home</Link>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className="hover:underline">{link.label}</Link>
            ))}
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-md bg-[var(--color-panel)] border border-[var(--color-edge)] hover:border-[var(--color-accent)] transition-colors text-[var(--color-ink)] font-medium"
              aria-label={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
            >
              {currentTheme === 'light' ? '🌙 Dark' : '☀️ Light'}
            </button>
        </div>
      </div>
    </footer>
  );
}
