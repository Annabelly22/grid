'use client';

export interface LevelOption {
  value: string;
  label: string;
  color: string;
}

interface LevelPickerProps {
  label: string;
  options: LevelOption[];
  value: string;
  pendingValue?: string | null;
  onChange: (value: string) => void;
  onSave?: () => void;
  size?: 'sm' | 'md';
  showSaveButton?: boolean;
}

export default function LevelPicker({
  label,
  options,
  value,
  pendingValue,
  onChange,
  onSave,
  size = 'md',
  showSaveButton = true,
}: LevelPickerProps) {
  const currentValue = pendingValue ?? value;
  const hasChanges = pendingValue !== null && pendingValue !== value;
  const padding = size === 'sm' ? '4px 8px' : '5px 10px';
  const fontSize = size === 'sm' ? 10 : 12;

  return (
    <div className="flex flex-col gap-1 items-end">
      <span style={{ fontSize: 11, color: 'var(--ng-muted)', fontWeight: 500 }}>{label}</span>
      <div className="flex gap-1">
        {options.map(opt => {
          const isSelected = currentValue === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              style={{
                fontSize,
                padding,
                border: `1px solid ${isSelected ? opt.color : 'var(--ng-border)'}`,
                color: isSelected ? opt.color : 'var(--ng-muted)',
                background: isSelected ? `${opt.color}15` : 'transparent',
                borderRadius: 20,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {showSaveButton && hasChanges && onSave && (
        <button
          onClick={onSave}
          className="font-orbitron"
          style={{
            marginTop: 6,
            padding: '5px 12px',
            fontSize: 9,
            letterSpacing: '1px',
            background: 'var(--ng-green)',
            color: '#000',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
          }}
        >
          SAVE
        </button>
      )}
    </div>
  );
}

// Common presets
export const ENERGY_LEVELS: LevelOption[] = [
  { value: 'low', label: 'LOW', color: 'var(--ng-red)' },
  { value: 'medium', label: 'MEDIUM', color: 'var(--ng-amber)' },
  { value: 'high', label: 'HIGH', color: 'var(--ng-green)' },
];

export const EMOTIONAL_STATES: LevelOption[] = [
  { value: 'calm', label: 'CALM', color: 'var(--ng-green)' },
  { value: 'neutral', label: 'NEUTRAL', color: 'var(--ng-cyan)' },
  { value: 'anxious', label: 'ANXIOUS', color: 'var(--ng-amber)' },
  { value: 'confident', label: 'CONFIDENT', color: 'var(--ng-purple)' },
  { value: 'fearful', label: 'FEARFUL', color: 'var(--ng-red)' },
];
