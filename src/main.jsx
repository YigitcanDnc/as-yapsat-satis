import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Application Error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', textAlign: 'center', background: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#0f172a', fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Bir Yükleme Hatası Oluştu</h2>
          <p style={{ color: '#64748b', fontSize: '14px', maxWidth: '500px', marginBottom: '20px' }}>
            Tarayıcı önbelleğinizdeki eski veriler nedeniyle sayfa yüklenememiş olabilir. Aşağıdaki butona basarak verileri sıfırlayabilirsiniz.
          </p>
          <button
            onClick={() => {
              try { localStorage.clear(); } catch {}
              window.location.reload();
            }}
            style={{ padding: '10px 24px', background: '#d97706', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
          >
            Önbelleği Temizle ve Yeniden Yükle
          </button>
          <pre style={{ marginTop: '24px', padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', fontSize: '12px', textAlign: 'left', maxWidth: '600px', overflow: 'auto' }}>
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
