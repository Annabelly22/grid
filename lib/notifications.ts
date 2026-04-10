// GRID — Notification Scheduler
// Time-based daily reminders using setTimeout (works while app is open / PWA on homescreen)
import type { Habit } from './gameStore';
import { Storage } from './storage';

export function scheduleGridNotifications(habits: Habit[]): void {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now   = new Date();
  const today = now.toISOString().split('T')[0];

  const slots: { key: string; hour: number; minute: number; title: string; body: string | (() => string) }[] = [
    {
      key: 'morning', hour: 8, minute: 0,
      title: '⬡ GRID — MORNING PROTOCOL',
      body: 'Take your foundation stack. Set your energy level. Build your streak today.',
    },
    {
      key: 'streak', hour: 18, minute: 0,
      title: '◈ GRID — STREAK PROTECTION',
      body: () => {
        const incomplete = habits.filter(h => !h.completedToday);
        if (incomplete.length === 0) return '✓ All habits done. Streak secured for today.';
        const names = incomplete.slice(0, 2).map(h => h.name).join(', ');
        return `${incomplete.length} habit${incomplete.length > 1 ? 's' : ''} remaining: ${names}${incomplete.length > 2 ? '…' : ''}`;
      },
    },
    {
      key: 'evening', hour: 21, minute: 0,
      title: '🌙 GRID — EVENING STACK',
      body: 'Magnesium Glycinate + Ashwagandha + L-Glutamine. Screens off in 30 min.',
    },
  ];

  for (const slot of slots) {
    // One notification per key per calendar day
    if (Storage.getNotifDate(slot.key) === today) continue;

    const target = new Date(now);
    target.setHours(slot.hour, slot.minute, 0, 0);
    const delay = target.getTime() - now.getTime();
    if (delay < 0) continue; // Window already passed today

    setTimeout(() => {
      const fireDate = new Date().toISOString().split('T')[0];
      if (Storage.getNotifDate(slot.key) === fireDate) return; // Already fired
      Storage.setNotifDate(slot.key, fireDate);
      try {
        const body = typeof slot.body === 'function' ? slot.body() : slot.body;
        new Notification(slot.title, {
          body,
          icon:  '/icon.png',
          badge: '/icon.png',
          tag:   `grid-${slot.key}`,
          renotify: true,
        } as NotificationOptions);
      } catch {}
    }, delay);
  }
}
