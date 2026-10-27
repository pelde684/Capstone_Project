import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'

const tasks = [
  'Check the pending registrations',
  'Match the tags on stored bags to the list',
  'Hand back anything students are waiting for',
  'Print the shift report before you leave',
]

export default function OperatorDashboard({ items }) {
  const nav = useNavigate()
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState([])

  const c = (s) => items.filter(i => i.status === s).length
  const pending = items.filter(i => i.status === 'Pending')
  const stored = items.filter(i => i.status === 'Stored')
  const recent = [...items].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const cats = [...new Set(stored.map(i => i.category))].map(k => [k, stored.filter(i => i.category === k).length])
  const maxCat = Math.max(...cats.map(x => x[1]), 1)

  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  const cells = [
    ['Total items', items.length, 'In the luggage room system'],
    ['Pending verification', c('Pending'), pending.length ? 'Need an operator check' : 'All caught up', pending.length > 0],
    ['Stored', c('Stored'), 'Safely in the room'],
    ['Returned', c('Returned'), 'Handed back to students'],
  ]

  // Looks the tag up in the backend (short code or full QR value) and opens the next step
  const find = async (e) => {
    e.preventDefault()
    const value = code.trim()
    if (!value) return
    try {
      const r = await api('/scan', { method: 'POST', body: { qrValue: value } })
      const found = r.items.map(x => items.find(i => i.id === String(x.id))).filter(Boolean)
      const todo = found.find(i => i.status === 'Pending' || i.status === 'Rejected')
      if (todo) return nav(`/operator/verify?code=${todo.id}`)
      const stored = found.find(i => i.status === 'Stored')
      if (stored) return nav(`/operator/handover?code=${stored.id}`)
      setErr(found.length ? `Everything on ${value.toUpperCase()} has already been returned.` : `No active items on ${value.toUpperCase()}.`)
    } catch (ex) {
      setErr(ex.message === 'QR code not recognised' ? `No items with the code “${value}”. Check the tag and try again.` : ex.message)
    }
  }
  const toggle = (t) => setDone(d => d.includes(t) ? d.filter(x => x !== t) : [...d, t])

  return (<>
    <div className="pagehead">
      <div>
        <h2>{greet}</h2>
        <p className="muted">{today}. {pending.length ? `${pending.length} item${pending.length > 1 ? 's are' : ' is'} waiting for you.` : 'Nothing is waiting for a check.'}</p>
      </div>
      <div className="row">
        <Link className="btn" to="/operator/scan">Scan a tag</Link>
        <Link className="btn ghost" to="/operator/handover">Start a handover</Link>
      </div>
    </div>

    <div className="glass strip">{cells.map(([l, n, s, warn]) => (
      <div key={l} className={'cell' + (warn ? ' warn' : '')}><span>{l}</span><b>{n}</b><p>{s}</p></div>
    ))}</div>

    <div className="grid2 wide">
      <div className="glass card">
        <h3>Waiting for a check ({pending.length})</h3>
        {pending.length === 0
          ? <div className="empty"><b>You are all caught up</b>New registrations will show up here.</div>
          : <div className="plist">{pending.map(p => (
            <div className="prow" key={p.id}>
              <div><b>{p.name}</b><small>{p.owner}, {p.studentId}</small></div>
              <div style={{ textAlign: 'right' }}><small style={{ display: 'block' }}>{p.tag}</small><Link className="tlink" to={`/operator/verify?code=${p.id}`}>Review</Link></div>
            </div>
          ))}</div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="glass card">
          <h3>Look up a tag</h3>
          <form className="row" onSubmit={find}>
            <input style={{ flex: 1 }} value={code} onChange={e => { setCode(e.target.value); setErr('') }} placeholder="8D40E85C" aria-label="Tag number" />
            <button className="btn" type="submit">Open</button>
          </form>
          {err && <p style={{ color: 'var(--red)', marginBottom: 0 }} role="alert">{err}</p>}
        </div>

        <div className="glass card">
          <h3>This shift ({done.length} of {tasks.length} done)</h3>
          <div className="checks nobox">{tasks.map(t => (
            <label key={t} className={done.includes(t) ? 'done' : ''}>
              <input type="checkbox" checked={done.includes(t)} onChange={() => toggle(t)} /><span>{t}</span>
            </label>
          ))}</div>
        </div>
      </div>
    </div>

    <div className="grid2">
      <div className="glass card"><h3>Latest registrations</h3>
        <div className="tw"><table>
          <thead><tr><th>Tag</th><th>Item</th><th>Owner</th><th>Status</th></tr></thead>
          <tbody>{recent.map(i => (
            <tr key={i.id}><td className="nw">{i.tag}</td><td>{i.name}</td><td>{i.owner}</td><td><span className={'badge ' + i.status}>{i.status}</span></td></tr>
          ))}</tbody>
        </table></div>
      </div>

      <div className="glass card"><h3>In the room now</h3>
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