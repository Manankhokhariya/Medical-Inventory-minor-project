import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    localStorage.removeItem('med_inventory_user');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0b1120',
          color: '#f8fafc',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
        }}>
          <div style={{
            background: 'rgba(22, 33, 58, 0.85)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: '16px',
            padding: '2.5rem',
            maxWidth: '560px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              display: 'inline-flex',
              padding: '0.75rem',
              borderRadius: '50%',
              background: 'rgba(244, 63, 94, 0.15)',
              color: '#f43f5e',
              marginBottom: '1rem',
              fontSize: '1.75rem',
              fontWeight: 700
            }}>
              !
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#fff' }}>
              Something went wrong
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {this.state.error?.message || 'An unexpected error occurred while rendering the page.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#0ea5e9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: 'transparent',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Reset Session & Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
