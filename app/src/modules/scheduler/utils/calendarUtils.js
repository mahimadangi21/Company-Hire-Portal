/**
 * calendarUtils.js
 * Pure functions for calendar layout, date math, and event positioning.
 * All functions are side-effect-free and fully testable.
 */

// ─── Constants ────────────────────────────────────────────────────────────────
export const PIXELS_PER_MIN = 2;        // 1 hour = 120px
export const START_HOUR     = 7;        // 7:00 AM
export const END_HOUR       = 22;       // 10:00 PM
export const SLOT_MINUTES   = 15;       // snap interval
export const TOTAL_MINS     = (END_HOUR - START_HOUR) * 60;
export const CALENDAR_HEIGHT = TOTAL_MINS * PIXELS_PER_MIN; // 1800px

export const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAYS_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Date Navigation ─────────────────────────────────────────────────────────

/** Add N days to a date, returns new Date */
export const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

/** Add N weeks */
export const addWeeks = (date, n) => addDays(date, n * 7);

/** Add N months */
export const addMonths = (date, n) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
};

/** Get Monday of the week containing date */
export const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Get array of 7 Date objects for week starting from Monday */
export const getWeekDays = (date) => {
  const start = getWeekStart(date);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
};

/** Get first day of month */
export const getMonthStart = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get all days to render in a month grid (padded with prev/next month days).
 * Returns array of { date, isCurrentMonth, isToday }
 */
export const getMonthGrid = (date) => {
  const start = getMonthStart(date);
  const year  = date.getFullYear();
  const month = date.getMonth();
  const firstDOW = start.getDay(); // 0=Sun

  // Pad from Monday: if month starts on Wed (3), show Mon + Tue from prev month
  const padStart = firstDOW === 0 ? 6 : firstDOW - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells  = Math.ceil((padStart + daysInMonth) / 7) * 7;

  return Array.from({ length: totalCells }, (_, i) => {
    const d = addDays(addDays(start, -padStart), i);
    return {
      date: d,
      isCurrentMonth: d.getMonth() === month,
      isToday: isToday(d),
    };
  });
};

/** Array of { hour, label } from START_HOUR to END_HOUR (exclusive) */
export const getTimeSlots = () =>
  Array.from({ length: END_HOUR - START_HOUR }, (_, i) => {
    const h = START_HOUR + i;
    return { hour: h, label: formatHour(h) };
  });

// ─── Date Comparisons ─────────────────────────────────────────────────────────

export const isToday = (date) => {
  const t = new Date();
  return date.getFullYear() === t.getFullYear() &&
         date.getMonth()    === t.getMonth()    &&
         date.getDate()     === t.getDate();
};

export const isSameDay = (a, b) => {
  if (!a || !b) return false;
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
         da.getMonth()    === db.getMonth()    &&
         da.getDate()     === db.getDate();
};

export const isPast = (date) => new Date(date) < new Date();

/** Returns 'YYYY-MM-DD' string key for a date */
export const getDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// ─── Time Utilities ───────────────────────────────────────────────────────────

/** "HH:MM" → total minutes from midnight */
export const timeToMinutes = (time) => {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
};

/** Total minutes from midnight → "HH:MM" */
export const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
};

/** Snap minutes value to nearest SLOT_MINUTES interval */
export const snapToGrid = (minutes) =>
  Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES;

/** Clamp minutes to valid calendar range [START_HOUR*60, (END_HOUR-1)*60] */
export const clampToCalendar = (minutes) =>
  Math.max(START_HOUR * 60, Math.min((END_HOUR - 1) * 60, minutes));

// ─── Pixel Layout Math ────────────────────────────────────────────────────────

/**
 * Given an event { date, time, duration }, calculate CSS top offset in px.
 * time = "HH:MM", duration = minutes
 */
export const getEventTop = ({ time, duration: _d }) => {
  const totalMins = timeToMinutes(time);
  const offset    = totalMins - START_HOUR * 60;
  return Math.max(0, offset * PIXELS_PER_MIN);
};

/** Calculate CSS height in px for an event of given duration (minutes) */
export const getEventHeight = (duration) =>
  Math.max(duration * PIXELS_PER_MIN, 28); // min 28px = ~14min visible

/**
 * Convert pixel Y offset inside calendar grid to time string.
 * @param {number} pxY - pixels from top of grid
 * @returns {string} "HH:MM" snapped to SLOT_MINUTES
 */
export const pxToTime = (pxY) => {
  const rawMins   = pxY / PIXELS_PER_MIN;
  const totalMins = snapToGrid(START_HOUR * 60 + rawMins);
  return minutesToTime(clampToCalendar(totalMins));
};

/**
 * Convert pixel Y delta (drag movement) to minute change.
 */
export const pxDeltaToMinutes = (pxDelta) =>
  snapToGrid(Math.round(pxDelta / PIXELS_PER_MIN));

// ─── Event Collision Layout ────────────────────────────────────────────────────

/**
 * Do two events overlap in time?
 * @param {Object} a - { time: "HH:MM", duration: number }
 * @param {Object} b - same
 */
export const eventsOverlap = (a, b) => {
  const aStart = timeToMinutes(a.time);
  const aEnd   = aStart + (a.duration || 60);
  const bStart = timeToMinutes(b.time);
  const bEnd   = bStart + (b.duration || 60);
  return aStart < bEnd && aEnd > bStart;
};

/**
 * Enterprise event collision layout algorithm.
 * Assigns each event a { column, totalColumns } so overlapping events
 * render side-by-side (like Google Calendar).
 *
 * @param {Array} events - events on the same day
 * @returns {Array} events with { _col, _totalCols } added
 */
export const calculateEventLayout = (events) => {
  if (!events.length) return [];

  // Sort by start time, then by duration (longer first)
  const sorted = [...events].sort((a, b) => {
    const diff = timeToMinutes(a.time) - timeToMinutes(b.time);
    return diff !== 0 ? diff : (b.duration || 60) - (a.duration || 60);
  });

  const columns = []; // columns[i] = last event end time in that column

  const result = sorted.map((event) => {
    const start = timeToMinutes(event.time);
    const end   = start + (event.duration || 60);

    // Find leftmost free column
    let col = 0;
    while (columns[col] !== undefined && columns[col] > start) {
      col++;
    }
    columns[col] = end;

    return { ...event, _col: col };
  });

  // Pass 2: determine totalColumns for each overlap group
  return result.map((event) => {
    const start = timeToMinutes(event.time);
    const end   = start + (event.duration || 60);

    const maxCol = result
      .filter(e => eventsOverlap(e, event))
      .reduce((max, e) => Math.max(max, e._col), 0);

    return { ...event, _totalCols: maxCol + 1 };
  });
};

// ─── Formatting ───────────────────────────────────────────────────────────────

/** Format hour integer to "7 AM" / "12 PM" / "3 PM" */
export const formatHour = (h) => {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
};

/** Format "HH:MM" to "7:00 AM" / "2:30 PM" */
export const formatTime = (time) => {
  if (!time) return '';
  const [hStr, mStr] = time.split(':');
  const h = parseInt(hStr, 10), m = parseInt(mStr, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour   = h % 12 || 12;
  return `${hour}:${String(m).padStart(2,'0')} ${period}`;
};

/** Format duration minutes to "1h 30m" / "45m" */
export const formatDuration = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

/** Format a Date to "Mon, May 27" */
export const formatDateShort = (date) => {
  const d = new Date(date);
  return `${DAYS_SHORT[d.getDay()]}, ${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
};

/** Format a Date to "May 27, 2026" */
export const formatDateLong = (date) => {
  const d = new Date(date);
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

/** Format week range: "May 26 – Jun 1, 2026" */
export const formatWeekRange = (weekDays) => {
  if (!weekDays.length) return '';
  const first = weekDays[0], last = weekDays[6];
  const sameMonth = first.getMonth() === last.getMonth();
  if (sameMonth) {
    return `${MONTHS_SHORT[first.getMonth()]} ${first.getDate()} – ${last.getDate()}, ${last.getFullYear()}`;
  }
  return `${MONTHS_SHORT[first.getMonth()]} ${first.getDate()} – ${MONTHS_SHORT[last.getMonth()]} ${last.getDate()}, ${last.getFullYear()}`;
};

/** Format Date to "YYYY-MM-DD" (for input[type=date]) */
export const toInputDate = (date) => getDateKey(date);

/** Parse "YYYY-MM-DD" input string to local Date object */
export const fromInputDate = (str) => {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

// ─── Current Time ─────────────────────────────────────────────────────────────

/** Get current time as pixel offset from top of calendar grid */
export const getCurrentTimePx = () => {
  const now   = new Date();
  const mins  = now.getHours() * 60 + now.getMinutes();
  const offset = mins - START_HOUR * 60;
  if (offset < 0 || offset > TOTAL_MINS) return -1;
  return offset * PIXELS_PER_MIN;
};

// ─── Event Grouping (by date key) ─────────────────────────────────────────────

/**
 * Group an array of events by date key 'YYYY-MM-DD'.
 * @param {Array} events - each must have a `date` field
 * @returns {Object} { 'YYYY-MM-DD': [...events] }
 */
export const groupEventsByDate = (events) =>
  events.reduce((acc, ev) => {
    const key = getDateKey(ev.date);
    if (!acc[key]) acc[key] = [];
    acc[key].push(ev);
    return acc;
  }, {});
