import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import NoticeSlider from '../components/NoticeSlider'

const ROOM_CAPACITY = 150 // change to your real room capacity
const STALE_DAYS = 7      // stored longer than this gets flagged
const STATUSES = ['Pending', 'Stored', 'Returned', 'Rejected']

const TASKS = [
  'Check the pending registrations',
  'Match the tags on stored bags to the list',
  'Hand back anything students are waiting for',
  'Print the shift report before you leave',
]

const dayKey = () => new Date().toISOString().slice(0, 10)

function ago(d) {
  const t = new Date(d).getTime()
  if (Number.isNaN(t)) return ''
  const m = Math.floor((Date.now() - t) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} h ago`
  const days = Math.floor(h / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

function daysSince(d) {
  const t = new Date(d).getTime()
  return Number.isNaN(t) ? 0 : Math.floor((Date.now() - t) / 86400000)
}

const nextLink = (i) =>
  i.status === 'Pending' || i.status === 'Rejected'
    ? `/operator/verify?code=${i.id}`
    : i.status === 'Stored'
    ? `/operator/handover?code=${i.id}`
    : null

export default function OperatorDashboard({ items }) {
  const nav = useNavigate()
  const inputRef = useRef(null)
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // Checklist is saved per day, so it starts fresh every morning
  const storeKey = `op-shift-${dayKey()}`
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storeKey)) || [] } catch { return [] }
  })
  useEffect(() => {
    try { localStorage.setItem(storeKey, JSON.stringify(done)) } catch { /* storage unavailable */ }
  }, [done, storeKey])

  // Press "/" anywhere to jump to the tag lookup
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const count = (s) => items.filter((i) => i.status === s).length
  const pending = items
    .filter((i) => i.status === 'Pending')
    .sort((a, b) => String(a.date).localeCompare(String(b.date))) // oldest first
  const stored = items.filter((i) => i.status === 'Stored')
  const rejected = items.filter((i) => i.status === 'Rejected')
  const stale = stored.filter((i) => daysSince(i.date) >= STALE_DAYS)
  const recent = [...items].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 6)
  const registeredToday = items.filter((i) => String(i.date).startsWith(dayKey())).length

  const cats = [...new Set(stored.map((i) => i.category))].map((k) => [k, stored.filter((i) => i.category === k).length])
  const maxCat = Math.max(...cats.map((x) => x[1]), 1)

  const capPct = Math.min(100, Math.round((stored.length / ROOM_CAPACITY) * 100))
  const total = items.length || 1

  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const cells = [
    ['Total items', items.length, `${registeredToday} registered today`, false, null],
    ['Pending verification', pending.length, pending.length ? `Oldest waiting ${ago(pending[0].date)}` : 'All caught up', pending.length > 0, pending[0] ? `/operator/verify?code=${pending[0].id}` : null],
    ['Stored', stored.length, `${capPct}% of room capacity`, capPct > 85, '/operator/handover'],
    ['Returned', count('Returned'), 'Handed back to students', false, '/operator/report'],
  ]

  const alerts = [
    pending.length > 0 && { tone: 'warn', text: `${pending.length} item${pending.length > 1 ? 's' : ''} waiting for verification`, to: `/operator/verify?code=${pending[0].id}`, cta: 'Review oldest' },
    rejected.length > 0 && { tone: 'bad', text: `${rejected.length} rejected item${rejected.length > 1 ? 's' : ''} need a re-check`, to: `/operator/verify?code=${rejected[0].id}`, cta: 'Open' },
    stale.length > 0 && { tone: 'warn', text: `${stale.length} item${stale.length > 1 ? 's have' : ' has'} been stored for ${STALE_DAYS}+ days`, to: `/operator/handover?code=${stale[0].id}`, cta: 'Contact owner' },
    capPct > 85 && { tone: 'bad', text: `Room is ${capPct}% full`, to: null },
  ].filter(Boolean)

  // Looks the tag up in the backend (short code or full QR value) and opens the next step
  const find = async (e) => {
    e.preventDefault()
    const value = code.trim()
    if (!value || busy) return
    setBusy(true)
    try {
      const r = await api('/scan', { method: 'POST', body: { qrValue: value } })
      const found = r.items.map((x) => items.find((i) => i.id === String(x.id))).filter(Boolean)
      const todo = found.find((i) => i.status === 'Pending' || i.status === 'Rejected')
      if (todo) return nav(`/operator/verify?code=${todo.id}`)
      const s = found.find((i) => i.status === 'Stored')
      if (s) return nav(`/operator/handover?code=${s.id}`)
      setErr(found.length ? `Everything on ${value.toUpperCase()} has already been returned.` : `No active items on ${value.toUpperCase()}.`)
    } catch (ex) {
      setErr(ex.message === 'QR code not recognised' ? `No items with the code “${value}”. Check the tag and try again.` : ex.message)
    } finally {
      setBusy(false)
    }
  }

  const toggle = (t) => setDone((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]))
  const progress = Math.round((done.length / TASKS.length) * 100)

  return (<>
    <NoticeSlider />

    <div className="pagehead">
      <div>
        <h2>{greet}</h2>
        <p className="muted">{today}. {pending.length ? `${pending.length} item${pending.length > 1 ? 's are' : ' is'} waiting for you.` : 'Nothing is waiting for a check.'}</p>
      </div>
      <div className="row">
        <Link className="btn" to="/operator/scan">Scan a tag</Link>
        <Link className="btn ghost" to="/operator/handover">Start a handover</Link>
        <Link className="btn ghost" to="/operator/report">Shift report</Link>
      </div>
    </div>

    <div className="glass strip">{cells.map(([l, n, s, warn, to]) => {
      const inner = <><span>{l}</span><b>{n}</b><p>{s}</p></>
      return to
        ? <Link key={l} to={to} className={'cell cell-link' + (warn ? ' warn' : '')}>{inner}</Link>
        : <div key={l} className={'cell' + (warn ? ' warn' : '')}>{inner}</div>
    })}</div>

    {alerts.length > 0 && (
      <div className="glass card od-alerts" role="status">
        <h3>Needs attention</h3>
        {alerts.map((a) => (
          <div key={a.text} className={'od-alert ' + a.tone}>
            <span>{a.text}</span>
            {a.to && <Link className="tlink" to={a.to}>{a.cta}</Link>}
          </div>
        ))}
      </div>
    )}

    <div className="grid2 wide">
      <div className="glass card">
        <h3>Waiting for a check ({pending.length})</h3>
        {pending.length === 0
          ? <div className="empty"><b>You are all caught up</b>New registrations will show up here.</div>
          : <div className="plist">{pending.slice(0, 6).map((p) => (
            <div className="prow" key={p.id}>
              <div><b>{p.name}</b><small>{p.owner}, {p.studentId}</small></div>
              <div style={{ textAlign: 'right' }}>
                <small style={{ display: 'block' }}>{p.tag} · {ago(p.date)}</small>
                <Link className="tlink" to={`/operator/verify?code=${p.id}`}>Review</Link>
              </div>
            </div>
          ))}
          {pending.length > 6 && <small className="muted">and {pending.length - 6} more…</small>}
          </div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="glass card">
          <h3>Look up a tag</h3>
          <form className="row" onSubmit={find}>
            <input ref={inputRef} style={{ flex: 1 }} value={code} onChange={(e) => { setCode(e.target.value); setErr('') }} placeholder="8D40E85C   (press / to focus)" aria-label="Tag number" />
            <button className="btn" type="submit" disabled={busy}>{busy ? 'Looking…' : 'Open'}</button>
          </form>
          {err && <p style={{ color: 'var(--red)', marginBottom: 0 }} role="alert">{err}</p>}
        </div>

        <div className="glass card">
          <h3>This shift ({done.length} of {TASKS.length} done)</h3>
          <div className="prog" style={{ marginBottom: 14 }}><i style={{ width: progress + '%' }} /></div>
          <div className="checks nobox">{TASKS.map((t) => (
            <label key={t} className={done.includes(t) ? 'done' : ''}>
              <input type="checkbox" checked={done.includes(t)} onChange={() => toggle(t)} /><span>{t}</span>
            </label>
          ))}</div>
        </div>
      </div>
    </div>

    <div className="glass card">
      <h3>All items by status</h3>
      <div className="od-seg" role="img" aria-label="Items by status">
        {STATUSES.map((s) => count(s) > 0 && <i key={s} className={'seg ' + s} style={{ width: (count(s) / total) * 100 + '%' }} title={`${s}: ${count(s)}`} />)}
      </div>
      <div className="od-legend">
        {STATUSES.map((s) => <span key={s}><i className={'od-dot ' + s} />{s} <b>{count(s)}</b></span>)}
      </div>
    </div>

    <div className="grid2">
      <div className="glass card"><h3>Latest registrations</h3>
        <div className="tw"><table>
          <thead><tr><th>Tag</th><th>Item</th><th>Owner</th><th>Status</th></tr></thead>
          <tbody>{recent.length === 0
            ? <tr><td colSpan="4" className="muted">No registrations yet.</td></tr>
            : recent.map((i) => (
              <tr key={i.id}>
                <td className="nw">{nextLink(i) ? <Link className="tlink" to={nextLink(i)}>{i.tag}</Link> : i.tag}</td>
                <td>{i.name}</td><td>{i.owner}</td>
                <td><span className={'badge ' + i.status}>{i.status}</span></td>
              </tr>
            ))}</tbody>
        </table></div>
      </div>

      <div className="glass card"><h3>In the room now</h3>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
            <span>Capacity</span><span>{stored.length} / {ROOM_CAPACITY}</span>
          </div>
          <div className={'prog' + (capPct > 85 ? ' od-full' : '')} style={{ marginTop: 8 }}><i style={{ width: capPct + '%' }} /></div>
        </div>
        {cats.length === 0 ? <div className="empty"><b>The room is empty</b>Stored items will be counted here.</div> : cats.map(([k, n]) => (
          <div key={k} style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}><span>{k}</span><span>{n}</span></div>
            <div className="prog" style={{ marginTop: 8 }}><i style={{ width: (n / maxCat) * 100 + '%' }} /></div>
          </div>
        ))}
      </div>
    </div>
  </>)
}