import React from 'react';
import { Search, Folder, ArrowLeft } from 'lucide-react';
import { SvgIconDetail } from '../types';
import { buildFullSvgString } from '../utils/svgParser';

interface GlobalSearchResultsProps {
  theme?: 'dark' | 'light';
  query: string;
  results: any[];
  onSelectIcon: (icon: SvgIconDetail) => void;
  onClearSearch: () => void;
}

export const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({
  theme = 'light',
  query,
  results,
  onSelectIcon,
  onClearSearch,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onClearSearch}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            isDark
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
              : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回圖標集列表
        </button>

        <div className="text-right text-xs">
          <span className="font-semibold text-slate-800 dark:text-zinc-200">
            "{query}" 跨庫搜尋結果
          </span>
          <p className="text-slate-500 dark:text-zinc-400">
            共找到 {results.length} 個相符的 SVG 圖標
          </p>
        </div>
      </div>

      {results.length === 0 ? (
        <div
          className={`text-center py-20 rounded-xl border max-w-xl mx-auto ${
            isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <Search className="w-10 h-10 mx-auto mb-3 text-slate-400" />
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
            未找到相關圖標
          </h3>
          <p className="text-xs mt-1 text-slate-500 dark:text-zinc-400">
            嘗試搜尋其他英文關鍵字，例如 "search", "heart", "user", "star", "home", "arrow" 等。
          </p>
          <button
            onClick={onClearSearch}
            className="mt-4 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white shadow-2xs"
          >
            清除搜尋
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {results.map((item, idx) => {
            const fullSvg = buildFullSvgString(item.body, item.width || 24, item.height || 24);

            return (
              <button
                key={`${item.libraryName}-${item.iconName}-${idx}`}
                onClick={() =>
                  onSelectIcon({
                    libraryName: item.libraryName,
                    libraryPrefix: item.libraryPrefix,
                    iconName: item.iconName,
                    body: item.body,
                    height: item.height || 24,
                    width: item.width || 24,
                  })
                }
                className={`group aspect-square rounded-lg border p-3 flex flex-col items-center justify-between transition-all duration-150 hover:scale-105 focus:outline-none ${
                  isDark
                    ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:border-sky-500'
                    : 'bg-white hover:bg-sky-50/50 border-slate-200 hover:border-sky-500 shadow-2xs'
                }`}
                title={`調色與下載：${item.iconName} (${item.libraryName})`}
              >
                {/* Library Badge */}
                <div className="w-full text-left flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-zinc-500 truncate">
                  <Folder className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="truncate">{item.libraryName}</span>
                </div>

                {/* SVG Display */}
                <div className="flex-1 w-full flex items-center justify-center p-1">
                  <div
                    className="w-8 h-8 transition-colors flex items-center justify-center text-slate-800 dark:text-zinc-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full"
                    dangerouslySetInnerHTML={{ __html: fullSvg }}
                  />
                </div>

                {/* Icon Name */}
                <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 group-hover:text-slate-900 dark:group-hover:text-zinc-100 truncate w-full text-center">
                  {item.iconName}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
