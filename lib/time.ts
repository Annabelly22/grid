// GRID — Timezone-aware time utilities
// All date calculations go through here so the Home Clock setting is respected everywhere.

const TZ_KEY = 'grid_home_tz';

/** Returns the user's stored home timezone, falling back to the browser's detected timezone. */
export function getHomeTimezone(): string {
  if (typeof window === 'undefined') return 'UTC';
  return localStorage.getItem(TZ_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Persists the user's home timezone. */
export function setHomeTimezone(tz: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TZ_KEY, tz);
}

/** Returns today's date as "YYYY-MM-DD" in the home timezone. */
export function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: getHomeTimezone() });
}

/** Returns yesterday's date as "YYYY-MM-DD" in the home timezone. */
export function getYesterdayStr(): string {
  const todayStr = getTodayStr();
  const [y, m, d] = todayStr.split('-').map(Number);
  const yest = new Date(y, m - 1, d - 1); // local arithmetic, only for day subtraction
  return `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;
}

/** Returns the current hour (0–23) in the home timezone. */
export function getNowHour(): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: getHomeTimezone(), hour: 'numeric', hour12: false,
  }).formatToParts(new Date());
  return parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10) % 24;
}

/** Returns the current time as "h:mm" and period "AM"|"PM" in the home timezone. */
export function getNowTimeParts(): { time: string; period: 'AM' | 'PM' } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: getHomeTimezone(), hour: 'numeric', minute: '2-digit', hour12: true,
  }).formatToParts(new Date());
  const h   = parts.find(p => p.type === 'hour')?.value ?? '12';
  const m   = parts.find(p => p.type === 'minute')?.value ?? '00';
  const raw = (parts.find(p => p.type === 'dayPeriod')?.value ?? 'AM').toUpperCase();
  return { time: `${h}:${m}`, period: raw === 'PM' ? 'PM' : 'AM' };
}

/** Returns the current time as "h:mm AM/PM" — used for habit completion timestamps. */
export function getNowTimeStr(): string {
  const { time, period } = getNowTimeParts();
  return `${time} ${period}`;
}

function getHomeTzHMS(): { h: number; m: number; s: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: getHomeTimezone(), hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false,
  }).formatToParts(new Date());
  return {
    h: parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10) % 24,
    m: parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10),
    s: parseInt(parts.find(p => p.type === 'second')?.value ?? '0', 10),
  };
}

/** Returns milliseconds until midnight in the home timezone. */
export function getMsUntilMidnight(): number {
  const { h, m, s } = getHomeTzHMS();
  return (24 - h) * 3_600_000 - m * 60_000 - s * 1_000 - new Date().getMilliseconds();
}

/** Returns milliseconds until the next quote boundary (noon or midnight) in the home timezone. */
export function getMsUntilNextQuoteBoundary(): number {
  const { h, m, s } = getHomeTzHMS();
  const ms = new Date().getMilliseconds();
  if (h < 12) {
    return (12 - h) * 3_600_000 - m * 60_000 - s * 1_000 - ms; // until noon
  } else {
    return (24 - h) * 3_600_000 - m * 60_000 - s * 1_000 - ms; // until midnight
  }
}

/** Returns an array of N date strings (oldest first, today last) in the home timezone. */
export function getPastNDays(n: number): string[] {
  const todayStr = getTodayStr();
  const [y, m, d] = todayStr.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(y, m - 1, d - (n - 1 - i));
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
}

/** Returns the date string for Monday of the current week in the home timezone. */
export function getMondayStr(): string {
  const tz = getHomeTimezone();
  const dayName = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(new Date());
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(dayName);
  const daysFromMonday = (dayIndex + 6) % 7;
  const todayStr = getTodayStr();
  const [y, m, d] = todayStr.split('-').map(Number);
  const monday = new Date(y, m - 1, d - daysFromMonday);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

/** Returns all 7 day strings (Mon–Sun) for the current week in the home timezone. */
export function getCurrentWeekDays(): string[] {
  const mondayStr = getMondayStr();
  const [y, m, d] = mondayStr.split('-').map(Number);
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(y, m - 1, d + i);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  });
}

/** Returns all supported IANA timezone strings. */
export function getSupportedTimezones(): string[] {
  try {
    return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone');
  } catch {
    return [
      'UTC',
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Anchorage', 'Pacific/Honolulu', 'America/Sao_Paulo', 'America/Argentina/Buenos_Aires',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Rome', 'Europe/Madrid',
      'Europe/Moscow', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Cairo', 'Africa/Johannesburg',
      'Asia/Dubai', 'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok',
      'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai',
      'Australia/Sydney', 'Australia/Melbourne', 'Pacific/Auckland', 'Pacific/Fiji',
    ];
  }
}
