import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import Ticket from './Ticket'

export default function Scan({ items }) {
  const scanner = useRef(null)
  const running = useRef(false)
  const [live, setLive] = useState(false)
  const [code, setCode] = useState('')
  const [hitId, setHitId] = useState(null)
  const [err, setErr] = useState('')
  const [recent, setRecent] = useState([])

  const hit = items.find(i => i.id === hitId)

  const lookup = (raw) => {
    const id = String(raw).trim().toUpperCase()
    if (!items.some(i => i.id === id)) { setHitId(null); return setErr(`No item with the number “${raw}”. Check the tag and try again.`) }
    setErr(''); setHitId(id); setCode('')
    setRecent(r => [id, ...r.filter(x => x !== id)].slice(0, 5))
  }

  const stop = async () => {
    if (scanner.current && running.current) {
      running.current = false
      try { await scanner.current.stop(); scanner.current.clear() } catch { /* already stopped */ }
    }
    setLive(false)
  }

  const start = async () => {
    setErr('')
    try {
      scanner.current = new Html5Qrcode('reader')
      running.current = true
      setLive(true)
      await scanner.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (text) => { lookup(text); stop() },
        () => {}
      )
    } catch {
      running.current = false
      setLive(false)
      setErr('The camera could not start. Allow camera access in your browser, or type the tag number instead.')
    }
  }

  useEffect(() => () => { if (running.current) scanner.current?.stop().catch(() => {}) }, [])

  const action = hit?.status === 'Pending' ? ['Open verification', `/operator/verify?code=${hit.id}`]
    : hit?.status === 'Stored' ? ['Start handover', `/operator/handover?code=${hit.id}`] : null

  return (
    <div className="grid2">
      <div className="glass card">
        <h3>Camera</h3>
        <div className={'finder' + (live ? ' live' : '')}>
          <div id="reader" />
          {!live && <div className="idle"><b>Camera is off</b><p>Press start, then hold the tag in front of the camera.</p></div>}
          <i /><i /><i /><i />
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          {live ? <button className="btn ghost" onClick={stop}>Stop camera</button> : <button className="btn" onClick={start}>Start camera</button>}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="glass card">
          <h3>Type the tag number</h3>
          <form className="row" onSubmit={(e) => { e.preventDefault(); lookup(code) }}>
            <input style={{ flex: 1 }} value={code} onChange={e => { setCode(e.target.value); setErr('') }} placeholder="QR-2026-007" aria-label="Tag number" />
            <button className="btn" type="submit">Find item</button>
          </form>
          {err && <p style={{ color: 'var(--red)', marginBottom: 0 }} role="alert">{err}</p>}
          {recent.length > 0 && <>
            <p className="muted" style={{ margin: '18px 0 8px' }}>Recent lookups</p>
            <div className="chips">{recent.map(r => <button key={r} className="chip" onClick={() => lookup(r)}>{r}</button>)}</div>
          </>}
        </div>

        {hit ? (
          <Ticket it={hit} tone={hit.status === 'Stored' ? 'good' : hit.status === 'Rejected' ? 'bad' : ''}>
            {action
              ? <Link className="btn" to={action[1]}>{action[0]}</Link>
              : <p className="muted" style={{ margin: 0 }}>This item is already {hit.status.toLowerCase()}. Nothing more to do.</p>}
          </Ticket>
        ) : (
          <div className="glass card">
            <h3>Scanning tips</h3>
            <ul className="tips">
              <li>Hold the tag about 15 to 20 cm from the camera.</li>
              <li>Good light helps. Avoid glare on the tag.</li>
              <li>If it will not scan, type the number printed under the code.</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}