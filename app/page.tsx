'use client';
import { GridProvider, useGridContext } from '../contexts/GridContext';
import GridLogo from '../components/GridLogo';
import Dashboard from '../components/Dashboard';
import HabitsTab from '../components/HabitsTab';
import MissionsTab from '../components/MissionsTab';
import BodyTab from '../components/BodyTab';
import CoachTab from '../components/CoachTab';
import ProfileTab from '../components/ProfileTab';
import ErrorBoundary from '../components/ErrorBoundary';

type Tab = 'dashboard' | 'habits' | 'missions' | 'body' | 'coach' | 'profile';

const NAV: { id: Tab; icon: string; label: string }[] = [
  { id: 'dashboard', icon: '⬡', label: 'HUB' },
  { id: 'habits',    icon: '◈', label: 'HABITS' },
  { id: 'missions',  icon: '◆', label: 'MISSION' },
  { id: 'body',      icon: '❋', label: 'BODY' },
  { id: 'coach',     icon: '⚡', label: 'CIPHER' },
  { id: 'profile',   icon: '▣', label: 'PROFILE' },
];

function App() {
  const {
    tab, setTab, profile, habits, missions, achievements,
    theme, toasts, xpPopups, mounted, onboarded, onboardName,
    setOnboardName, handleOnboard, handleCompleteHabit, handleUncompleteHabit,
    handleAddHabit, handleDeleteHabit, handleCompleteMission,
    handleFocusMinutes, handleToggleTheme, handleUpdateCodename, handleResetData,
  } = useGridContext();

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ng-bg)', display: 'flex' }}>
      {/* Desktop sidebar */}
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

      {/* Main content */}
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

        {tab === 'dashboard' && <Dashboard profile={profile} habits={habits} onNavigate={t => setTab(t as Tab)} onCompleteHabit={handleCompleteHabit} />}
        {tab === 'habits'    && <HabitsTab habits={habits} onCompleteHabit={handleCompleteHabit} onUncompleteHabit={handleUncompleteHabit} onAddHabit={handleAddHabit} onDeleteHabit={handleDeleteHabit} />}
        {tab === 'missions'  && <MissionsTab missions={missions} profile={profile} habits={habits} onCompleteMission={handleCompleteMission} />}
        {tab === 'body'      && <BodyTab />}
        {tab === 'coach'     && <CoachTab profile={profile} onFocusMinutes={handleFocusMinutes} />}
        {tab === 'profile'   && <ProfileTab profile={profile} habits={habits} achievements={achievements} theme={theme} onUpdateCodename={handleUpdateCodename} onToggleTheme={handleToggleTheme} onResetData={handleResetData} />}

        {/* Mobile bottom nav */}
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

export default function Page() {
  return (
    <ErrorBoundary>
      <GridProvider>
        <App />
      </GridProvider>
    </ErrorBoundary>
  );
}
