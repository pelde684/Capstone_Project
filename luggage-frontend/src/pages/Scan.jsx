import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import Ticket from './Ticket'
import { api } from '../api'
import { shortCode } from '../adapt'

export default function Scan({ items }) {
  const scanner = useRef(null)
  const running = useRef(false)
  const [live, setLive] = useState(false)
  const [code, setCode] = useState('')
  const [hitIds, setHitIds] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [recent, setRecent] = useState([])

  // One QR covers every item the student handed in together, so a scan can return several items.
  const hits = hitIds.map(id => items.find(i => i.id === id)).filter(Boolean)

  // Accepts the full QR value (camera) or the 8-character code printed under it (typed)
  const lookup = async (raw) => {
    const value = String(raw).trim()
    if (!value) return
    setBusy(true)
    try {
      const r = await api('/scan', { method: 'POST', body: { qrValue: value } })
      const ids = r.items.map(i => String(i.id))
      if (!ids.length) throw new Error('This QR has no active items. The student may have cancelled them.')
      setErr(''); setHitIds(ids); setCode('')
      const tag = shortCode(r.dropOff.qrValue)
      setRecent(list => [tag, ...list.filter(x => x !== tag)].slice(0, 5))
    } catch (e) {
      setHitIds([])
      setErr(e.message === 'QR code not recognised' ? `No items with the code “${value}”. Check the tag and try again.` : e.message)
    } finally {
      setBusy(false)
    }
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

  const actionFor = (hit) => hit.status === 'Pending' || hit.status === 'Rejected' ? ['Open verification', `/operator/verify?code=${hit.id}`]
    : hit.status === 'Stored' ? ['Start handover', `/operator/handover?code=${hit.id}`] : null

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
            <input style={{ flex: 1 }} value={code} onChange={e => { setCode(e.target.value); setErr('') }} placeholder="8D40E85C" aria-label="Tag number" />
            <button className="btn" type="submit" disabled={busy}>{busy ? 'Looking…' : 'Find items'}</button>
          </form>
          {err && <p style={{ color: 'var(--red)', marginBottom: 0 }} role="alert">{err}</p>}
          {recent.length > 0 && <>
            <p className="muted" style={{ margin: '18px 0 8px' }}>Recent lookups</p>
            <div className="chips">{recent.map(r => <button key={r} className="chip" onClick={() => lookup(r)}>{r}</button>)}</div>
          </>}
        </div>

        {hits.length > 0 ? (<>
          {hits.length > 1 && <p className="muted" style={{ margin: 0 }}>This tag covers {hits.length} items.</p>}
          {hits.map(hit => {
            const action = actionFor(hit)
            return (
              <Ticket key={hit.id} it={hit} tone={hit.status === 'Stored' ? 'good' : hit.status === 'Rejected' ? 'bad' : ''}>
                {action
                  ? <Link className="btn" to={action[1]}>{action[0]}</Link>
                  : <p className="muted" style={{ margin: 0 }}>This item is already {hit.status.toLowerCase()}. Nothing more to do.</p>}
              </Ticket>
            )
          })}
        </>) : (
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