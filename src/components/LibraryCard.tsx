import React from 'react';
import { SvgLibrarySummary, RandomIconSample, SvgIconDetail } from '../types';
import { buildFullSvgString } from '../utils/svgParser';

interface LibraryCardProps {
  theme?: 'dark' | 'light';
  library: SvgLibrarySummary;
  onOpenLibrary: (folderName: string) => void;
  onSelectIcon: (icon: SvgIconDetail) => void;
}

export const LibraryCard: React.FC<LibraryCardProps> = ({
  theme = 'light',
  library,
  onOpenLibrary,
  onSelectIcon,
}) => {
  const { folderName, info, totalIcons, random6 } = library;
  const isDark = theme === 'dark';

  // Ensure 6 sample icons
  const displayIcons: RandomIconSample[] = [...random6];
  while (displayIcons.length < 6 && displayIcons.length > 0) {
    displayIcons.push(random6[displayIcons.length % random6.length]);
  }

  return (
    <div
      className={`rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between group ${
        isDark
          ? 'bg-zinc-900/80 hover:bg-zinc-900 border-zinc-800/80 hover:border-zinc-700'
          : 'bg-white hover:bg-slate-50/50 border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs'
      }`}
    >
      <div>
        {/* Top Info Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <h3
              onClick={() => onOpenLibrary(folderName)}
              className="text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-100 hover:text-sky-600 dark:hover:text-sky-400 cursor-pointer truncate transition-colors"
            >
              {info.name || folderName}
            </h3>

            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-zinc-400 font-sans truncate">
              <span>{totalIcons} 個 SVG</span>
              {info.license?.title && (
                <>
                  <span>•</span>
                  <span className="truncate">{info.license.title}</span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenLibrary(folderName);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-medium border shrink-0 cursor-pointer transition-all active:scale-95 ${
              isDark
                ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-700 border-slate-200/80'
            }`}
          >
            查看
          </button>
        </div>

        {/* 6 Preview Icons Inline Row */}
        <div className="mt-3">
          <div className="grid grid-cols-6 gap-2">
            {displayIcons.slice(0, 6).map((icon, idx) => {
              const fullSvg = buildFullSvgString(
                icon.body,
                icon.width || info.height || 24,
                icon.height || info.height || 24
              );

              return (
                <button
                  key={`${icon.name}-${idx}`}
                  onClick={() =>
                    onSelectIcon({
                      libraryName: folderName,
                      iconName: icon.name,
                      body: icon.body,
                      height: icon.height || info.height || 24,
                      width: icon.width || info.height || 24,
                    })
                  }
                  className={`aspect-square rounded-lg border p-1.5 flex items-center justify-center transition-all duration-150 hover:scale-105 focus:outline-none cursor-pointer ${
                    isDark
                      ? 'bg-zinc-950/60 border-zinc-800/80 hover:border-sky-500/80 hover:bg-zinc-800 text-zinc-200'
                      : 'bg-slate-50/80 border-slate-100 hover:border-sky-500/80 hover:bg-sky-50/40 text-slate-700 hover:text-sky-600'
                  }`}
                  title={`檢視與調色: ${icon.name}`}
                >
                  <div
                    className="w-5 h-5 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full"
                    dangerouslySetInnerHTML={{ __html: fullSvg }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Meta */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/60 flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500">
        <span>
          {info.category || '通用'}
        </span>
      </div>
    </div>
  );
};
