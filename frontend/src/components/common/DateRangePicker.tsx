import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { createPortal } from 'react-dom';

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  presets?: { label: string; range: DateRange }[];
  format?: (date: Date) => string;
  className?: string;
}

const defaultFormat = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date range',
  disabled = false,
  minDate,
  maxDate,
  presets = [
    { label: 'Today', range: { startDate: new Date(), endDate: new Date() } },
    { label: 'Last 7 days', range: { startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d; })(), endDate: new Date() } },
    { label: 'Last 30 days', range: { startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d; })(), endDate: new Date() } },
    { label: 'Last 90 days', range: { startDate: (() => { const d = new Date(); d.setDate(d.getDate() - 89); return d; })(), endDate: new Date() } },
    { label: 'This month', range: { startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), endDate: new Date() } },
    { label: 'Last month', range: { startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), endDate: new Date(new Date().getFullYear(), new Date().getMonth(), 0) } },
  ],
  format = defaultFormat,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => value.startDate || new Date());
  const [selectionPhase, setSelectionPhase] = useState<'start' | 'end'>('start');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const tempStart = value.startDate;
  const tempEnd = value.endDate;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || popoverRef.current?.contains(e.target as Node)) return;
      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDayClick = (date: Date) => {
    if (disabled) return;
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;

    if (selectionPhase === 'start' || (tempStart && tempEnd)) {
      onChange({ startDate: date, endDate: null });
      setSelectionPhase('end');
    } else {
      const start = tempStart!;
      if (date < start) {
        onChange({ startDate: date, endDate: start });
      } else {
        onChange({ startDate: start, endDate: date });
      }
      setSelectionPhase('start');
      setIsOpen(false);
    }
  };

  const handleDayMouseEnter = (date: Date) => {
    if (selectionPhase === 'end' && tempStart) setHoveredDate(date);
  };

  const isDateInRange = (date: Date) => {
    if (!tempStart || !tempEnd) return false;
    return date >= tempStart && date <= tempEnd;
  };

  const isDateSelected = (date: Date) => {
    if (!tempStart) return false;
    if (tempEnd) return date.getTime() === tempStart.getTime() || date.getTime() === tempEnd.getTime();
    return date.getTime() === tempStart.getTime();
  };

  const isDateHovered = (date: Date) => {
    if (!hoveredDate || !tempStart) return false;
    const start = tempStart < hoveredDate ? tempStart : hoveredDate;
    const end = tempStart > hoveredDate ? tempStart : hoveredDate;
    return date >= start && date <= end;
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const getDaysInMonth = (month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();

    const days: (Date | null)[] = [];
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push(new Date(year, monthIndex - 1, prevMonthLastDay - i));
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, monthIndex, i));
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, monthIndex + 1, i));
    }
    return days;
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const displayValue = value.startDate && value.endDate
    ? `${format(value.startDate)} – ${format(value.endDate)}`
    : value.startDate
    ? `${format(value.startDate)} – ...`
    : placeholder;

  const popoverContent = (
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: '8px',
        zIndex: 100,
        backgroundColor: 'var(--bg-cards)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        animation: 'slideUp 0.15s ease',
        minWidth: '320px',
      }}
      role="dialog"
      aria-label="Date range picker"
    >
      {/* Presets */}
      {presets.length > 0 && (
        <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
            Quick Select
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {presets.map((preset, i) => (
              <button
                key={i}
                onClick={() => { onChange(preset.range); setIsOpen(false); setSelectionPhase('start'); }}
                disabled={disabled}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontSize: '12px',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}}
                onMouseLeave={(e) => { if (!disabled) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Calendars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '16px' }}>
        {['start', 'end'].map((type, calIndex) => {
          const isStart = type === 'start';
          const selectedDate = isStart ? tempStart : tempEnd;
          
          return (
            <div key={type} style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderRight: calIndex === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingRight: calIndex === 0 ? '16px' : '0' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: isDateSelected(selectedDate!) ? 'var(--accent-primary)' : 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {isStart ? 'Start Date' : 'End Date'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  disabled={disabled}
                  style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex' }}
                >
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{monthName}</span>
                <button
                  onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  disabled={disabled}
                  style={{ padding: '6px', borderRadius: '6px', backgroundColor: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex' }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 600, color: 'var(--color-text-muted)', padding: '6px 0', textTransform: 'uppercase' }}>
                    {day}
                  </div>
                ))}
                {days.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const selected = isDateSelected(day);
                  const inRange = isDateInRange(day);
                  const hovered = isDateHovered(day);
                  const disabledDay = isDateDisabled(day);

                  return (
                    <button
                      key={i}
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => handleDayMouseEnter(day)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={disabled || disabledDay}
                      style={{
                        padding: '8px 0',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: selected ? 'var(--accent-primary)' : inRange || hovered ? 'rgba(59,130,246,0.1)' : 'transparent',
                        color: disabledDay ? 'var(--color-text-muted)' : selected ? '#fff' : isCurrentMonth ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                        fontSize: '13px',
                        fontWeight: selected || hovered ? 600 : 400,
                        cursor: disabled || disabledDay ? 'not-allowed' : 'pointer',
                        transition: 'all 0.1s',
                        position: 'relative',
                      }}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <Button variant="ghost" size="sm" onClick={() => { onChange({ startDate: null, endDate: null }); setIsOpen(false); setSelectionPhase('start'); }}>Clear</Button>
        <Button variant="primary" size="sm" onClick={() => setIsOpen(false)} disabled={!tempStart || !tempEnd}>Apply</Button>
      </div>
    </div>
  );

  return (
    <div className={className} style={{ position: 'relative', display: 'inline-block' }}>
      <Button
        ref={triggerRef}
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        leftIcon={<Calendar size={18} />}
        rightIcon={<ChevronDown size={16} />}
        style={{ justifyContent: 'space-between', minWidth: '280px' }}
      >
        <span style={{ textAlign: 'left', color: value.startDate ? 'var(--color-text-primary)' : 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayValue}
        </span>
      </Button>
      {isOpen && typeof window !== 'undefined' && createPortal(popoverContent, document.body)}
    </div>
  );
};