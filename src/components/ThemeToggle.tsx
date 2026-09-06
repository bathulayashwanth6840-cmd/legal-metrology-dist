// src/components/ThemeToggle.tsx
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  compact?: boolean;
}

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 dark:text-amber-300 border border-slate-700/60 shadow-xs transition-all flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDark ? (
          <Sun size={16} aria-hidden="true" className="animate-in spin-in-180 duration-200" />
        ) : (
          <Moon size={16} aria-hidden="true" className="text-blue-300 animate-in spin-in-180 duration-200" />
        )}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Theme mode selection"
      className="bg-blue-950/70 dark:bg-slate-900/80 p-1 rounded-xl border border-blue-900/60 dark:border-slate-800 flex items-center justify-between text-xs"
    >
      <span className="text-[10px] font-bold text-blue-200 dark:text-slate-400 pl-2 uppercase tracking-wider select-none">
        Theme
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setTheme('light')}
          aria-pressed={theme === 'light'}
          aria-label="Light mode"
          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            theme === 'light'
              ? 'bg-amber-400 text-slate-950 shadow-xs'
              : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
          }`}
          title="Light Mode"
        >
          <Sun size={12} aria-hidden="true" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          aria-pressed={theme === 'dark'}
          aria-label="Dark mode"
          className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            theme === 'dark'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-blue-200 hover:text-white hover:bg-blue-900/50'
          }`}
          title="Dark Mode"
        >
          <Moon size={12} aria-hidden="true" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          aria-pressed={theme === 'system'}
          aria-label="System automatic mode"
          className={`p-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
            theme === 'system'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'text-blue-300 hover:text-white hover:bg-blue-900/50'
          }`}
          title="System Auto"
        >
          <Laptop size={12} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
