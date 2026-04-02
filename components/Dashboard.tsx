'use client';
import { UserProfile, Habit, Mission, Achievement, getLevel, CATEGORY_COLORS, CATEGORY_ICONS } from '../lib/gameStore';

type Tab = 'dashboard' | 'habits' | 'missions' | 'body' | 'coach' | 'profile';

interface Props {
  profile: UserProfile;
  habits: Habit[];
  missions: Mission[];
  achievements: Achievement[];
  onNavigate: (tab: Tab) => void;
}

const STOIC_QUOTES = [
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" },
  { text: "It is not that I'm so smart. But I stay with the questions much longer.", author: "Albert Einstein" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "Do not indulge in dreams of having what you have not, but reckon up the chief of the blessings you do possess.", author: "Marcus Aurelius" },
];

function getDailyQuote() {
  const day = new Date().getDate();
  return STOIC_QUOTES[day % STOIC_QUOTES.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

export default function Dashboard({ profile, habits, missions, achievements, onNavigate }: Props) {
  const lvl = getLevel(profile.xp);
  const quote = getDailyQuote();
  const today = new Date().toISOString().split('T')[0];
  const completedToday = habits.filter(h => h.completedToday).length;
  const totalHabits = habits.length;
  const completedMissions = missions.filter(m => m.completed).length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  // Life score 0–100 based on today's completed habits
  const lifeScore = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  // Category breakdown
  const categories = ['body', 'mind', 'trade', 'build', 'spirit', 'recovery'] as const;
  const catScores = categories.map(cat => {
    const catHabits = habits.filter(h => h.category === cat);
    const done = catHabits.filter(h => h.completedToday).length;
    return { cat, done, total: catHabits.length, pct: catHabits.length > 0 ? Math.round((done / catHabits.length) * 100) : 0 };
  });

  // Pending habits (not done today)
  const pending = habits.filter(h => !h.completedToday).slice(0, 4);

  const scoreColor = lifeScore >= 80 ? 'var(--ng-green)' : lifeScore >= 50 ? 'var(--ng-amber)' : 'var(--ng-red)';

  return (
    <div className="content-area" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4" style={{ borderBottom: '1px solid var(--ng-border)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="font-orbitron font-black text-2xl glitch-text" style={{ color: 'var(--ng-green)', letterSpacing: '6px', textShadow: '0 0 20px rgba(0,255,65,0.4)' }}>GRID</div>
            <div className="font-orbitron mt-0.5" style={{ fontSize: 10, color: 'var(--ng-muted)', letterSpacing: '2px' }}>
              {getGreeting()}, {profile.codename}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="font-orbitron font-bold" style={{ fontSize: 11, color: 'var(--ng-amber)', letterSpacing: '1px' }}>
              {lvl.title}
            </div>
            <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>
              LV{lvl.level} · {profile.xp.toLocaleString()} XP
            </div>
            <div style={{ width: 80 }}>
              <div className="xp-bar mt-1">
                <div className="xp-fill" style={{ width: `${lvl.progress}%` }} />
              </div>
              <div className="font-orbitron mt-0.5 text-right" style={{ fontSize: 7, color: 'var(--ng-dimmer)', letterSpacing: '1px' }}>
                {lvl.xpToNext} XP TO {lvl.next.title}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* Life Score */}
        <div className="card mb-4" style={{ borderColor: scoreColor + '44', background: `${scoreColor}08` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-orbitron font-bold" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '2px' }}>DAILY LIFE SCORE</div>
            <div className="font-orbitron font-black" style={{ fontSize: 28, color: scoreColor, letterSpacing: '2px', textShadow: `0 0 12px ${scoreColor}66` }}>
              {lifeScore}
            </div>
          </div>
          <div style={{ width: '100%', height: 4, background: 'var(--ng-border)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${lifeScore}%`, background: scoreColor, borderRadius: 2, transition: 'width 0.5s ease', boxShadow: `0 0 6px ${scoreColor}` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{completedToday}/{totalHabits} habits</span>
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>
              {lifeScore >= 80 ? 'ELITE DAY' : lifeScore >= 50 ? 'SOLID' : 'GET MOVING'}
            </span>
          </div>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {catScores.map(({ cat, done, total, pct }) => (
            <div key={cat} className="card" style={{ borderLeft: `3px solid ${CATEGORY_COLORS[cat]}44`, padding: '10px' }}>
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: 14 }}>{CATEGORY_ICONS[cat]}</span>
                <span className="font-orbitron font-bold" style={{ fontSize: 11, color: CATEGORY_COLORS[cat] }}>{pct}%</span>
              </div>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>{cat}</div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>{done}/{total}</div>
            </div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'MISSIONS', value: completedMissions, color: 'var(--ng-purple)', sub: 'done' },
            { label: 'ACHIEVEMENTS', value: unlockedAchievements, color: 'var(--ng-amber)', sub: 'unlocked' },
            { label: 'BEST STREAK', value: profile.longestStreak, color: 'var(--ng-cyan)', sub: 'days' },
          ].map(item => (
            <div key={item.label} className="card" style={{ padding: '10px', textAlign: 'center' }}>
              <div className="font-orbitron font-black" style={{ fontSize: 20, color: item.color }}>{item.value}</div>
              <div className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{item.label}</div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Pending habits */}
        {pending.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '2px' }}>PENDING TODAY</div>
              <button onClick={() => onNavigate('habits')} className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-cyan)', letterSpacing: '1px' }}>VIEW ALL →</button>
            </div>
            {pending.map(h => (
              <div key={h.id} className="flex items-center gap-3 mb-2 p-3" style={{ background: 'var(--ng-surface)', border: '1px solid var(--ng-border)', borderLeft: `3px solid ${CATEGORY_COLORS[h.category]}` }}>
                <span style={{ fontSize: 16 }}>{h.icon}</span>
                <div className="flex-1">
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-text)' }}>{h.name}</div>
                  <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>+{h.xpReward} XP · {h.streak > 0 ? `🔥 ${h.streak}d` : 'no streak'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stoic quote */}
        <div className="p-4 mb-4" style={{ background: 'var(--ng-surface)', border: '1px solid var(--ng-border)', borderLeft: '3px solid var(--ng-amber)' }}>
          <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '2px' }}>DAILY PROTOCOL</div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-text)', lineHeight: 1.7, fontStyle: 'italic' }}>
            "{quote.text}"
          </div>
          <div className="font-orbitron mt-2" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>— {quote.author}</div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'habits' as Tab, icon: '◈', label: 'LOG HABIT', sub: `${habits.length} active`, color: 'var(--ng-cyan)' },
            { id: 'missions' as Tab, icon: '◆', label: 'MISSIONS', sub: `${missions.filter(m=>!m.completed).length} active`, color: 'var(--ng-purple)' },
            { id: 'body' as Tab, icon: '❋', label: 'BODY STACK', sub: 'supplements', color: 'var(--ng-green)' },
            { id: 'coach' as Tab, icon: '⚡', label: 'CIPHER AI', sub: 'ask anything', color: 'var(--ng-amber)' },
          ].map(item => (
            <button key={item.id} onClick={() => onNavigate(item.id)} className="card text-left" style={{ borderColor: item.color + '33' }}>
              <div className="font-orbitron font-bold" style={{ fontSize: 18, color: item.color, marginBottom: 6 }}>{item.icon}</div>
              <div className="font-orbitron font-bold" style={{ fontSize: 10, color: 'var(--ng-text)', letterSpacing: '1px' }}>{item.label}</div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{item.sub}</div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
