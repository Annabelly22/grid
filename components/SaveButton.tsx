'use client';

interface SaveButtonProps {
  onClick: () => void;
  loading?: boolean;
  saved?: boolean;
  label?: string;
  savedLabel?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md';
}

export default function SaveButton({
  onClick,
  loading = false,
  saved = false,
  label = 'SAVE',
  savedLabel = 'SAVED',
  fullWidth = true,
  size = 'md',
}: SaveButtonProps) {
  const isDisabled = loading || saved;
  const padding = size === 'sm' ? '8px 12px' : '10px 16px';
  const fontSize = size === 'sm' ? 9 : 10;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className="font-orbitron"
      style={{
        width: fullWidth ? '100%' : 'auto',
        padding,
        fontSize,
        letterSpacing: '1px',
        background: saved ? 'rgba(48,209,88,0.1)' : loading ? 'var(--ng-surface)' : 'var(--ng-green)',
        color: saved ? 'var(--ng-green)' : loading ? 'var(--ng-muted)' : '#000',
        border: `1px solid ${saved ? 'var(--ng-green)' : loading ? 'var(--ng-border)' : 'var(--ng-green)'}`,
        borderRadius: 8,
        cursor: isDisabled ? 'default' : 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {loading && (
        <span style={{
          width: 12,
          height: 12,
          border: '2px solid var(--ng-muted)',
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      )}
      {saved ? `✓ ${savedLabel}` : loading ? 'SAVING...' : label}
    </button>
  );
}
