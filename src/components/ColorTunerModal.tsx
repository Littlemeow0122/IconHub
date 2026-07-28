import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Palette,
  ExternalLink,
  Code,
  FileCode,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Grid
} from 'lucide-react';
import { SvgIconDetail, ColorTarget } from '../types';
import {
  buildFullSvgString,
  extractColorTargets,
  replaceSvgColors,
  getSvgDataUrl,
  convertToReactJsx,
} from '../utils/svgParser';

interface ColorTunerModalProps {
  theme?: 'dark' | 'light';
  icon: SvgIconDetail;
  onClose: () => void;
}

export const ColorTunerModal: React.FC<ColorTunerModalProps> = ({ theme = 'dark', icon, onClose }) => {
  const { libraryName, iconName, body, height = 24, width = 24 } = icon;
  const isDark = theme === 'dark';

  const initialSvgString = useMemo(() => {
    return buildFullSvgString(body, width, height);
  }, [body, width, height]);

  // Extract color targets from the original SVG
  const colorTargets = useMemo(() => {
    return extractColorTargets(initialSvgString);
  }, [initialSvgString]);

  // Color map state: targetId -> colorHex
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [bgMode, setBgMode] = useState<'dark' | 'light' | 'grid'>('grid');
  const [activeTab, setActiveTab] = useState<'editor' | 'code'>('editor');
  const [codeType, setCodeType] = useState<'svg' | 'dataurl' | 'react' | 'raw'>('svg');

  // Initialize color map whenever icon changes
  useEffect(() => {
    const initialMap: Record<string, string> = {};
    colorTargets.forEach((t) => {
      initialMap[t.id] = t.currentColor;
    });
    setColorMap(initialMap);
  }, [colorTargets]);

  // Current recolored SVG string
  const currentSvgString = useMemo(() => {
    return replaceSvgColors(initialSvgString, colorMap);
  }, [initialSvgString, colorMap]);

  // Check if animated
  const isAnimated = useMemo(() => {
    return /<animate|<animatetransform|@keyframes|animation:/i.test(initialSvgString);
  }, [initialSvgString]);

  // Raw file URL
  const rawFileUrl = `${window.location.origin}/files/${encodeURIComponent(libraryName)}/${encodeURIComponent(iconName)}.svg`;

  // Handle color change for a target
  const handleColorChange = (targetId: string, newColor: string) => {
    setColorMap((prev) => ({
      ...prev,
      [targetId]: newColor,
    }));
  };

  // Reset colors
  const handleResetColors = () => {
    const initialMap: Record<string, string> = {};
    colorTargets.forEach((t) => {
      initialMap[t.id] = t.currentColor;
    });
    setColorMap(initialMap);
  };

  // Copy helper
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Download SVG file
  const handleDownload = () => {
    const blob = new Blob([currentSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${iconName}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`border rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isDark
            ? 'bg-zinc-900 border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between transition-colors ${
            isDark ? 'border-zinc-800 bg-zinc-900/90' : 'border-zinc-200 bg-zinc-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-800'
              }`}
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  className={`text-lg font-bold ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  {iconName}
                </h2>
                {isAnimated && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Sparkles className="w-3 h-3" />
                    動態 SVG
                  </span>
                )}
              </div>
              <p
                className={`text-xs ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
              >
                圖標庫: <span className="font-semibold">{libraryName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/files/${encodeURIComponent(libraryName)}/${encodeURIComponent(iconName)}.svg`}
              target="_blank"
              rel="noreferrer"
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              原始檔案
            </a>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Split view */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
          
          {/* Left Side: Preview Canvas */}
          <div className="md:col-span-6 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`text-xs font-semibold ${
                    isDark ? 'text-zinc-400' : 'text-zinc-600'
                  }`}
                >
                  即時預覽
                </span>
                <div
                  className={`flex items-center gap-1 p-1 rounded-lg border text-xs ${
                    isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                  }`}
                >
                  <button
                    onClick={() => setBgMode('dark')}
                    className={`p-1.5 rounded-md transition-colors ${
                      bgMode === 'dark'
                        ? isDark
                          ? 'bg-zinc-800 text-white'
                          : 'bg-white text-zinc-900 shadow-sm'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-200'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                    title="深色背景"
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setBgMode('light')}
                    className={`p-1.5 rounded-md transition-colors ${
                      bgMode === 'light'
                        ? isDark
                          ? 'bg-zinc-800 text-white'
                          : 'bg-white text-zinc-900 shadow-sm'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-200'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                    title="淺色背景"
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setBgMode('grid')}
                    className={`p-1.5 rounded-md transition-colors ${
                      bgMode === 'grid'
                        ? isDark
                          ? 'bg-zinc-800 text-white'
                          : 'bg-white text-zinc-900 shadow-sm'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-200'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                    title="棋盤格背景"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Display Box */}
              <div
                className={`w-full aspect-square rounded-2xl border flex items-center justify-center p-8 transition-colors duration-200 relative overflow-hidden ${
                  bgMode === 'dark'
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                    : bgMode === 'light'
                    ? 'bg-white text-zinc-900 border-zinc-200'
                    : isDark
                    ? 'bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-zinc-950 text-zinc-100 border-zinc-800'
                    : 'bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:16px_16px] bg-zinc-50 text-zinc-900 border-zinc-200'
                }`}
              >
                <div
                  className="w-32 h-32 flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-full [&_svg]:max-h-full"
                  dangerouslySetInnerHTML={{ __html: currentSvgString }}
                />
              </div>
            </div>

            {/* Canvas Quick Actions */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                onClick={handleDownload}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs border transition-all duration-150 active:scale-95 ${
                  isDark
                    ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border-zinc-200 shadow-md'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800 shadow-sm'
                }`}
              >
                <Download className="w-4 h-4" />
                下載 .SVG 檔案
              </button>
              <button
                onClick={() => handleCopy(getSvgDataUrl(currentSvgString), 'dataurl')}
                className={`flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl font-semibold text-xs border transition-colors ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                }`}
              >
                {copiedType === 'dataurl' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                複製 Data: URL
              </button>
            </div>
          </div>

          {/* Right Side: Color Tuner & Code Exporter */}
          <div className="md:col-span-6 p-6 flex flex-col justify-between">
            <div>
              {/* Tab Selector */}
              <div
                className={`flex items-center gap-2 border-b pb-3 mb-4 ${
                  isDark ? 'border-zinc-800' : 'border-zinc-200'
                }`}
              >
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'editor'
                      ? isDark
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                        : 'bg-zinc-200 text-zinc-900 border border-zinc-300'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  顏色調色盤 ({colorTargets.length})
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'code'
                      ? isDark
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                        : 'bg-zinc-200 text-zinc-900 border border-zinc-300'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  導出程式碼
                </button>
              </div>

              {/* Tab 1: Color Tuner */}
              {activeTab === 'editor' && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                      檢測到的可調色元素與屬性:
                    </p>
                    <button
                      onClick={handleResetColors}
                      className={`flex items-center gap-1 text-[11px] hover:underline transition-colors ${
                        isDark ? 'text-zinc-300' : 'text-zinc-800'
                      }`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      重置顏色
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {colorTargets.map((target) => {
                      const currentColorVal = colorMap[target.id] || target.currentColor;

                      return (
                        <div
                          key={target.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                            isDark
                              ? 'bg-zinc-950/60 border-zinc-800'
                              : 'bg-zinc-50 border-zinc-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Color Swatch Preview & Native Picker */}
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-zinc-600 shadow-inner flex items-center justify-center shrink-0">
                              <input
                                type="color"
                                value={currentColorVal.startsWith('#') ? currentColorVal : '#000000'}
                                onChange={(e) => handleColorChange(target.id, e.target.value)}
                                className="absolute -inset-2 w-12 h-12 cursor-pointer opacity-0 z-10"
                              />
                              <div
                                className="w-full h-full rounded-lg"
                                style={{ backgroundColor: currentColorVal }}
                              />
                            </div>

                            <div>
                              <span
                                className={`text-xs font-semibold block capitalize ${
                                  isDark ? 'text-zinc-200' : 'text-zinc-800'
                                }`}
                              >
                                {target.elementName}
                              </span>
                              <span
                                className={`text-[10px] font-mono uppercase ${
                                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                                }`}
                              >
                                {target.property} • {currentColorVal}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={currentColorVal}
                              onChange={(e) => handleColorChange(target.id, e.target.value)}
                              className={`w-20 rounded-lg px-2 py-1 text-xs font-mono border focus:outline-none ${
                                isDark
                                  ? 'bg-zinc-900 border-zinc-700 text-zinc-200 focus:border-zinc-500'
                                  : 'bg-white border-zinc-300 text-zinc-900 focus:border-zinc-500'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tab 2: Export Code Options */}
              {activeTab === 'code' && (
                <div>
                  <div
                    className={`flex items-center gap-1 mb-3 p-1 rounded-lg border ${
                      isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                    }`}
                  >
                    <button
                      onClick={() => setCodeType('svg')}
                      className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-colors ${
                        codeType === 'svg'
                          ? isDark
                            ? 'bg-zinc-800 text-white'
                            : 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      SVG 程式碼
                    </button>
                    <button
                      onClick={() => setCodeType('react')}
                      className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-colors ${
                        codeType === 'react'
                          ? isDark
                            ? 'bg-zinc-800 text-white'
                            : 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      React JSX
                    </button>
                    <button
                      onClick={() => setCodeType('dataurl')}
                      className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-colors ${
                        codeType === 'dataurl'
                          ? isDark
                            ? 'bg-zinc-800 text-white'
                            : 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Data URL
                    </button>
                    <button
                      onClick={() => setCodeType('raw')}
                      className={`flex-1 py-1 px-2 text-xs font-semibold rounded-md transition-colors ${
                        codeType === 'raw'
                          ? isDark
                            ? 'bg-zinc-800 text-white'
                            : 'bg-white text-zinc-900 shadow-sm'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Raw URL
                    </button>
                  </div>

                  <div
                    className={`relative rounded-xl border p-3 max-h-[260px] overflow-x-auto overflow-y-auto ${
                      isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <pre
                      className={`text-xs font-mono whitespace-pre-wrap break-all ${
                        isDark ? 'text-zinc-300' : 'text-zinc-800'
                      }`}
                    >
                      {codeType === 'svg' && currentSvgString}
                      {codeType === 'react' && convertToReactJsx(currentSvgString, iconName)}
                      {codeType === 'dataurl' && getSvgDataUrl(currentSvgString)}
                      {codeType === 'raw' && rawFileUrl}
                    </pre>

                    <button
                      onClick={() => {
                        let content = currentSvgString;
                        if (codeType === 'react') content = convertToReactJsx(currentSvgString, iconName);
                        if (codeType === 'dataurl') content = getSvgDataUrl(currentSvgString);
                        if (codeType === 'raw') content = rawFileUrl;
                        handleCopy(content, codeType);
                      }}
                      className={`absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border shadow-md ${
                        isDark
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                          : 'bg-white hover:bg-zinc-100 text-zinc-800 border-zinc-300'
                      }`}
                    >
                      {copiedType === codeType ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedType === codeType ? '已複製！' : '複製'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Footer */}
            <div
              className={`pt-4 border-t flex items-center justify-between text-xs ${
                isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-600'
              }`}
            >
              <span className="font-mono text-[11px] text-zinc-500 truncate max-w-[250px]">
                {rawFileUrl}
              </span>
              <button
                onClick={() => handleCopy(currentSvgString, 'quick-svg')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border transition-colors ${
                  isDark
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
                }`}
              >
                {copiedType === 'quick-svg' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <FileCode className="w-3.5 h-3.5" />
                )}
                <span>複製 SVG</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

