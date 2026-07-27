import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { LibraryCard } from './components/LibraryCard';
import { ColorTunerModal } from './components/ColorTunerModal';
import { LibraryDetailView } from './components/LibraryDetailView';
import { GlobalSearchResults } from './components/GlobalSearchResults';
import { SvgLibrarySummary, SvgIconDetail } from './types';
import { Search, Filter } from 'lucide-react';

// Helper for fetching JSON with static fallback for static hosts (Cloudflare Pages, Vercel, etc.)
async function fetchJsonSafely(url: string, fallbackUrl?: string) {
  try {
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().startsWith('{')) {
        const data = JSON.parse(text);
        if (data && data.success !== false) return data;
      }
    }
  } catch (e) {
    console.warn(`Primary API fetch failed for ${url}, trying fallback...`, e);
  }

  if (fallbackUrl) {
    try {
      const res = await fetch(fallbackUrl);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().startsWith('{')) {
          const data = JSON.parse(text);
          if (data && data.success !== false) return data;
        }
      }
    } catch (e) {
      console.error(`Fallback fetch failed for ${fallbackUrl}`, e);
    }
  }
  return null;
}

export default function App() {
  const [libraries, setLibraries] = useState<SvgLibrarySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Theme State: 'light' by default, persisted
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app-theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('app-theme', next);
      return next;
    });
  };

  // Active View State
  const [selectedLibraryName, setSelectedLibraryName] = useState<string | null>(null);
  const [selectedLibraryData, setSelectedLibraryData] = useState<any>(null);
  const [selectedIcon, setSelectedIcon] = useState<SvgIconDetail | null>(null);

  // Search & Filter State
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [selectedLicenseFilter, setSelectedLicenseFilter] = useState<string>('All');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load all libraries
  const fetchLibraries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJsonSafely('/api/libraries', '/api/libraries.json');
      if (data && data.success && Array.isArray(data.libraries)) {
        setLibraries(data.libraries);
      } else {
        throw new Error('無法載入圖標庫');
      }
    } catch (err: any) {
      setError(err.message || '載入圖標庫時發生未知錯誤');
    } finally {
      setLoading(false);
    }
  }, []);

  // Total icons count
  const totalIconsCount = useMemo(() => {
    return libraries.reduce((acc, lib) => acc + (lib.totalIcons || 0), 0);
  }, [libraries]);

  // Extract all categories
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    libraries.forEach((lib) => {
      if (lib.info?.category) cats.add(lib.info.category);
    });
    return Array.from(cats);
  }, [libraries]);

  // Extract all licenses
  const licensesList = useMemo(() => {
    const lics = new Set<string>();
    libraries.forEach((lib) => {
      if (lib.info?.license?.title) lics.add(lib.info.license.title);
    });
    return Array.from(lics);
  }, [libraries]);

  // Parse URL on mount or popstate for default URL routing: /:libraryName/:iconName
  useEffect(() => {
    fetchLibraries();

    const handleRouteFromUrl = async () => {
      let pathname = window.location.pathname;
      try {
        pathname = decodeURIComponent(pathname);
      } catch (e) {
        console.warn('Malformed pathname:', e);
      }

      if (!pathname || pathname === '/' || pathname.startsWith('/files/') || pathname.startsWith('/api/')) return;

      const segments = pathname.split('/').filter(Boolean);
      if (segments.length === 1) {
        const libName = segments[0];
        handleOpenLibrary(libName);
      } else if (segments.length >= 2) {
        const libName = segments[0];
        const iconFile = segments[1];
        const cleanIconName = iconFile.endsWith('.svg') ? iconFile.slice(0, -4) : iconFile;

        try {
          const data = await fetchJsonSafely(
            `/api/libraries/${encodeURIComponent(libName)}`,
            `/api/libraries/${encodeURIComponent(libName)}.json`
          );
          if (data && data.success && data.library?.icons?.[cleanIconName]) {
            const iconObj = data.library.icons[cleanIconName];
            setSelectedIcon({
              libraryName: libName,
              iconName: cleanIconName,
              body: iconObj.body,
              height: iconObj.height || data.library.info?.height || 24,
              width: iconObj.width || data.library.info?.height || 24,
            });
          }
        } catch (e) {
          console.error('Error loading icon from URL:', e);
        }
      }
    };

    handleRouteFromUrl();

    window.addEventListener('popstate', handleRouteFromUrl);
    return () => window.removeEventListener('popstate', handleRouteFromUrl);
  }, [fetchLibraries]);

  // Handle Global Search
  const handleGlobalSearch = async (query: string) => {
    setGlobalSearchQuery(query);
    const q = query.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      let url = `/api/search?q=${encodeURIComponent(q)}`;
      if (selectedLibraryName) {
        url += `&library=${encodeURIComponent(selectedLibraryName)}`;
      }
      
      let data = await fetchJsonSafely(url, '/api/search.json');
      if (data && data.success && Array.isArray(data.results)) {
        let results = data.results;
        // If static fallback was used, filter client-side
        if (!url.includes('/api/search.json')) {
          results = results.filter((item: any) => {
            if (selectedLibraryName && item.libraryName !== selectedLibraryName) return false;
            return (
              item.iconName?.toLowerCase().includes(q) ||
              item.libraryName?.toLowerCase().includes(q)
            );
          });
        }
        setSearchResults(results);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsSearching(false);
    }
  };

  // Open single Library Detail View
  const handleOpenLibrary = async (folderName: string) => {
    setSelectedLibraryName(folderName);
    window.history.pushState({}, '', `/${encodeURIComponent(folderName)}`);
    try {
      const data = await fetchJsonSafely(
        `/api/libraries/${encodeURIComponent(folderName)}`,
        `/api/libraries/${encodeURIComponent(folderName)}.json`
      );
      if (data && data.success) {
        setSelectedLibraryData(data.library);
      }
    } catch (e) {
      console.error('Error opening library detail:', e);
    }
  };

  // Back to Home
  const handleHomeClick = () => {
    setSelectedLibraryName(null);
    setSelectedLibraryData(null);
    setGlobalSearchQuery('');
    setSearchResults([]);
    window.history.pushState({}, '', '/');
  };

  // Select icon for inspection/color tuning modal
  const handleSelectIcon = (icon: SvgIconDetail) => {
    setSelectedIcon(icon);
    window.history.pushState(
      {},
      '',
      `/${encodeURIComponent(icon.libraryName)}/${encodeURIComponent(icon.iconName)}`
    );
  };

  // Filtered Libraries list
  const filteredLibraries = useMemo(() => {
    return libraries.filter((lib) => {
      const name = (lib.info?.name || lib.folderName).toLowerCase();
      const cat = (lib.info?.category || '').toLowerCase();
      const lic = (lib.info?.license?.title || '').toLowerCase();

      if (filterKeyword) {
        const kw = filterKeyword.toLowerCase().trim();
        if (!name.includes(kw) && !cat.includes(kw) && !lib.folderName.toLowerCase().includes(kw)) {
          return false;
        }
      }

      if (selectedCategoryFilter !== 'All' && lib.info?.category !== selectedCategoryFilter) {
        return false;
      }

      if (selectedLicenseFilter !== 'All' && lib.info?.license?.title !== selectedLicenseFilter) {
        return false;
      }

      return true;
    });
  }, [libraries, filterKeyword, selectedCategoryFilter, selectedLicenseFilter]);

  // Group Libraries by Category for section layout
  const categorizedLibraries = useMemo(() => {
    const groups: Record<string, SvgLibrarySummary[]> = {};
    filteredLibraries.forEach((lib) => {
      const cat = lib.info?.category || '常用圖標庫 (General)';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(lib);
    });
    return groups;
  }, [filteredLibraries]);

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDark
          ? 'bg-zinc-950 text-zinc-100 selection:bg-zinc-700 selection:text-white'
          : 'bg-[#fcfcfd] text-slate-900 selection:bg-sky-100 selection:text-slate-900'
      }`}
    >
      {/* Navigation Header */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onSearch={handleGlobalSearch}
        onHomeClick={handleHomeClick}
        searchQuery={globalSearchQuery}
        totalIconsCount={totalIconsCount}
        totalSetsCount={libraries.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20">
        {/* State 1: Global Search Active */}
        {globalSearchQuery ? (
          <GlobalSearchResults
            theme={theme}
            query={globalSearchQuery}
            results={searchResults}
            onSelectIcon={handleSelectIcon}
            onClearSearch={() => handleGlobalSearch('')}
          />
        ) : selectedLibraryName && selectedLibraryData ? (
          /* State 2: Inside a specific SVG Library */
          <LibraryDetailView
            theme={theme}
            folderName={selectedLibraryName}
            libraryData={selectedLibraryData}
            onBack={handleHomeClick}
            onSelectIcon={handleSelectIcon}
          />
        ) : (
          /* State 3: Home Page Layout */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Clean Hero Search */}
            <div className="max-w-3xl mx-auto mb-10 text-center pt-4">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 mb-2">
                向量圖標搜尋與即時調色引擎
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
                收錄 {totalIconsCount > 0 ? totalIconsCount.toLocaleString() : '30,000+'} 個高質感向量圖標，點擊即可進行單色或多色調色與下載
              </p>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => handleGlobalSearch(e.target.value)}
                  placeholder="搜尋關鍵字，例如 search, heart, user, arrow..."
                  className={`w-full rounded-xl pl-12 pr-4 py-3 text-sm border shadow-2xs focus:outline-none transition-all ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-sky-500'
                      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10'
                  }`}
                />
              </div>
            </div>

            {/* Clean Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-slate-200/70 dark:border-zinc-800/80 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={filterKeyword}
                    onChange={(e) => setFilterKeyword(e.target.value)}
                    placeholder="篩選圖標集..."
                    className={`rounded-lg pl-7 pr-3 py-1.5 text-xs border focus:outline-none ${
                      isDark
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-200 placeholder-zinc-500'
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-sky-500'
                    }`}
                  />
                  <Filter className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className={`rounded-lg px-3 py-1.5 border text-xs font-medium cursor-pointer focus:outline-none ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <option value="All">所有分類</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedLicenseFilter}
                  onChange={(e) => setSelectedLicenseFilter(e.target.value)}
                  className={`rounded-lg px-3 py-1.5 border text-xs font-medium cursor-pointer focus:outline-none ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <option value="All">所有授權條款</option>
                  {licensesList.map((lic) => (
                    <option key={lic} value={lic}>
                      {lic}
                    </option>
                  ))}
                </select>
              </div>

              {(filterKeyword || selectedCategoryFilter !== 'All' || selectedLicenseFilter !== 'All') && (
                <button
                  onClick={() => {
                    setFilterKeyword('');
                    setSelectedCategoryFilter('All');
                    setSelectedLicenseFilter('All');
                  }}
                  className="text-sky-600 dark:text-sky-400 font-medium hover:underline cursor-pointer"
                >
                  重設篩選
                </button>
              )}
            </div>

            {/* Loading / Error / Content */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className={`h-40 rounded-xl border animate-pulse p-5 ${
                      isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-100 border-slate-200'
                    }`}
                  />
                ))}
              </div>
            ) : error ? (
              <div
                className={`p-6 rounded-xl border text-center ${
                  isDark ? 'bg-rose-950/30 border-rose-900 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                無法載入圖標集：{error}
              </div>
            ) : filteredLibraries.length === 0 ? (
              <div
                className={`p-12 rounded-xl border text-center ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                沒有符合篩選條件的圖標集。
              </div>
            ) : (
              /* Grouped Sections by Category (3 Cards Per Row on Desktop) */
              <div className="space-y-10">
                {(Object.entries(categorizedLibraries) as [string, SvgLibrarySummary[]][]).map(([category, libGroup]) => (
                  <div key={category}>
                    {/* Category Title Header */}
                    <div className="flex items-center gap-2 mb-4">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100">
                        {category}
                      </h2>
                      <span className="text-xs text-slate-400 dark:text-zinc-500">
                        ({libGroup.length})
                      </span>
                    </div>

                    {/* Icon Sets Grid - Exactly 3 per row on lg/xl screens! */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {libGroup.map((lib) => (
                        <LibraryCard
                          key={lib.folderName}
                          theme={theme}
                          library={lib}
                          onOpenLibrary={handleOpenLibrary}
                          onSelectIcon={handleSelectIcon}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Color Tuner Inspector Modal */}
      {selectedIcon && (
        <ColorTunerModal
          theme={theme}
          icon={selectedIcon}
          onClose={() => {
            setSelectedIcon(null);
            if (selectedLibraryName) {
              window.history.pushState({}, '', `/${encodeURIComponent(selectedLibraryName)}`);
            } else {
              window.history.pushState({}, '', '/');
            }
          }}
        />
      )}
    </div>
  );
}
