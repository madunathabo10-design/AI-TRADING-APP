import { useState, useRef, useCallback } from 'react'
import './App.css'

const API_URL = 'http://localhost:8000'

export default function App() {
  const [file, setFile]           = useState(null)
  const [preview, setPreview]     = useState(null)
  const [analysis, setAnalysis]   = useState(null)
  const [meta, setMeta]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [dragging, setDragging]   = useState(false)
  const fileRef                   = useRef()

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setAnalysis(null)
    setError(null)
  }, [])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setAnalysis(null)

    const fd = new FormData()
    fd.append('file', file)

    try {
      const res  = await fetch(`${API_URL}/api/analyze`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Analysis failed')
      setAnalysis(data.analysis)
      setMeta(data.meta)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null); setPreview(null); setAnalysis(null); setMeta(null); setError(null)
  }

  return (
    <div className="app">
      <Nav />
      <main className="main">
        <div className="hero">
          <span className="hero-tag">AI-Powered Analysis</span>
          <h1 className="hero-title">
            Read any chart<br />
            <em>in seconds</em>
          </h1>
          <p className="hero-sub">Upload a screenshot. Get trend direction, key levels, and trade setups instantly.</p>
        </div>

        <div className="workspace">
          <div className="left-col">
            {!preview ? (
              <DropZone
                dragging={dragging}
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileRef.current.click()}
              />
            ) : (
              <div className="chart-panel">
                <div className="chart-img-wrap">
                  <img src={preview} alt="uploaded chart" className="chart-img" />
                  {loading && <div className="chart-overlay"><ScanAnimation /></div>}
                </div>
                <div className="chart-footer">
                  <span className="file-name">{file.name}</span>
                  <div className="chart-actions">
                    <button className="btn-ghost" onClick={reset}>Clear</button>
                    <button className="btn-primary" onClick={analyze} disabled={loading}>
                      {loading ? <><Spinner /> Analyzing…</> : 'Analyze chart →'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />

            {meta && <MetaBar meta={meta} />}
          </div>

          <div className="right-col">
            {error && <ErrorBox message={error} />}
            {!analysis && !error && <EmptyState />}
            {analysis && <Results analysis={analysis} />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav className="nav">
      <div className="nav-logo">
        <div className="logo-mark" />
        <span>ChartMind</span>
      </div>
      <div className="nav-links">
        <a href="#" className="nav-link">Docs</a>
        <a href="#" className="nav-link">API</a>
        <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" className="nav-cta">Get API Key →</a>
      </div>
    </nav>
  )
}

function DropZone({ dragging, onDrop, onDragOver, onDragLeave, onClick }) {
  return (
    <div
      className={`dropzone ${dragging ? 'dragging' : ''}`}
      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onClick={onClick}
    >
      <div className="dz-icon">
        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
        </svg>
      </div>
      <p className="dz-title">Drop your chart here</p>
      <p className="dz-sub">PNG, JPG, WebP · Max 5MB</p>
      <button className="dz-btn" onClick={e => e.stopPropagation()}>Browse files</button>
    </div>
  )
}

function ScanAnimation() {
  return (
    <div className="scan-wrap">
      <div className="scan-line" />
      <p className="scan-text">Scanning chart…</p>
    </div>
  )
}

function MetaBar({ meta }) {
  return (
    <div className="meta-bar">
      <span>{meta.image_width}×{meta.image_height}px</span>
      <span>Sharpness: {meta.sharpness?.toFixed(0)}</span>
      <span className={meta.sharpness > 100 ? 'green' : 'amber'}>
        {meta.sharpness > 100 ? '✓ Clear image' : '⚠ Low sharpness'}
      </span>
      <span>Model: {meta.model}</span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="empty">
      <div className="empty-icon">
        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z"/>
        </svg>
      </div>
      <p className="empty-title">No analysis yet</p>
      <p className="empty-sub">Upload a chart to see trend direction,<br />key price levels, and trade setups.</p>
    </div>
  )
}

function ErrorBox({ message }) {
  return (
    <div className="error-box">
      <p className="error-title">Analysis failed</p>
      <p className="error-msg">{message}</p>
    </div>
  )
}

function Results({ analysis: a }) {
  const dir = (a.trend?.direction || 'sideways').toLowerCase()
  const trendColor = dir === 'bullish' ? 'green' : dir === 'bearish' ? 'red' : 'amber'
  const arrow = dir === 'bullish' ? '▲' : dir === 'bearish' ? '▼' : '—'

  return (
    <div className="results">
      {(a.ticker || a.timeframe) && (
        <div className="result-ticker">
          {a.ticker && <span className="ticker">{a.ticker}</span>}
          {a.timeframe && <span className="timeframe">{a.timeframe}</span>}
        </div>
      )}

      <Card label="Trend">
        <div className="trend-row">
          <span className={`trend-badge ${trendColor}`}>{arrow} {cap(a.trend?.direction)} · {cap(a.trend?.strength)}</span>
        </div>
        <p className="card-body">{a.trend?.summary}</p>
      </Card>

      {a.key_levels?.length > 0 && (
        <Card label="Key levels">
          {a.key_levels.map((l, i) => (
            <div key={i} className="level-row">
              <span className={`level-tag ${l.type === 'resistance' ? 'red' : 'green'}`}>
                {l.type === 'resistance' ? 'RES' : 'SUP'}
              </span>
              <span className="level-price">{l.price}</span>
              <span className="level-note">{l.note}</span>
            </div>
          ))}
        </Card>
      )}

      {a.patterns?.length > 0 && (
        <Card label="Pattern detected">
          {a.patterns.map((p, i) => (
            <div key={i} className="pattern-row">
              <span className="pattern-name">{p.name}</span>
              <span className={`conf-tag ${p.confidence}`}>{p.confidence}</span>
              <p className="pattern-desc">{p.description}</p>
            </div>
          ))}
        </Card>
      )}

      {a.indicators && (
        <Card label="Indicators">
          <div className="indicators-grid">
            {Object.entries(a.indicators).map(([k, v]) => (
              <div key={k} className="ind-item">
                <span className="ind-key">{k.replace(/_/g, ' ')}</span>
                <span className="ind-val">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {a.setup?.bias && (
        <Card label="Trade setup">
          <div className={`setup-header ${a.setup.bias}`}>
            <span className="setup-bias">{cap(a.setup.bias)} bias</span>
            {a.setup.risk_reward > 0 && (
              <span className="rr-badge">{Number(a.setup.risk_reward).toFixed(1)}x R/R</span>
            )}
          </div>
          <div className="setup-grid">
            <SetupItem label="Entry" value={a.setup.entry_zone} />
            <SetupItem label="Target" value={a.setup.target} color="green" />
            <SetupItem label="Stop loss" value={a.setup.stop_loss} color="red" />
          </div>
          {a.setup.notes && <p className="card-body" style={{ marginTop: 10 }}>{a.setup.notes}</p>}
        </Card>
      )}

      <Card label="Confidence">
        <div className="conf-row">
          <span className="conf-score">{a.confidence_score}%</span>
          <div className="conf-bar-bg">
            <div
              className="conf-bar-fill"
              style={{ width: `${a.confidence_score}%`, background: confColor(a.confidence_score) }}
            />
          </div>
        </div>
      </Card>

      <p className="disclaimer">{a.disclaimer}</p>
    </div>
  )
}

function Card({ label, children }) {
  return (
    <div className="result-card">
      <p className="card-label">{label}</p>
      {children}
    </div>
  )
}

function SetupItem({ label, value, color }) {
  return (
    <div className="setup-item">
      <span className="setup-label">{label}</span>
      <span className={`setup-value ${color || ''}`}>{value || '—'}</span>
    </div>
  )
}

function Spinner() {
  return <span className="spinner" />
}

function Footer() {
  return (
    <footer className="footer">
      <p>ChartMind AI · Built with Claude Vision · <a href="https://docs.anthropic.com" target="_blank" rel="noreferrer">Anthropic Docs</a></p>
    </footer>
  )
}

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : '' }
function confColor(n) { return n >= 70 ? '#10b981' : n >= 40 ? '#f59e0b' : '#ef4444' }
