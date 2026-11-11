import React, { useState } from 'react';
import { BarChart3, TrendingUp, Sun, Moon } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAppContext } from '../../store';

export type GlossTheme = 'frosted' | 'sky' | 'midnight';
export type ChartStyle = 'glossy-bars' | 'area';

// Custom 3D Glossy Liquid Glass Bar Shape modeled after image_08d05d0d.png
export const GlossyGlassBar = (props: any) => {
  const { x, y, width, height, index, glossTheme = 'frosted', uid = 'g' } = props;
  if (!height || height <= 0 || !width || width <= 0) return null;

  const r = Math.min(16, width / 2, height / 2);
  // Rounded top corners, flat bottom
  const barPath = `
    M ${x},${y + height}
    L ${x},${y + r}
    Q ${x},${y} ${x + r},${y}
    L ${x + width - r},${y}
    Q ${x + width},${y} ${x + width},${y + r}
    L ${x + width},${y + height}
    Z
  `;

  // Top specular rim highlight path
  const topRimPath = `
    M ${x + 1.5},${y + r}
    Q ${x + 1.5},${y + 1.5} ${x + r},${y + 1.5}
    L ${x + width - r},${y + 1.5}
    Q ${x + width - 1.5},${y + 1.5} ${x + width - 1.5},${y + r}
  `;

  const gradId = `${uid}-glossBarFill-${glossTheme}-${index % 4}`;
  const clipId = `${uid}-glossBarClip-${index}-${Math.round(x)}`;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={barPath} />
        </clipPath>
      </defs>

      {/* Soft ambient glow behind bar */}
      <path
        d={barPath}
        fill={`url(#${gradId})`}
        opacity={glossTheme === 'frosted' ? 0.32 : 0.45}
        transform="translate(0, 4)"
        filter="blur(6px)"
      />

      {/* Main glossy gradient fill */}
      <path d={barPath} fill={`url(#${gradId})`} />

      {/* Clipped internal reflections */}
      <g clipPath={`url(#${clipId})`}>
        {/* Left vertical glass sheen */}
        <rect
          x={x}
          y={y}
          width={width * 0.38}
          height={height}
          fill={`url(#${uid}-glossSideSheen)`}
        />

        {/* Top inner glass glow */}
        <rect
          x={x}
          y={y}
          width={width}
          height={Math.min(48, height * 0.5)}
          fill={`url(#${uid}-glossTopInnerGlow)`}
        />
      </g>

      {/* Outer translucent glass border */}
      <path
        d={barPath}
        fill="none"
        stroke={`url(#${uid}-glossBorderStroke)`}
        strokeWidth={1.35}
      />

      {/* Bright top curved specular rim */}
      <path
        d={topRimPath}
        fill="none"
        stroke="#ffffff"
        strokeWidth={2}
        strokeLinecap="round"
        opacity={0.95}
      />
    </g>
  );
};

export interface GlossyChartCardProps {
  title: string;
  subtitle: string;
  data: any[];
  xKey: string;
  yKey: string;
  valueLabel?: string;
  valueFormatter?: (val: any) => string;
  yTickFormatter?: (val: any) => string;
  className?: string;
  chartHeight?: number;
  uid?: string;
}

export function GlossyChartCard({
  title,
  subtitle,
  data,
  xKey,
  yKey,
  valueLabel = 'Units',
  valueFormatter,
  yTickFormatter,
  className = '',
  chartHeight = 300,
  uid = 'chart'
}: GlossyChartCardProps) {
  // Read persisted theme from localStorage so setting persists when navigating across pages
  const storageThemeKey = `ios26_chart_theme_${uid}`;
  const storageStyleKey = `ios26_chart_style_${uid}`;

  const [glossTheme, setGlossThemeState] = useState<GlossTheme>(() => {
    try {
      const saved = localStorage.getItem(storageThemeKey) || localStorage.getItem('ios26_global_chart_theme');
      if (saved === 'frosted' || saved === 'sky' || saved === 'midnight') return saved;
    } catch {
      // ignore
    }
    return 'frosted';
  });

  const [chartStyle, setChartStyleState] = useState<ChartStyle>(() => {
    try {
      const saved = localStorage.getItem(storageStyleKey);
      if (saved === 'glossy-bars' || saved === 'area') return saved;
    } catch {
      // ignore
    }
    return 'glossy-bars';
  });

  const setGlossTheme = (theme: GlossTheme) => {
    setGlossThemeState(theme);
    try {
      localStorage.setItem(storageThemeKey, theme);
      localStorage.setItem('ios26_global_chart_theme', theme);
    } catch {
      // ignore
    }
  };

  const setChartStyle = (styleOrUpdater: ChartStyle | ((prev: ChartStyle) => ChartStyle)) => {
    setChartStyleState(prev => {
      const next = typeof styleOrUpdater === 'function' ? styleOrUpdater(prev) : styleOrUpdater;
      try {
        localStorage.setItem(storageStyleKey, next);
      } catch {
        // ignore
      }
      return next;
    });
  };

  const { resolvedTheme } = useAppContext();
  const isGlobalDark = resolvedTheme === 'dark';
  const isDarkGraph = glossTheme === 'midnight' || glossTheme === 'sky' || (glossTheme === 'frosted' && isGlobalDark);
  const graphCardSurfaceClass =
    glossTheme === 'midnight'
      ? 'bg-gradient-to-b from-[#111556] via-[#191f78] to-[#1e1b6e] border-indigo-300/35 shadow-[0_24px_60px_-12px_rgba(17,21,86,0.55),inset_0_1.5px_2px_rgba(255,255,255,0.25)]'
      : glossTheme === 'sky'
      ? 'bg-gradient-to-b from-[#1d9bf0] via-[#4eb8f7] to-[#b8dcf8] border-white/80 shadow-[0_24px_54px_-12px_rgba(29,155,240,0.32),inset_0_1.5px_2px_rgba(255,255,245,0.85)]'
      : isGlobalDark
      ? 'bg-gradient-to-b from-[#0c0d14] via-[#11131c] to-[#08090e] backdrop-blur-3xl border-white/15 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.85),inset_0_1px_1.5px_rgba(255,255,255,0.12)]'
      : 'bg-gradient-to-b from-white/[0.90] via-slate-50/[0.84] to-white/[0.78] backdrop-blur-3xl border-white/95 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,1)]';

  return (
    <div
      className={`relative overflow-hidden rounded-[32px] border p-6 sm:p-8 transition-all duration-500 flex flex-col justify-between ${graphCardSurfaceClass} ${className}`}
    >
      {/* Subtle glossy ambient light orb inside the graph card */}
      <div
        className={`pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-[75%] h-56 rounded-full blur-3xl transition-opacity duration-500 ${
          glossTheme === 'midnight'
            ? 'bg-indigo-500/35 opacity-90'
            : glossTheme === 'sky'
            ? 'bg-white/55 opacity-95'
            : isGlobalDark
            ? 'bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-purple-500/15 opacity-80'
            : 'bg-gradient-to-r from-sky-300/30 via-pink-300/25 to-indigo-300/25 opacity-90'
        }`}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-start sm:items-center gap-3.5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
              isDarkGraph
                ? 'bg-white/15 border border-white/35 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]'
                : 'bg-white/95 border border-white text-slate-900 shadow-[0_4px_12px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)]'
            }`}
          >
            <BarChart3 className="w-5 h-5 stroke-[2.3]" />
          </div>
          <div>
            <h3
              className={`text-[18px] sm:text-[20px] font-bold tracking-tight leading-snug ${
                isDarkGraph ? 'text-white' : 'text-slate-900'
              }`}
            >
              {title}
            </h3>
            <p
              className={`text-[12.5px] sm:text-[13px] font-medium ${
                isDarkGraph ? 'text-white/80' : 'text-slate-500'
              }`}
            >
              {subtitle}
            </p>
          </div>
        </div>

        {/* Glossy Theme & Style Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className={`inline-flex items-center gap-1 p-1 rounded-full border backdrop-blur-xl ${
              isDarkGraph
                ? 'bg-white/15 border-white/30'
                : 'bg-white/80 border-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]'
            }`}
          >
            <button
              type="button"
              onClick={() => setGlossTheme('frosted')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                glossTheme === 'frosted'
                  ? isGlobalDark
                    ? 'bg-white/20 text-white border border-white/25 shadow-xs'
                    : 'bg-white text-slate-900 shadow-xs'
                  : isDarkGraph
                  ? 'text-white/80 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-sky-400 to-pink-400 border border-white" />
              Frosted
            </button>
            <button
              type="button"
              onClick={() => setGlossTheme('sky')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                glossTheme === 'sky'
                  ? 'bg-white text-[#0284c7] shadow-xs'
                  : isDarkGraph
                  ? 'text-white/80 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#38bdf8] border border-white" />
              Sky Glass
            </button>
            <button
              type="button"
              onClick={() => setGlossTheme('midnight')}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                glossTheme === 'midnight'
                  ? 'bg-white text-[#111852] shadow-xs'
                  : isDarkGraph
                  ? 'text-white/80 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#1e1b4b] border border-indigo-300" />
              Midnight
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setChartStyle(prev => (prev === 'glossy-bars' ? 'area' : 'glossy-bars'))
            }
            title="Switch chart view"
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              isDarkGraph
                ? 'bg-white/15 border-white/30 text-white hover:bg-white/25'
                : 'bg-white/85 border-white text-slate-700 hover:bg-white shadow-[0_2px_10px_rgba(15,23,42,0.04)]'
            }`}
          >
            {chartStyle === 'glossy-bars' ? (
              <>
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Wave View</span>
              </>
            ) : (
              <>
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Glossy Bars</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative z-10 w-full flex-1" style={{ minHeight: chartHeight }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          {chartStyle === 'glossy-bars' ? (
            <BarChart
              data={data}
              margin={{ top: 20, right: 20, left: 0, bottom: 4 }}
              barCategoryGap="18%"
            >
              <defs>
                <linearGradient id={`${uid}-glossSideSheen`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id={`${uid}-glossTopInnerGlow`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id={`${uid}-glossBorderStroke`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.95} />
                  <stop offset="50%" stopColor="#ffffff" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0.15} />
                </linearGradient>
                <linearGradient id={`${uid}-glossLeftSpecStroke`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.92} />
                  <stop offset="60%" stopColor="#ffffff" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0.08} />
                </linearGradient>

                {/* FROSTED LIGHT THEME GRADIENTS */}
                <linearGradient id={`${uid}-glossBarFill-frosted-0`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dbeafe" stopOpacity={0.95} />
                  <stop offset="35%" stopColor="#93c5fd" stopOpacity={0.9} />
                  <stop offset="70%" stopColor="#c084fc" stopOpacity={0.92} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.95} />
                </linearGradient>
                <linearGradient id={`${uid}-glossBarFill-frosted-1`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#bae6fd" stopOpacity={0.95} />
                  <stop offset="40%" stopColor="#60a5fa" stopOpacity={0.92} />
                  <stop offset="75%" stopColor="#a855f7" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.92} />
                </linearGradient>
                <linearGradient id={`${uid}-glossBarFill-frosted-2`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e0e7ff" stopOpacity={0.95} />
                  <stop offset="40%" stopColor="#818cf8" stopOpacity={0.92} />
                  <stop offset="75%" stopColor="#c084fc" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#9333ea" stopOpacity={0.92} />
                </linearGradient>
                <linearGradient id={`${uid}-glossBarFill-frosted-3`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dbeafe" stopOpacity={0.95} />
                  <stop offset="40%" stopColor="#38bdf8" stopOpacity={0.92} />
                  <stop offset="75%" stopColor="#e879f9" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.92} />
                </linearGradient>

                {/* SKY BLUE THEME GRADIENTS */}
                <linearGradient id={`${uid}-glossBarFill-sky-0`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity={0.9} />
                  <stop offset="45%" stopColor="#38bdf8" stopOpacity={0.95} />
                  <stop offset="80%" stopColor="#c084fc" stopOpacity={0.92} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0.95} />
                </linearGradient>
                <linearGradient id={`${uid}-glossBarFill-sky-1`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0369a1" stopOpacity={0.92} />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity={0.95} />
                  <stop offset="85%" stopColor="#e879f9" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.92} />
                </linearGradient>
                <linearGradient id={`${uid}-glossBarFill-sky-2`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.92} />
                  <stop offset="45%" stopColor="#818cf8" stopOpacity={0.95} />
                  <stop offset="80%" stopColor="#d946ef" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.92} />
                </linearGradient>
                <linearGradient id={`${uid}-glossBarFill-sky-3`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity={0.92} />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity={0.95} />
                  <stop offset="85%" stopColor="#c084fc" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.92} />
                </linearGradient>

                {/* MIDNIGHT BLUE THEME GRADIENTS */}
                <linearGradient id={`${uid}-glossBarFill-midnight-0`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e3a8a" stopOpacity={0.92} />
                  <stop offset="40%" stopColor="#3b82f6" stopOpacity={0.95} />
                  <stop offset="80%" stopColor="#8b5cf6" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.95} />
                </linearGradient>
                <linearGradient id={`${uid}-glossBarFill-midnight-1`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.92} />
                  <stop offset="45%" stopColor="#6366f1" stopOpacity={0.95} />
                  <stop offset="85%" stopColor="#a855f7" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity={0.95} />
                </linearGradient>
                <linearGradient id={`${uid}-glossBarFill-midnight-2`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.92} />
                  <stop offset="45%" stopColor="#7c3aed" stopOpacity={0.95} />
                  <stop offset="85%" stopColor="#c084fc" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#d946ef" stopOpacity={0.95} />
                </linearGradient>
                <linearGradient id={`${uid}-glossBarFill-midnight-3`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e40af" stopOpacity={0.92} />
                  <stop offset="45%" stopColor="#4f46e5" stopOpacity={0.95} />
                  <stop offset="85%" stopColor="#9333ea" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.95} />
                </linearGradient>
              </defs>

              <XAxis
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: isDarkGraph ? 'rgba(255,255,255,0.82)' : '#64748b',
                  fontSize: 12,
                  fontWeight: 600
                }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: isDarkGraph ? 'rgba(255,255,255,0.75)' : '#64748b',
                  fontSize: 12,
                  fontWeight: 600
                }}
                tickFormatter={yTickFormatter}
                width={52}
              />
              <Tooltip
                cursor={{
                  fill: isDarkGraph ? 'rgba(255,255,255,0.06)' : 'rgba(14,165,233,0.04)',
                  radius: 16
                }}
                contentStyle={
                  isGlobalDark || isDarkGraph
                    ? {
                        backgroundColor: 'rgba(18, 18, 22, 0.94)',
                        backdropFilter: 'blur(24px)',
                        borderRadius: '18px',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.7)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#f8fafc'
                      }
                    : {
                        backgroundColor: 'rgba(255, 255, 255, 0.94)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '18px',
                        border: '1px solid rgba(255, 255, 255, 1)',
                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0f172a'
                      }
                }
                itemStyle={{ color: isGlobalDark || isDarkGraph ? '#38bdf8' : '#0284c7' }}
                labelStyle={{ color: isGlobalDark || isDarkGraph ? '#f8fafc' : '#0f172a' }}
                formatter={(value: any) => [
                  valueFormatter ? valueFormatter(value) : `${value}`,
                  valueLabel
                ]}
              />
              <Bar
                dataKey={yKey}
                maxBarSize={84}
                shape={(barProps: any) => (
                  <GlossyGlassBar {...barProps} glossTheme={glossTheme} uid={uid} />
                )}
              />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 14, right: 20, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id={`${uid}-lumenAreaGradient`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isDarkGraph ? '#ffffff' : '#0284c7'}
                    stopOpacity={isDarkGraph ? 0.55 : 0.38}
                  />
                  <stop
                    offset="65%"
                    stopColor={isDarkGraph ? '#bae6fd' : '#38bdf8'}
                    stopOpacity={isDarkGraph ? 0.22 : 0.14}
                  />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: isDarkGraph ? 'rgba(255,255,255,0.82)' : '#64748b',
                  fontSize: 12,
                  fontWeight: 600
                }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: isDarkGraph ? 'rgba(255,255,255,0.75)' : '#64748b',
                  fontSize: 12,
                  fontWeight: 600
                }}
                tickFormatter={yTickFormatter}
                width={52}
              />
              <Tooltip
                contentStyle={
                  isGlobalDark || isDarkGraph
                    ? {
                        backgroundColor: 'rgba(18, 18, 22, 0.94)',
                        backdropFilter: 'blur(24px)',
                        borderRadius: '18px',
                        border: '1px solid rgba(255, 255, 255, 0.16)',
                        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.7)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#f8fafc'
                      }
                    : {
                        backgroundColor: 'rgba(255, 255, 255, 0.94)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '18px',
                        border: '1px solid rgba(255, 255, 255, 1)',
                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#0f172a'
                      }
                }
                itemStyle={{ color: isGlobalDark || isDarkGraph ? '#38bdf8' : '#0284c7' }}
                labelStyle={{ color: isGlobalDark || isDarkGraph ? '#f8fafc' : '#0f172a' }}
                formatter={(value: any) => [
                  valueFormatter ? valueFormatter(value) : `${value}`,
                  valueLabel
                ]}
              />
              <Area
                type="monotone"
                dataKey={yKey}
                stroke={isDarkGraph ? '#ffffff' : '#0284c7'}
                strokeWidth={3}
                fill={`url(#${uid}-lumenAreaGradient)`}
                dot={{
                  r: 5,
                  fill: isDarkGraph ? '#38bdf8' : '#0284c7',
                  stroke: '#ffffff',
                  strokeWidth: 2.5
                }}
                activeDot={{
                  r: 7,
                  fill: isDarkGraph ? '#38bdf8' : '#0284c7',
                  stroke: '#ffffff',
                  strokeWidth: 2.5
                }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export interface GlassCapsuleBarProps {
  key?: React.Key;
  percentage?: number;
  pct?: number;
  darkMode?: boolean;
  mode?: 'light' | 'dark';
  height?: number;
  heightClass?: string;
  className?: string;
}

export function GlassCapsuleBar({
  percentage,
  pct,
  darkMode,
  mode,
  height,
  heightClass = 'h-3.5',
  className = ''
}: GlassCapsuleBarProps) {
  const { resolvedTheme } = useAppContext();
  const rawPct = percentage !== undefined ? percentage : pct !== undefined ? pct : 0;
  const clamped = Math.min(100, Math.max(8, Number(rawPct) || 0));
  const isDark =
    darkMode !== undefined
      ? darkMode
      : resolvedTheme === 'dark'
      ? true
      : mode === 'dark';

  return (
    <div
      style={height ? { height: `${height}px` } : undefined}
      className={`w-full ${height ? '' : heightClass} rounded-full overflow-hidden relative p-[2px] transition-colors duration-300 ${
        isDark
          ? 'bg-white/[0.08] border border-white/15 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]'
          : 'bg-slate-200/75 border border-white shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)]'
      } ${className}`}
    >
      <div
        style={{ width: `${clamped}%` }}
        className={`h-full rounded-full relative overflow-hidden transition-all duration-500 ${
          isDark
            ? 'bg-gradient-to-r from-[#818cf8] via-[#c084fc] to-[#f472b6] shadow-[0_0_14px_rgba(192,132,252,0.55)]'
            : 'bg-gradient-to-r from-[#38bdf8] via-[#818cf8] to-[#c084fc] shadow-[0_2px_10px_rgba(129,140,248,0.35)]'
        }`}
      >
        {/* Top glossy specular reflection strip */}
        <div className="absolute inset-x-1 top-[1px] h-[38%] rounded-full bg-gradient-to-b from-white/75 to-white/0 pointer-events-none" />
      </div>
    </div>
  );
}

export interface GlassCircularGaugeProps {
  key?: React.Key;
  uid?: string;
  percentage: number;
  label: string;
  sublabel?: string;
  actual?: number;
  target?: number;
  usedLabel?: string;
  totalLabel?: string;
  buttonLabel?: string;
  onPrevClick?: () => void;
  darkMode?: boolean;
  onToggleTheme?: () => void;
}

export function GlassCircularGauge({
  uid = 'gauge',
  percentage,
  label,
  actual = 0,
  target = 5000,
  usedLabel,
  totalLabel,
  buttonLabel,
  onPrevClick,
  darkMode = true,
  onToggleTheme
}: GlassCircularGaugeProps) {
  const clamped = Math.min(100, Math.max(0, Number(percentage) || 0));
  const visualPct = clamped === 0 ? 62 : clamped;
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (visualPct / 100) * circumference;

  const displayUsed = usedLabel || `Produced (${actual.toLocaleString()})`;
  const displayTotal = totalLabel || `Target (${target.toLocaleString()})`;
  const displayBtn = buttonLabel || `${actual.toLocaleString()} / ${target.toLocaleString()}`;

  return (
    <div
      className={`relative rounded-[32px] p-6 sm:p-7 flex flex-col justify-between h-full transition-all duration-500 overflow-hidden border ${
        darkMode
          ? 'bg-[#12131a] border-white/15 text-white shadow-[0_24px_60px_rgba(0,0,0,0.55),inset_0_1px_1px_rgba(255,255,255,0.12)]'
          : 'bg-white/[0.85] backdrop-blur-3xl border-white text-slate-900 shadow-[0_20px_50px_-10px_rgba(15,23,42,0.07),inset_0_1.5px_2px_rgba(255,255,255,1)]'
      }`}
    >
      {/* Ambient center purple glow */}
      <div
        className={`pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl transition-opacity duration-500 ${
          darkMode ? 'bg-purple-500/20 opacity-90' : 'bg-indigo-300/30 opacity-80'
        }`}
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span
          className={`text-[11px] font-extrabold uppercase tracking-[0.14em] ${
            darkMode ? 'text-white/70' : 'text-slate-400'
          }`}
        >
          TODAY&apos;S OUTPUT TARGET
        </span>
        {onToggleTheme && (
          <button
            type="button"
            onClick={onToggleTheme}
            title={darkMode ? "Switch to Light Theme" : "Switch to Black Theme"}
            aria-label={darkMode ? "Switch to Light Theme" : "Switch to Black Theme"}
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              darkMode
                ? 'bg-white/10 hover:bg-white/20 text-amber-300 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                : 'bg-white/85 hover:bg-white text-slate-700 border border-slate-200/80 shadow-[0_2px_8px_rgba(15,23,42,0.06)]'
            }`}
          >
            {darkMode ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
            )}
          </button>
        )}
      </div>

      {/* Center Circular Ring + Label */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 176 176">
            <defs>
              <linearGradient id={`${uid}-ringGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f0abfc" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#a78bfa" />
              </linearGradient>
              <filter id={`${uid}-glow`} x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Track Circle */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="none"
              stroke={darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.22)'}
              strokeWidth="16"
            />

            {/* Progress Arc */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="none"
              stroke={`url(#${uid}-ringGrad)`}
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              filter={`url(#${uid}-glow)`}
              className="transition-all duration-700 ease-out"
            />

            {/* Crisp white inner rim highlight on progress arc */}
            <circle
              cx="88"
              cy="88"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span
              className={`text-[34px] font-extrabold tracking-tight leading-none tabular-nums ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              {clamped}%
            </span>
            <span
              className={`text-[9.5px] font-bold uppercase tracking-[0.18em] mt-1.5 ${
                darkMode ? 'text-white/60' : 'text-slate-400'
              }`}
            >
              EFFICIENCY
            </span>
          </div>
        </div>

        <h4
          className={`text-[21px] font-extrabold tracking-tight mt-2 ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}
        >
          {label}
        </h4>
      </div>

      {/* Bottom Legend & Pill Action */}
      <div className="relative z-10 flex items-center justify-between gap-2 pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-md ${
                darkMode
                  ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                  : 'bg-[#a855f7] shadow-[0_0_8px_rgba(168,85,247,0.4)]'
              }`}
            />
            <span
              className={`text-[11.5px] font-bold ${
                darkMode ? 'text-white/90' : 'text-slate-700'
              }`}
            >
              {displayUsed}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-md ${
                darkMode ? 'bg-white/20' : 'bg-slate-200'
              }`}
            />
            <span
              className={`text-[11.5px] font-semibold ${
                darkMode ? 'text-white/55' : 'text-slate-400'
              }`}
            >
              {displayTotal}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onPrevClick}
          className={`px-3.5 py-1.5 rounded-xl text-[11.5px] font-bold tabular-nums border transition-all ${
            onPrevClick ? 'cursor-pointer' : 'cursor-default'
          } ${
            darkMode
              ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/20 text-white'
              : 'bg-slate-100/90 hover:bg-slate-200/80 border-slate-200 text-slate-800'
          }`}
        >
          {displayBtn}
        </button>
      </div>
    </div>
  );
}

