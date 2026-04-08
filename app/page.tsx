'use client';
import { useEffect, useState, useCallback } from 'react';
import GridLogo from '../components/GridLogo';
import {
  UserProfile, Habit, Mission, Achievement,
  loadProfile, saveProfile, loadHabits, saveHabits,
  loadMissions, saveMissions, loadAchievements, saveAchievements,
  checkAchievements,
} from '../lib/gameStore';
import Dashboard from '../components/Dashboard';
import HabitsTab from '../components/HabitsTab';
import MissionsTab from '../components/MissionsTab';
import BodyTab from '../components/BodyTab';
import CoachTab from '../components/CoachTab';
import ProfileTab from '../components/ProfileTab';

type Tab = 'dashboard' | 'habits' | 'missions' | 'body' | 'coach' | 'profile';
interface AchievementToast { achievement: Achievement; id: number; }
interface XPPopup { amount: number; id: number; }

export default function App() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [toasts, setToasts] = useState<AchievementToast[]>([]);
  const [xpPopups, setXpPopups] = useState<XPPopup[]>([]);
  const [mounted,    setMounted]    = useState(false);
  const [onboarded,  setOnboarded]  = useState(true);
  const [onboardName, setOnboardName] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    setMounted(true);
    const p = loadProfile();
    const h = loadHabits();
    const m = loadMissions();
    const a = loadAchievements();
    setProfile(p); setHabits(h); setMissions(m); setAchievements(a);
    if (!p.onboarded) setOnboarded(false);
    const t = localStorage.getItem('grid_theme') as 'dark' | 'light' | null;
    if (t) setTheme(t);
  }, []);

  const addXPPopup = (amount: number) => {
    const id = Date.now() + Math.random();
    setXpPopups(prev => [...prev, { amount, id }]);
    setTimeout(() => setXpPopups(prev => prev.filter(p => p.id !== id)), 2000);
  };

  const addToast = (achievement: Achievement) => {
    const id = Date.now();
    setToasts(prev => [...prev, { achievement, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const awardXP = useCallback((amount: number, p: UserProfile, h: Habit[], a: Achievement[]) => {
    addXPPopup(amount);
    const working: UserProfile = { ...p, xp: p.xp + amount };
    const { updated: newAch, newlyUnlocked } = checkAchievements(working, h, a);
    const bonus = newlyUnlocked.reduce((s, a) => s + a.xpReward, 0);
    const final: UserProfile = { ...working, xp: working.xp + bonus };
    saveProfile(final); setProfile(final);
    if (newlyUnlocked.length > 0) { saveAchievements(newAch); setAchievements(newAch); newlyUnlocked.forEach(a => setTimeout(() => addToast(a), 500)); }
    return final;
  }, []);

  const snapshotHabitLog = (updatedHabits: typeof habits) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const raw = localStorage.getItem('grid_habit_log');
      const log: Record<string, { completed: number; total: number }> = raw ? JSON.parse(raw) : {};
      log[today] = {
        completed: updatedHabits.filter(h => h.completedToday).length,
        total:     updatedHabits.length,
      };
      localStorage.setItem('grid_habit_log', JSON.stringify(log));
    } catch {}
  };

  const handleCompleteHabit = (id: string) => {
    if (!profile) return;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id !== id || h.completedToday) return h;
      const streak = (h.lastCompleted === yesterday || h.streak === 0) ? h.streak + 1 : 1;
      return { ...h, completedToday: true, lastCompleted: today, streak, totalCompletions: h.totalCompletions + 1 };
    });
    saveHabits(updated); setHabits(updated);
    snapshotHabitLog(updated);
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    awardXP(habit.xpReward, { ...profile, totalHabitsCompleted: profile.totalHabitsCompleted + 1, longestStreak: Math.max(profile.longestStreak, updated.find(h => h.id === id)?.streak || 0) }, updated, achievements);
  };

  const handleAddHabit = (data: Omit<Habit, 'id' | 'streak' | 'completedToday' | 'lastCompleted' | 'totalCompletions' | 'createdAt'>) => {
    const newHabit: Habit = { ...data, id: `h_${Date.now()}`, streak: 0, completedToday: false, lastCompleted: null, totalCompletions: 0, createdAt: new Date().toISOString() };
    const updated = [...habits, newHabit];
    saveHabits(updated); setHabits(updated);
    if (updated.length >= 5 && profile) {
      const { updated: a2, newlyUnlocked } = checkAchievements(profile, updated, achievements);
      if (newlyUnlocked.length > 0) { saveAchievements(a2); setAchievements(a2); newlyUnlocked.forEach(a => addToast(a)); }
    }
  };

  const handleDeleteHabit = (id: string) => { const u = habits.filter(h => h.id !== id); saveHabits(u); setHabits(u); };

  const handleCompleteMission = (id: string) => {
    if (!profile) return;
    const m = missions.find(m => m.id === id);
    if (!m || m.completed) return;
    const updated = missions.map(ms => ms.id === id ? { ...ms, completed: true, completedAt: new Date().toISOString() } : ms);
    saveMissions(updated); setMissions(updated);
    awardXP(m.xpReward, { ...profile, missionsCompleted: profile.missionsCompleted + 1 }, habits, achievements);
  };

  const handleFocusMinutes = (minutes: number) => {
    if (!profile) return;
    const u = { ...profile, focusMinutes: profile.focusMinutes + minutes };
    saveProfile(u); setProfile(u);
    awardXP(minutes * 2, u, habits, achievements);
  };

  const handleUncompleteHabit = (id: string) => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id !== id || !h.completedToday) return h;
      return {
        ...h,
        completedToday: false,
        lastCompleted: h.streak > 1 ? yesterday : null,
        streak: Math.max(0, h.streak - 1),
        totalCompletions: Math.max(0, h.totalCompletions - 1),
      };
    });
    saveHabits(updated); setHabits(updated);
    snapshotHabitLog(updated);
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('grid_theme', next);
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '');
  };

  const handleUpdateCodename = (name: string) => { if (!profile) return; const u = { ...profile, codename: name }; saveProfile(u); setProfile(u); };
  const handleOnboard = () => { if (!profile) return; const u = { ...profile, codename: onboardName.trim().toUpperCase() || 'OPERATIVE', onboarded: true }; saveProfile(u); setProfile(u); setOnboarded(true); };
  const handleResetData = () => { localStorage.clear(); window.location.reload(); };

  if (!mounted || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ng-bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <GridLogo variant="lockup" size={56} />
          <div className="loader-dots" style={{ display: 'flex', gap: 8 }}><span /><span /><span /></div>
          <div className="font-mono" style={{ fontSize: 11, color: '#6A6A8A', letterSpacing: '2px' }}>INITIALIZING SYSTEM...</div>
        </div>
      </div>
    );
  }

  if (!onboarded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--ng-bg)' }}>
        <div style={{ width: '100%', maxWidth: 360 }} className="fade-in">
          <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <GridLogo variant="lockup" size={56} />
            <div className="font-mono" style={{ fontSize: 11, color: '#6A6A8A', letterSpacing: '2px' }}>YOUR SOVEREIGN LIFE OPERATING SYSTEM</div>
          </div>
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="font-orbitron" style={{ fontSize: 10, color: '#00D4FF', letterSpacing: '2px', marginBottom: 8 }}>ENTER CODENAME</div>
              <input className="ng-input" placeholder="YOUR OPERATIVE NAME..." value={onboardName} onChange={e => setOnboardName(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleOnboard()} maxLength={16} autoFocus />
            </div>
            <div style={{ padding: 12, background: 'var(--ng-bg)', border: '1px solid #2A2A3A' }}>
              <div className="font-mono" style={{ fontSize: 11, color: '#6A6A8A', lineHeight: 1.9 }}>
                ◆ Build daily habits. Earn XP.<br />
                ◈ Complete missions. Level up.<br />
                ❋ Cycle-synced supplement stack.<br />
                ⚡ AI coach CIPHER.<br />
                ▣ Reach LEGEND rank.
              </div>
            </div>
            <button className="btn-green-solid" onClick={handleOnboard}>INITIALIZE GRID</button>
          </div>
        </div>
      </div>
    );
  }

  const NAV: { id: Tab; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '⬡', label: 'HUB' },
    { id: 'habits', icon: '◈', label: 'HABITS' },
    { id: 'missions', icon: '◆', label: 'MISSION' },
    { id: 'body', icon: '❋', label: 'BODY' },
    { id: 'coach', icon: '⚡', label: 'CIPHER' },
    { id: 'profile', icon: '▣', label: 'PROFILE' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ng-bg)', display: 'flex' }}>
      {/* Desktop sidebar — hidden on mobile via CSS */}
      <nav className="desktop-sidebar">
        <div style={{ padding: '24px 20px 28px' }}>
          <GridLogo variant="lockup" size={36} />
        </div>
        {NAV.map(item => (
          <button key={item.id} onClick={() => setTab(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 20px', width: '100%',
              background: tab === item.id ? 'rgba(48,209,88,0.08)' : 'transparent',
              borderLeft: `3px solid ${tab === item.id ? 'var(--ng-green)' : 'transparent'}`,
              borderTop: 'none', borderRight: 'none', borderBottom: 'none',
              color: tab === item.id ? 'var(--ng-green)' : 'var(--ng-muted)',
              cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Main content — 480px centered on mobile, full-width on desktop */}
      <div className="main-content">
        {xpPopups.map(popup => (
          <div key={popup.id} className="font-orbitron" style={{ position: 'fixed', top: '45%', left: '50%', transform: 'translateX(-50%)', color: '#FFB800', fontSize: 22, fontWeight: 900, letterSpacing: '2px', textShadow: '0 0 10px rgba(255,184,0,0.8)', animation: 'slideUp 1.8s ease forwards', pointerEvents: 'none', zIndex: 60 }}>
            +{popup.amount} XP
          </div>
        ))}
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, padding: '0 16px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map(t => (
            <div key={t.id} className="achievement-popup">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{t.achievement.icon}</span>
                <div>
                  <div className="font-orbitron" style={{ fontSize: 9, color: '#FFB800', letterSpacing: '1px' }}>ACHIEVEMENT UNLOCKED</div>
                  <div className="font-orbitron" style={{ fontSize: 13, color: '#E8E8F0', fontWeight: 900, letterSpacing: '1px' }}>{t.achievement.title}</div>
                  <div className="font-mono" style={{ fontSize: 10, color: '#6A6A8A' }}>{t.achievement.description} · +{t.achievement.xpReward} XP</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tab === 'dashboard' && <Dashboard profile={profile} habits={habits} onNavigate={t => setTab(t)} onCompleteHabit={handleCompleteHabit} />}
        {tab === 'habits' && <HabitsTab habits={habits} onCompleteHabit={handleCompleteHabit} onUncompleteHabit={handleUncompleteHabit} onAddHabit={handleAddHabit} onDeleteHabit={handleDeleteHabit} />}
        {tab === 'missions' && <MissionsTab missions={missions} profile={profile} habits={habits} onCompleteMission={handleCompleteMission} />}
        {tab === 'body' && <BodyTab />}
        {tab === 'coach' && <CoachTab profile={profile} onFocusMinutes={handleFocusMinutes} />}
        {tab === 'profile' && <ProfileTab profile={profile} habits={habits} achievements={achievements} theme={theme} onUpdateCodename={handleUpdateCodename} onToggleTheme={handleToggleTheme} onResetData={handleResetData} />}

        {/* Mobile bottom nav — hidden on desktop via CSS */}
        <nav className="bottom-nav">
          {NAV.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`nav-item ${tab === item.id ? 'active' : ''}`}>
              <span className="nav-icon" style={{ fontSize: 15 }}>{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
