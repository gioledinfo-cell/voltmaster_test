import React from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme, isDark, isOutdoor } = useTheme();

  const getLabel = () => {
    if (isOutdoor) return 'Outdoor Sole (Alto Contrasto)';
    if (isDark) return 'Tema Scuro';
    return 'Tema Chiaro';
  };

  const getTitle = () => {
    if (isDark) return 'Attuale: Tema Scuro -> Clicca per Tema Chiaro';
    if (!isDark && !isOutdoor) return 'Attuale: Tema Chiaro -> Clicca per Outdoor Cantiere (Alto Contrasto)';
    return 'Attuale: Outdoor Cantiere -> Clicca per Tema Scuro';
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`relative inline-flex items-center justify-center gap-2 p-2 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
        isOutdoor
          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-600 shadow-md font-bold'
          : isDark
          ? 'bg-slate-800/90 hover:bg-slate-700/90 text-amber-400 border-slate-700 hover:border-amber-500/40 shadow-sm'
          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 shadow-sm'
      } ${className}`}
      title={getTitle()}
      aria-label={getTitle()}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isOutdoor ? (
          <Sparkles className="w-4 h-4 text-slate-950 animate-pulse" />
        ) : isDark ? (
          <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
        ) : (
          <Moon className="w-4 h-4 text-slate-700 transition-transform duration-300 -rotate-12 hover:rotate-0" />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-semibold select-none">
          {getLabel()}
        </span>
      )}
    </button>
  );
};
