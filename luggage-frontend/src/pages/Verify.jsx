import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const checks = ['The name tag matches the student', 'The contents match the description', 'The bag is closed and in good condition']
const reasons = ['Description does not match', 'No name tag', 'Damaged or open bag', 'Not allowed in storage']

function ReviewCard({ it, setStatus }) {
  const [ok, setOk] = useState(checks.map(() => false))
  const [reason, setReason] = useState('')
  const all = ok.every(Boolean)
  const edge = it.status === 'Stored' ? 'var(--green)' : it.status === 'Rejected' ? 'var(--red)' : undefined

  return (
    <div className="glass vcard" style={edge ? { borderColor: edge } : undefined}>
      <div className="vhead">
        <div><small>Student</small><b>{it.owner}</b></div>
        <div><small>Student ID</small><b>{it.studentId}</b></div>
      </div>

      <div className="vitem">
        <h4>{it.name}</h4>
        <div className="qr">Tag number: {it.id}. Category: {it.category}</div>
        <div>{it.description}</div>
      </div>

      {it.status === 'Pending' ? <>
        <fieldset className="checks">
          <legend>Before you approve</legend>
          {checks.map((t, i) => (
            <label key={t}>
              <input type="checkbox" checked={ok[i]} onChange={() => setOk(ok.map((v, j) => j === i ? !v : v))} />
              <span>{t}</span>
            </label>
          ))}
        </fieldset>

        <div className="vact">
          <select value={reason} onChange={e => setReason(e.target.value)} aria-label="Reason for rejecting">
            <option value="">Reason, if rejecting</option>
            {reasons.map(r => <option key={r}>{r}</option>)}
          </select>
          <button className="btn ghost big" disabled={!reason} onClick={() => setStatus(it.id, 'Rejected', `${it.id} rejected: ${reason.toLowerCase()}`)}>Reject</button>
          <button className="btn big" disabled={!all} onClick={() => setStatus(it.id, 'Stored', `${it.id} approved and stored`)}>Approve</button>
        </div>
        {!all && <p className="muted" style={{ margin: '12px 0 0', textAlign: 'right', fontSize: 14 }}>Tick all three checks to approve.</p>}
      </> : (
        <div className="vact">
          {it.status === 'Stored' && <button className="btn approved big" disabled>Approved</button>}
          {it.status === 'Rejected' && <button className="btn red big" disabled>Rejected</button>}
          {it.status === 'Returned' && <span className="badge Returned">Already returned</span>}
        </div>
      )}
    </div>
  )
}

export default function Verify({ items, setStatus }) {
  const [q] = useSearchParams()
  const code = q.get('code')
  // Fixed list, so an approved card stays on screen and turns green
  const [ids] = useState(() => {
    const pending = items.filter(i => i.status === 'Pending').map(i => i.id)
    const first = code && items.some(i => i.id === code) ? [code] : []
    return [...first, ...pending.filter(x => x !== code)]
  })
  const list = ids.map(id => items.find(i => i.id === id))
  const waiting = list.filter(i => i.status === 'Pending').length

  if (list.length === 0) return (
    <div className="glass card empty">
      <b>Nothing to verify</b>New registrations will appear here. <Link className="tlink" to="/operator/handover">Go to handover</Link>
    </div>
  )

  return (<div style={{ maxWidth: 1100 }}>
    <p className="muted" style={{ marginTop: 0 }}>{waiting ? `${waiting} waiting. Check each bag in person, then approve or reject it.` : 'Everything in this list has been checked.'}</p>
    {list.map(it => <ReviewCard key={it.id} it={it} setStatus={setStatus} />)}
  </div>)
}