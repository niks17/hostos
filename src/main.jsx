import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('HostOS crash:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui', maxWidth: 600, margin: '40px auto' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 16, padding: 20 }}>
            <h2 style={{ color: '#dc2626', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>⚠️ Greška pri učitavanju</h2>
            <p style={{ color: '#7f1d1d', fontSize: 14, marginBottom: 16 }}>Aplikacija nije mogla da se učita. Pokušajte da osvežite stranicu.</p>
            <pre style={{ background: '#fee2e2', padding: 12, borderRadius: 8, fontSize: 11, color: '#991b1b', overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: 16 }}>
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.info?.componentStack?.slice(0, 500)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#dc2626', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14 }}
            >
              Osveži stranicu
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
} catch (e) {
  console.error('Fatal render error:', e)
  document.getElementById('root').innerHTML = `
    <div style="padding:24px;font-family:system-ui;max-width:600px;margin:40px auto">
      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:16px;padding:20px">
        <h2 style="color:#dc2626;font-size:18px;font-weight:700;margin-bottom:8px">⚠️ Fatalna greška</h2>
        <pre style="background:#fee2e2;padding:12px;border-radius:8px;font-size:11px;color:#991b1b;overflow:auto;white-space:pre-wrap;word-break:break-word">${e?.toString()}</pre>
        <button onclick="location.reload()" style="margin-top:12px;background:#dc2626;color:white;border:none;padding:12px 24px;border-radius:10px;font-weight:700;cursor:pointer">Osveži stranicu</button>
      </div>
    </div>
  `
}
