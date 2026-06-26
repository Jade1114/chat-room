import { useState, useMemo } from 'react';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstWeekdayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function formatDisplay(iso: string) {
  if (!iso) return null;
  // iso is "YYYY-MM-DDTHH:mm"
  const [datePart, timePart] = iso.split('T');
  const [, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');
  return `${Number(month)}月${Number(day)}日 ${hour}:${minute}`;
}

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
}

export function DateTimePicker({ value, onChange, placeholder = '选择时间', label }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(
    value ? Number(value.slice(0, 4)) : now.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState(
    value ? Number(value.slice(5, 7)) - 1 : now.getMonth()
  );

  const [selectedDay, setSelectedDay] = useState(
    value ? Number(value.slice(8, 10)) : now.getDate()
  );
  const [selectedHour, setSelectedHour] = useState(
    value ? value.slice(11, 13) : '12'
  );
  const [selectedMinute, setSelectedMinute] = useState(
    value ? value.slice(14, 16) : '00'
  );

  const days = useMemo(() => {
    const total = daysInMonth(viewYear, viewMonth);
    const start = firstWeekdayOfMonth(viewYear, viewMonth);
    const cells: (number | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    return cells;
  }, [viewYear, viewMonth]);

  function confirm() {
    const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}T${selectedHour}:${selectedMinute}`;
    onChange(iso);
    setOpen(false);
  }

  function clear() {
    onChange('');
    setOpen(false);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  const display = formatDisplay(value);

  return (
    <>
      <label className="grid gap-2 text-sm font-bold text-primary">
        {label}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`w-full rounded-2xl border border-divider bg-surface px-4 py-3 text-left text-sm outline-none transition focus:border-accent-soft ${
            display ? 'text-primary' : 'text-faint'
          }`}
        >
          {display || placeholder}
        </button>
      </label>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-divider bg-card shadow-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-divider px-5 py-4">
              <button type="button" onClick={prevMonth} className="grid size-9 place-items-center rounded-xl bg-active text-muted transition hover:bg-hover hover:text-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <span className="text-sm font-bold text-strong">
                {viewYear} 年 {viewMonth + 1} 月
              </span>
              <button type="button" onClick={nextMonth} className="grid size-9 place-items-center rounded-xl bg-active text-muted transition hover:bg-hover hover:text-primary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>

            {/* Weekday header */}
            <div className="grid grid-cols-7 px-3 pt-3">
              {WEEKDAYS.map((w) => (
                <div key={w} className="pb-2 text-center text-[10px] font-bold uppercase text-faint">{w}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 px-3 pb-2">
              {days.map((day, i) => (
                <div key={i} className="grid place-items-center">
                  {day !== null ? (
                    <button
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`grid size-9 place-items-center rounded-xl text-sm font-semibold transition ${
                        day === selectedDay
                          ? 'bg-accent text-on-accent shadow-sm'
                          : 'text-primary hover:bg-hover'
                      }`}
                    >
                      {day}
                    </button>
                  ) : (
                    <span className="size-9" />
                  )}
                </div>
              ))}
            </div>

            {/* Time selectors */}
            <div className="flex items-center gap-3 border-t border-divider px-5 py-4">
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(e.target.value)}
                className="flex-1 rounded-xl border border-divider bg-surface px-3 py-2.5 text-center text-sm font-semibold text-primary outline-none transition focus:border-accent-soft"
              >
                {HOURS.map((h) => <option key={h} value={h}>{h} 时</option>)}
              </select>
              <span className="text-lg font-bold text-faint">:</span>
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(e.target.value)}
                className="flex-1 rounded-xl border border-divider bg-surface px-3 py-2.5 text-center text-sm font-semibold text-primary outline-none transition focus:border-accent-soft"
              >
                {MINUTES.map((m) => <option key={m} value={m}>{m} 分</option>)}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 border-t border-divider px-5 py-4">
              {value && (
                <button type="button" onClick={clear} className="rounded-xl px-4 py-2.5 text-sm font-bold text-muted transition hover:bg-hover hover:text-primary">
                  清除
                </button>
              )}
              <button type="button" onClick={confirm} className="ml-auto rounded-xl bg-accent px-6 py-2.5 text-sm font-bold text-on-accent shadow-sm transition hover:bg-accent-hover">
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
