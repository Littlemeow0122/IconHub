import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { SvgIconDetail } from '../types';
import { buildFullSvgString } from '../utils/svgParser';

interface LibraryDetailViewProps {
  theme?: 'dark' | 'light';
  folderName: string;
  libraryData: any;
  onBack: () => void;
  onSelectIcon: (icon: SvgIconDetail) => void;
}

export const LibraryDetailView: React.FC<LibraryDetailViewProps> = ({
  theme = 'light',
  folderName,
  libraryData,
  onBack,
  onSelectIcon,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const isDark = theme === 'dark';

  const info = libraryData?.info || {};
  const iconsMap = libraryData?.icons || {};
  const iconKeys = Object.keys(iconsMap);

  // Filter icons by local search
  const filteredIconKeys = useMemo(() => {
    return iconKeys.filter((key) => {
      const matchesSearch =
        !localSearch || key.toLowerCase().includes(localSearch.toLowerCase().trim());
      return matchesSearch;
    });
  }, [iconKeys, localSearch]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumb Navigation Bar */}
      <div className="flex items-center justify-between mb-6 text-xs text-slate-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="hover:text-sky-600 dark:hover:text-sky-400 font-medium flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            所有圖標集
          </button>
          <span>/</span>
          <span className="font-semibold text-slate-800 dark:text-zinc-200">
            {info.name || folderName}
          </span>
        </div>
      </div>

      {/* Library Set Header */}
      <div
        className={`rounded-xl p-6 mb-8 border transition-colors ${
          isDark
            ? 'bg-zinc-900 border-zinc-800'
            : 'bg-[#f4f5f7] border-slate-200/90'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100">
                {info.name || folderName}
              </h1>
              {info.license?.title && (
                <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-slate-200/80 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-300/60 dark:border-zinc-700">
                  {info.license.title}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600 dark:text-zinc-400">
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                共 {iconKeys.length} 個圖標
              </span>
              {info.category && (
                <>
                  <span>•</span>
                  <span>分類：{info.category}</span>
                </>
              )}
              {info.author?.name && (
                <>
                  <span>•</span>
                  <span>作者：{info.author.name}</span>
                </>
              )}
            </div>
          </div>

          {/* Search Box inside Set */}
          <div className="w-full md:w-80">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder={`在此圖標集中搜尋 ${iconKeys.length} 個圖標...`}
                className={`w-full rounded-lg pl-10 pr-10 py-2 text-sm border focus:outline-none ${
                  isDark
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-sky-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
                }`}
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Icons */}
      <div className="mb-4 flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400 font-medium">
        <span>顯示 {filteredIconKeys.length} 個圖標</span>
        <span>點擊任一圖標可預覽調色、下載或複製 SVG 代碼</span>
      </div>

      {filteredIconKeys.length === 0 ? (
        <div
          className={`text-center py-16 rounded-xl border ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          未找到與 "{localSearch}" 匹配的圖標。
          <button
            onClick={() => setLocalSearch('')}
            className="block mx-auto mt-2 text-sky-600 dark:text-sky-400 hover:underline font-semibold text-xs"
          >
            清除關鍵字
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filteredIconKeys.map((key) => {
            const iconObj = iconsMap[key];
            const fullSvg = buildFullSvgString(
              iconObj.body,
              iconObj.width || info.height || 24,
              iconObj.height || info.height || 24
            );

            return (
              <button
                key={key}
                onClick={() =>
                  onSelectIcon({
                    libraryName: folderName,
                    iconName: key,
                    body: iconObj.body,
                    height: iconObj.height || info.height || 24,
                    width: iconObj.width || info.height || 24,
                  })
                }
                className={`group aspect-square rounded-lg border p-3 flex flex-col items-center justify-between transition-all duration-150 hover:scale-105 focus:outline-none ${
                  isDark
                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-sky-500'
                    : 'bg-white hover:bg-sky-50/50 border-slate-200 hover:border-sky-500 shadow-2xs'
                }`}
                title={`檢視與調色：${key}`}
              >
                <div className="flex-1 w-full flex items-center justify-center p-1">
                  <div
                    className="w-8 h-8 flex items-center justify-center text-slate-800 dark:text-zinc-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full"
                    dangerouslySetInnerHTML={{ __html: fullSvg }}
                  />
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100 truncate w-full text-center">
                  {key}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
