import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onSearch: (query: string) => void;
  onHomeClick: () => void;
  searchQuery: string;
  totalIconsCount?: number;
  totalSetsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme = 'light',
  onToggleTheme,
  onSearch,
  onHomeClick,
  searchQuery,
  totalIconsCount = 0,
}) => {
  const [inputVal, setInputVal] = useState(searchQuery);
  const isDark = theme === 'dark';

  useEffect(() => {
    setInputVal(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputVal);
  };

  return (
    <header
      className={`border-b sticky top-0 z-40 backdrop-blur-md transition-colors duration-200 ${
        isDark
          ? 'bg-zinc-950/80 border-zinc-800 text-zinc-100'
          : 'bg-white/80 border-slate-200/80 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <button
          onClick={() => {
            setInputVal('');
            onHomeClick();
          }}
          className="flex items-center gap-2 group text-left focus:outline-none shrink-0 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold shadow-2xs">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="font-bold text-base tracking-tight text-slate-900 dark:text-zinc-100 font-sans">
            IconHub
          </span>
        </button>

        {/* Search Bar in Header */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-lg mx-2 hidden sm:block">
          <div className="relative">
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                isDark ? 'text-zinc-500' : 'text-slate-400'
              }`}
            />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder={`搜尋所有 ${totalIconsCount > 0 ? totalIconsCount : ''} 個圖標...`}
              className={`w-full rounded-lg pl-9 pr-12 py-1.5 text-xs border focus:outline-none transition-all duration-150 ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-sky-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-sky-500'
              }`}
            />
            {inputVal && (
              <button
                type="button"
                onClick={() => {
                  setInputVal('');
                  onSearch('');
                }}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  isDark
                    ? 'text-zinc-400 hover:text-zinc-100 bg-zinc-800'
                    : 'text-slate-500 hover:text-slate-800 bg-slate-200/70'
                }`}
              >
                清除
              </button>
            )}
          </div>
        </form>

        {/* Right Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                isDark
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                  : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 border-slate-200/80'
              }`}
              title={isDark ? '切換至淺色模式' : '切換至深色模式'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
