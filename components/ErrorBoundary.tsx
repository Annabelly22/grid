'use client';
import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#000', padding: 24, flexDirection: 'column', gap: 16,
        }}>
          <div style={{ fontSize: 32 }}>⚠</div>
          <div style={{ fontFamily: 'monospace', fontSize: 14, color: '#FF453A', letterSpacing: '2px' }}>
            SYSTEM ERROR
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#666', maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{ marginTop: 8, padding: '10px 24px', border: '1px solid #30D158', color: '#30D158', background: 'transparent', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11, letterSpacing: '2px' }}>
            RESTART GRID
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
