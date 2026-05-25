import { dateToString, isBefore, sameDay } from '@/lib/landing/utils';

const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_ES = ['Lu','Ma','Mi','Ju','Vi','Sa','Do'];

interface Props {
  month: number;
  year: number;
  checkIn: Date | null;
  checkOut: Date | null;
  hovered: Date | null;
  blocked: Set<string>;
  onSelectDate: (d: Date) => void;
  onDayHover: (d: Date | null) => void;
  minDate?: Date;
  /** If provided, renders a ‹ button in the month header. */
  onPrev?: () => void;
  /** If provided, renders a › button in the month header. */
  onNext?: () => void;
}

export function Calendar({ month, year, checkIn, checkOut, hovered, blocked, onSelectDate, onDayHover, minDate, onPrev, onNext }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = minDate ?? today;

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));

  const effectiveEnd = checkIn && !checkOut ? hovered : checkOut;

  return (
    <div className="lp-cal-month">
      {/* Month header with optional nav buttons */}
      <div className="lp-cal-month-head">
        <button
          className="lp-cal-nav"
          onClick={onPrev}
          aria-label="Mes anterior"
          style={{ visibility: onPrev ? 'visible' : 'hidden' }}
        >
          ‹
        </button>
        <span className="lp-cal-month-title">{MONTHS_ES[month]} {year}</span>
        <button
          className="lp-cal-nav"
          onClick={onNext}
          aria-label="Mes siguiente"
          style={{ visibility: onNext ? 'visible' : 'hidden' }}
        >
          ›
        </button>
      </div>

      <div className="lp-cal-grid">
        {DAYS_ES.map(d => (
          <div key={d} className="lp-cal-dow">{d}</div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`e-${i}`} />;

          const str = dateToString(date);
          const isBlocked = blocked.has(str);
          const isPast    = isBefore(date, cutoff);
          const isStart   = checkIn ? sameDay(date, checkIn) : false;
          const isEnd     = effectiveEnd ? sameDay(date, effectiveEnd) : false;
          const inRange   = checkIn && effectiveEnd && !sameDay(checkIn, effectiveEnd)
            ? date > checkIn && date < effectiveEnd
            : false;
          const disabled  = isBlocked || isPast;

          let cls = 'lp-cal-day';
          if (disabled) cls += ' disabled';
          if (isStart)           cls += ' start';
          if (isEnd && !isStart) cls += ' end';
          if (isStart && isEnd)  cls += ' single';
          if (inRange)           cls += ' in-range';

          return (
            <div
              key={str}
              className={cls}
              onClick={() => !disabled && onSelectDate(date)}
              onMouseEnter={() => !disabled && onDayHover(date)}
              onMouseLeave={() => onDayHover(null)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}
