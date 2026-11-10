import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { SearchX, Inbox, RotateCcw, ChevronDown, Check, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
export { GlossyGlassBar, GlossyChartCard, GlassCapsuleBar, GlassCircularGauge } from './glass/GlassCharts';
export type { GlossTheme, ChartStyle, GlossyChartCardProps, GlassCapsuleBarProps, GlassCircularGaugeProps } from './glass/GlassCharts';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ElementType;
  isSearch?: boolean;
  onReset?: () => void;
  resetLabel?: string;
  action?: React.ReactNode;
}

export function GlassEmptyState({
  title,
  description,
  icon,
  isSearch = false,
  onReset,
  resetLabel = 'Clear Filters',
  action,
}: EmptyStateProps) {
  const IconComponent = icon || (isSearch ? SearchX : Inbox);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      className="flex flex-col items-center justify-center text-center py-14 px-6"
    >
      <div className="w-14 h-14 rounded-[22px] bg-white/90 border-[1.5px] border-white shadow-[0_8px_24px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,1)] flex items-center justify-center mb-4 text-[#0284c7]">
        <IconComponent className="w-6 h-6 stroke-[1.9]" />
      </div>
      <h4 className="text-[16px] font-bold text-slate-900 tracking-tight">{title}</h4>
      <p className="text-[13.5px] text-slate-600 max-w-sm mt-1 leading-relaxed font-medium">
        {description}
      </p>
      {(onReset || action) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="glass-pill-button px-4 py-2 text-[12.5px] font-semibold text-slate-700 inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>{resetLabel}</span>
            </button>
          )}
          {action}
        </div>
      )}
    </motion.div>
  );
}

export function TableSkeletonRows({ columns = 6, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="px-6 py-4">
              {colIndex === 0 ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-slate-200/75 border border-white shrink-0" />
                  <div className="space-y-2 flex-1 min-w-[110px]">
                    <div className="h-3.5 w-32 rounded-full bg-slate-200/85" />
                    <div className="h-2.5 w-20 rounded-full bg-slate-200/60" />
                  </div>
                </div>
              ) : colIndex === columns - 1 ? (
                <div className="flex justify-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200/75 border border-white" />
                  <div className="w-8 h-8 rounded-full bg-slate-200/75 border border-white" />
                </div>
              ) : (
                <div
                  className={`h-3.5 rounded-full bg-slate-200/75 ${
                    colIndex % 2 === 0 ? 'w-24' : 'w-16'
                  }`}
                />
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CardListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="glass-card p-6 rounded-[28px] animate-pulse flex flex-col lg:flex-row lg:items-center gap-6"
        >
          <div className="w-12 h-12 rounded-2xl bg-slate-200/80 border border-white shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="h-4 w-36 rounded-full bg-slate-200/85" />
              <div className="h-4 w-20 rounded-full bg-slate-200/65" />
            </div>
            <div className="h-3 w-56 rounded-full bg-slate-200/65" />
          </div>
          <div className="lg:w-40 space-y-2">
            <div className="h-3 w-24 rounded-full bg-slate-200/70" />
            <div className="h-3 w-28 rounded-full bg-slate-200/60" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 w-24 rounded-full bg-slate-200/75" />
            <div className="h-9 w-9 rounded-full bg-slate-200/75" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="w-full space-y-6 pb-16 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
        <div className="space-y-2.5">
          <div className="h-3 w-36 rounded-full bg-sky-200/70" />
          <div className="h-8 w-64 rounded-full bg-slate-200/85" />
          <div className="h-4 w-80 max-w-full rounded-full bg-slate-200/65" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-10 w-28 rounded-full bg-white/80 border border-white" />
          <div className="h-10 w-28 rounded-full bg-white/80 border border-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-5 rounded-[28px] flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-200/75 border border-white shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-2.5 w-20 rounded-full bg-slate-200/70" />
              <div className="h-6 w-24 rounded-full bg-slate-200/90" />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6 sm:p-8 rounded-[32px] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-200/75 border border-white" />
            <div className="space-y-2">
              <div className="h-4 w-44 rounded-full bg-slate-200/85" />
              <div className="h-3 w-64 rounded-full bg-slate-200/65" />
            </div>
          </div>
        </div>
        <div className="h-[250px] w-full rounded-2xl bg-white/55 border border-white/80" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 glass-card p-6 sm:p-7 rounded-[32px] space-y-4">
          <div className="h-5 w-40 rounded-full bg-slate-200/85" />
          <div className="space-y-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-5 w-28 rounded-full bg-slate-200/75" />
                  <div className="h-4 w-14 rounded-full bg-slate-200/65" />
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200/60" />
              </div>
            ))}
          </div>
        </div>
        <div className="md:col-span-7 glass-card p-6 sm:p-7 rounded-[32px] space-y-4">
          <div className="h-5 w-52 rounded-full bg-slate-200/85" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 rounded-2xl bg-white/75 border border-white" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 rounded-2xl bg-white/75 border border-white" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



// Reusable Apple iOS 26 Glass Pagination Component
export interface GlassPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

export function GlassPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = 'records',
  className = ''
}: GlassPaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with intelligent windowing
  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    const startWindow = Math.max(2, currentPage - 1);
    const endWindow = Math.min(totalPages - 1, currentPage + 1);
    for (let i = startWindow; i <= endWindow; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <div className={`p-5 px-7 border-t border-slate-200/60 bg-white/40 flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      <span className="text-xs font-semibold text-slate-500">
        Showing <span className="font-bold text-slate-900">{start}–{end}</span> of{' '}
        <span className="font-bold text-slate-900">{totalItems}</span> {itemLabel}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Previous Page"
          className="w-8 h-8 rounded-full border border-white bg-white/75 hover:bg-white text-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(15,23,42,0.04)] cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <span key={`el-${idx}`} className="w-8 text-center text-xs text-slate-400">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition-all cursor-pointer ${
                currentPage === p
                  ? 'bg-gradient-to-r from-[#0284c7] to-sky-500 text-white shadow-[0_4px_12px_rgba(2,132,199,0.3)]'
                  : 'bg-white/75 hover:bg-white border border-white text-slate-700 shadow-2xs'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Next Page"
          className="w-8 h-8 rounded-full border border-white bg-white/75 hover:bg-white text-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-all shadow-[0_2px_8px_rgba(15,23,42,0.04)] cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Reusable Apple iOS 26 Segmented Filter Pill Tabs modeled after image_00f5feb3.png
export interface GlassPillTabsProps<T extends string = string> {
  options: readonly T[] | T[];
  value: T;
  onChange: (val: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function GlassPillTabs<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
  size = 'md'
}: GlassPillTabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center gap-1.5 p-1 rounded-full bg-slate-200/50 backdrop-blur-xl border border-white/90 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] ${className}`}
    >
      {options.map((opt) => {
        const isSelected = value === opt;
        const padClass = size === 'sm' ? 'px-3.5 py-1 text-[11.5px]' : 'px-4 py-1.5 text-[12.5px]';
        return (
          <button
            key={opt}
            role="tab"
            aria-selected={isSelected}
            type="button"
            onClick={() => onChange(opt)}
            className={`${padClass} rounded-full font-semibold transition-all duration-200 cursor-pointer ${
              isSelected
                ? 'bg-white text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.08),inset_0_1px_1px_rgba(255,255,255,1)]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}



interface GlassSelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface GlassSelectProps {
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: any) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  children?: React.ReactNode;
  id?: string;
  name?: string;
}

export function GlassSelect({
  value,
  defaultValue,
  onChange,
  disabled = false,
  className = '',
  children,
  id,
  name
}: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState<string>(
    defaultValue !== undefined ? String(defaultValue) : ''
  );
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    width: 220,
    placeAbove: false
  });

  // Extract <option> elements from children (supports nested arrays/fragments)
  const options: GlassSelectOption[] = [];
  const extractOptions = (nodes: React.ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return;
      if (child.type === 'option') {
        const props = child.props as any;
        const optVal =
          props.value !== undefined
            ? String(props.value)
            : typeof props.children === 'string' || typeof props.children === 'number'
            ? String(props.children)
            : '';
        options.push({
          value: optVal,
          label: props.children,
          disabled: Boolean(props.disabled)
        });
      } else if ((child.props as any)?.children) {
        extractOptions((child.props as any).children);
      }
    });
  };
  extractOptions(children);

  const isControlled = value !== undefined;
  const activeValue = isControlled
    ? String(value)
    : internalValue !== ''
    ? internalValue
    : options[0]?.value ?? '';

  const selectedOption =
    options.find((o) => o.value === activeValue) || options[0] || { value: '', label: 'Select...' };

  const updateMenuPosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const estimatedHeight = Math.min(280, options.length * 42 + 16);
    const placeAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
    setMenuPos({
      top: placeAbove ? rect.top - 8 : rect.bottom + 8,
      left: rect.left,
      width: Math.max(rect.width, 190),
      placeAbove
    });
  };

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const handleScrollOrResize = (e: Event) => {
      if (menuRef.current && e.target && menuRef.current.contains(e.target as Node)) {
        return;
      }
      updateMenuPosition();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [open, options.length]);

  const handleSelect = (opt: GlassSelectOption) => {
    if (opt.disabled) return;
    if (!isControlled) {
      setInternalValue(opt.value);
    }
    onChange?.({
      target: { value: opt.value, name, id },
      currentTarget: { value: opt.value, name, id }
    });
    setOpen(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            updateMenuPosition();
            setOpen((prev) => !prev);
          }
        }}
        className={`w-full text-left flex items-center justify-between gap-2 rounded-2xl bg-white/90 hover:bg-white border border-white px-4 py-3 text-[13.5px] font-semibold text-slate-900 shadow-[0_2px_10px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all ${
          disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
      >
        <span className="truncate">{selectedOption.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-[#0284c7]' : ''
          }`}
        />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && !disabled && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: menuPos.placeAbove ? 6 : -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: menuPos.placeAbove ? 6 : -6, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                style={{
                  position: 'fixed',
                  top: menuPos.placeAbove ? undefined : menuPos.top,
                  bottom: menuPos.placeAbove ? window.innerHeight - menuPos.top : undefined,
                  left: menuPos.left,
                  width: menuPos.width,
                  zIndex: 9999
                }}
                className="rounded-2xl bg-white/95 backdrop-blur-3xl border-[1.5px] border-white shadow-[0_20px_50px_rgba(15,23,42,0.16),0_4px_14px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,1)] p-1.5 max-h-64 overflow-y-auto"
              >
                {options.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(activeValue);
                  return (
                    <button
                      key={`${opt.value}-${idx}`}
                      type="button"
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all flex items-center justify-between gap-2 ${
                        opt.disabled
                          ? 'text-slate-300 cursor-not-allowed'
                          : isSelected
                          ? 'text-[#0284c7] bg-sky-50/90 cursor-pointer'
                          : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900 cursor-pointer'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#0284c7] shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

interface GlassToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  id?: string;
  name?: string;
}

export function GlassToggle({
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
  id
}: GlassToggleProps) {
  const [internalChecked, setInternalChecked] = useState<boolean>(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? Boolean(checked) : internalChecked;

  const handleToggle = () => {
    if (disabled) return;
    const next = !isChecked;
    if (!isControlled) setInternalChecked(next);
    onChange?.(next);
  };

  const trackSize = size === 'sm' ? 'w-[44px] h-[25px] p-[2.5px]' : 'w-[50px] h-[28px] p-[3px]';
  const thumbSize = size === 'sm' ? 'w-[18px] h-[18px]' : 'w-[20px] h-[20px]';
  const thumbTranslate = size === 'sm' ? 'translate-x-[19px]' : 'translate-x-[22px]';

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={handleToggle}
      className={`${trackSize} rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] border relative inline-flex items-center shrink-0 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${
        isChecked
          ? 'bg-gradient-to-r from-[#0284c7] via-sky-400 to-cyan-400 border-white/80 shadow-[0_4px_12px_rgba(2,132,199,0.28),inset_0_1px_1.5px_rgba(255,255,255,0.45)]'
          : 'bg-slate-200/80 border-white/90 shadow-[inset_0_2px_4px_rgba(15,23,42,0.08)]'
      } ${className}`}
    >
      <div
        className={`${thumbSize} bg-white rounded-full shadow-[0_2px_6px_rgba(15,23,42,0.2),inset_0_1px_1px_rgba(255,255,255,1)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isChecked ? thumbTranslate : 'translate-x-0'
        }`}
      />
    </button>
  );
}

interface GlassDatePickerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (e: any) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function parseIsoDate(str?: string): Date | null {
  if (!str) return null;
  const clean = str.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const fallback = new Date(str);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function toIsoDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr?: string, placeholder = 'dd/mm/yyyy'): string {
  const d = parseIsoDate(dateStr);
  if (!d) return placeholder;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

// Apple iOS 26 Liquid Glass Calendar Picker modeled directly after image_662d57fe.png
export function GlassDatePicker({
  value,
  defaultValue,
  onChange,
  disabled = false,
  placeholder = 'dd/mm/yyyy',
  className = '',
  id,
  name
}: GlassDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [internalVal, setInternalVal] = useState<string>(defaultValue || '');
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internalVal;

  const parsedSelected = parseIsoDate(activeValue);
  const today = new Date();
  const [viewMonth, setViewMonth] = useState<number>(
    parsedSelected ? parsedSelected.getMonth() : today.getMonth()
  );
  const [viewYear, setViewYear] = useState<number>(
    parsedSelected ? parsedSelected.getFullYear() : today.getFullYear()
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; placeAbove: boolean }>({
    top: 0,
    left: 0,
    placeAbove: false
  });

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const calWidth = Math.min(370, window.innerWidth - 24);
    const calHeight = 365;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < calHeight && rect.top > calHeight;
    const left = Math.max(12, Math.min(rect.left, window.innerWidth - calWidth - 12));
    setPos({
      top: placeAbove ? rect.top - 10 : rect.bottom + 10,
      left,
      placeAbove
    });
  };

  useEffect(() => {
    if (!open) return;
    const sel = parseIsoDate(activeValue);
    if (sel) {
      setViewMonth(sel.getMonth());
      setViewYear(sel.getFullYear());
    }
    updatePosition();

    const handleOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const handleReposition = () => updatePosition();

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [open, activeValue]);

  const handleSelectDate = (d: Date) => {
    const iso = toIsoDateString(d);
    if (!isControlled) setInternalVal(iso);
    onChange?.({
      target: { value: iso, name, id },
      currentTarget: { value: iso, name, id }
    });
    setOpen(false);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setViewMonth(now.getMonth());
    setViewYear(now.getFullYear());
    handleSelectDate(now);
  };

  // Build 35 or 42 calendar cells
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: { date: Date; currentMonth: boolean }[] = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({
      date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
      currentMonth: false
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      date: new Date(viewYear, viewMonth, d),
      currentMonth: true
    });
  }
  const totalCells = cells.length <= 35 ? 35 : 42;
  const remaining = totalCells - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({
      date: new Date(viewYear, viewMonth + 1, d),
      currentMonth: false
    });
  }

  const todayIso = toIsoDateString(today);
  const selectedIso = parsedSelected ? toIsoDateString(parsedSelected) : '';

  return (
    <>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            updatePosition();
            setOpen((prev) => !prev);
          }
        }}
        className={`w-full text-left flex items-center justify-between gap-2 rounded-2xl bg-white/90 hover:bg-white border border-white px-4 py-3 text-[13.5px] font-semibold shadow-[0_2px_10px_rgba(15,23,42,0.03),inset_0_1px_1px_rgba(255,255,255,1)] outline-none focus:ring-2 focus:ring-sky-400/40 transition-all ${
          parsedSelected ? 'text-slate-900' : 'text-slate-500'
        } ${disabled ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      >
        <span className="truncate tabular-nums">{formatDisplayDate(activeValue, placeholder)}</span>
        <Calendar className="w-4 h-4 text-[#0284c7] shrink-0" />
      </button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && !disabled && (
              <motion.div
                ref={popoverRef}
                initial={{ opacity: 0, y: pos.placeAbove ? 8 : -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: pos.placeAbove ? 8 : -8, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                style={{
                  position: 'fixed',
                  top: pos.placeAbove ? undefined : pos.top,
                  bottom: pos.placeAbove ? window.innerHeight - pos.top : undefined,
                  left: pos.left,
                  width: Math.min(370, window.innerWidth - 24),
                  zIndex: 99999
                }}
                className="rounded-[32px] bg-gradient-to-br from-white/[0.95] via-slate-50/[0.92] to-pink-50/[0.88] backdrop-blur-3xl border-[1.5px] border-white shadow-[0_28px_70px_-10px_rgba(15,23,42,0.18),0_6px_20px_rgba(15,23,42,0.06),inset_0_1.5px_2px_rgba(255,255,255,1)] p-6 select-none"
              >
                {/* Calendar Header — Modeled directly after image_662d57fe.png */}
                <div className="flex items-center justify-between gap-2 mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-white shadow-[0_4px_12px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center text-[#0284c7] shrink-0">
                      <Calendar className="w-4 h-4 stroke-[2.2]" />
                    </div>
                    <h4 className="text-[18px] sm:text-[19px] font-bold text-slate-900 tracking-tight">
                      {MONTH_NAMES[viewMonth]} {viewYear}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleToday}
                      className="px-3.5 py-1.5 rounded-full bg-white/95 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)] text-[12px] font-bold text-slate-800 transition-all cursor-pointer"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="w-8 h-8 rounded-full bg-white/95 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="w-8 h-8 rounded-full bg-white/95 hover:bg-white border border-white shadow-[0_2px_10px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {WEEKDAYS.map((wd) => (
                    <div
                      key={wd}
                      className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.12em] py-1.5"
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-y-1.5 gap-x-1">
                  {cells.map((cell, idx) => {
                    const cellIso = toIsoDateString(cell.date);
                    const isSelected = cellIso === selectedIso;
                    const isToday = cellIso === todayIso;
                    const dayNum = cell.date.getDate();

                    return (
                      <button
                        key={`${cellIso}-${idx}`}
                        type="button"
                        onClick={() => handleSelectDate(cell.date)}
                        className={`group relative h-11 rounded-[15px] flex flex-col items-center justify-center transition-all cursor-pointer ${
                          !cell.currentMonth
                            ? 'text-slate-300 font-semibold hover:bg-white/60'
                            : isSelected
                            ? 'bg-white/95 border-[1.5px] border-[#38bdf8] text-slate-900 font-extrabold shadow-[0_4px_14px_rgba(14,165,233,0.14)]'
                            : isToday
                            ? 'bg-white border border-white text-[#0284c7] font-extrabold shadow-[0_6px_18px_rgba(15,23,42,0.08)]'
                            : 'text-slate-800 font-bold hover:bg-white hover:text-[#0284c7] hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)]'
                        }`}
                      >
                        <span className="text-[13px] leading-none tabular-nums">{dayNum}</span>
                        {/* Subtle status dot indicators matching image_662d57fe.png */}
                        {isSelected ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1" />
                        ) : isToday ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1" />
                        ) : cell.currentMonth && dayNum % 9 === 2 ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-transparent group-hover:bg-amber-400 mt-1 transition-colors" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

// Reusable Apple iOS 26 Portal Modal Component
// Ensures all modal dialogs render directly into document.body with a full-screen backdrop
// that reliably sits in front of the sidebar, navigation, and page content.
export interface GlassModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
}

export function GlassModal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  className = ''
}: GlassModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative rounded-[32px] bg-white/[0.82] backdrop-blur-3xl border-[1.5px] border-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.14),inset_0_1px_2px_rgba(255,255,255,1)] w-full ${maxWidth} min-w-[320px] p-6 sm:p-7 overflow-hidden z-10 flex flex-col ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}



