import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, Clock, Package, CheckCircle2, ScanLine, ShieldCheck } from 'lucide-react'
import { Stats, Action } from './Stats'

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

  const find = (e) => {
    e.preventDefault()
    const id = code.trim().toUpperCase()
    const it = items.find(i => i.id === id)
    if (!it) return setErr(`No item with the number “${code}”. Check the tag and try again.`)
    if (it.status === 'Pending') return nav(`/operator/verify?code=${id}`)
    if (it.status === 'Stored') return nav(`/operator/handover?code=${id}`)
    setErr(`${id} is already ${it.status.toLowerCase()}.`)
  }
  const toggle = (t) => setDone(d => d.includes(t) ? d.filter(x => x !== t) : [...d, t])

  return (<>
    <Stats cells={[
      ['Total Items', items.length, Briefcase],
      ['Pending Verification', c('Pending'), Clock, pending.length > 0],
      ['Stored', c('Stored'), Package],
      ['Returned', c('Returned'), CheckCircle2],
    ]} />

    <div className="grid2">
      <Action blue to="/operator/scan" Icon={ScanLine} title="Scan QR Code" text="Scan a student’s tag to open the item instantly." link="Open scanner" />
      <Action to="/operator/verify" Icon={ShieldCheck} title="Pending Verification"
        text={pending.length ? `${pending.length} item${pending.length > 1 ? 's are' : ' is'} waiting to be checked and stored.` : 'Nothing is waiting. You are all caught up.'} link="Review items" />
    </div>

    <div className="grid2 wide">
      <div className="glass card">
        <h3>Waiting for a check ({pending.length})</h3>
        {pending.length === 0
          ? <div className="empty"><b>You are all caught up</b>New registrations will show up here.</div>
          : <div className="plist">{pending.map(p => (
            <div className="prow" key={p.id}>
              <div><b>{p.name}</b><small>{p.owner}, {p.studentId}</small></div>
              <div style={{ textAlign: 'right' }}><small style={{ display: 'block' }}>{p.id}</small><Link className="tlink" to={`/operator/verify?code=${p.id}`}>Review</Link></div>
            </div>
          ))}</div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="glass card">
          <h3>Look up a tag</h3>
          <form className="row" onSubmit={find}>
            <input style={{ flex: 1 }} value={code} onChange={e => { setCode(e.target.value); setErr('') }} placeholder="QR-2026-007" aria-label="Tag number" />
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
            <tr key={i.id}><td className="nw">{i.id}</td><td>{i.name}</td><td>{i.owner}</td><td><span className={'badge ' + i.status}>{i.status}</span></td></tr>
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