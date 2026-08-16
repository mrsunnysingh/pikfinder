import React, { useContext } from 'react';
import { Sun, Moon, Desktop } from '@phosphor-icons/react';
import { AppContext } from '../context/AppContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useContext(AppContext);
  
  const getIcon = () => {
    if (theme === 'dark') return <Moon weight="fill" />;
    if (theme === 'light') return <Sun weight="fill" />;
    return <Desktop weight="fill" />;
  };

  const getTitle = () => {
    if (theme === 'dark') return 'Switch to light mode';
    if (theme === 'light') return 'Switch to system theme';
    return 'Switch to dark mode';
  };

  return (
    <button
      className={`theme-toggle ${className}`}
      onClick={toggleTheme}
      title={getTitle()}
      aria-label="Toggle theme"
      style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}
    >
      {getIcon()}
    </button>
  );
}
