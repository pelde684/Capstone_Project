import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

const checks = ['The name tag matches the student', 'The contents match the description', 'The bag is closed and in good condition']
const reasons = ['Description does not match', 'No name tag', 'Damaged or open bag', 'Not allowed in storage']

function ReviewCard({ it, actions, locationId }) {
  const [ok, setOk] = useState(checks.map(() => false))
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [again, setAgain] = useState(false) // re-check an item that was rejected earlier
  const all = ok.every(Boolean)
  const reviewing = it.status === 'Pending' || (it.status === 'Rejected' && again)

  // Saves the decision in the backend; errors are shown as a message by App
  const decide = async (fn) => {
    setBusy(true)
    try { await fn(); setAgain(false); setOk(checks.map(() => false)); setReason('') } catch { /* toast already shown */ } finally { setBusy(false) }
  }
  const edge = it.status === 'Stored' ? 'var(--green)' : it.status === 'Rejected' ? 'var(--red)' : undefined

  return (
    <div className="glass vcard" style={edge ? { borderColor: edge } : undefined}>
      <div className="vhead">
        <div><small>Student</small><b>{it.owner}</b></div>
        <div><small>Student ID</small><b>{it.studentId}</b></div>
      </div>

      <div className="vitem">
        {it.photo && (
          <a href={it.photo} target="_blank" rel="noreferrer" title="Open the photo full size">
            <img src={it.photo} alt={`Photo of ${it.name}`} style={{ width: '100%', maxWidth: 320, maxHeight: 240, objectFit: 'cover', borderRadius: 12, marginBottom: 10 }} />
          </a>
        )}
        <h4>{it.name}</h4>
        <div className="qr">Tag number: {it.tag}. Category: {it.category}{it.hostel ? `. Hostel: ${it.hostel}` : ''}</div>
        <div>{it.description}</div>
        {it.status === 'Rejected' && it.rejectReason && <div style={{ color: 'var(--red)', marginTop: 6 }}>Rejected earlier: {it.rejectReason}</div>}
      </div>

      {reviewing ? <>
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
          <button className="btn ghost big" disabled={!reason || busy} onClick={() => decide(() => actions.reject(it, reason))}>Reject</button>
          <button className="btn big" disabled={!all || !locationId || busy} onClick={() => decide(() => actions.approve(it, locationId))}>{busy ? 'Saving…' : 'Approve'}</button>
        </div>
        {!all && <p className="muted" style={{ margin: '12px 0 0', textAlign: 'right', fontSize: 14 }}>Tick all three checks to approve.</p>}
        {all && !locationId && <p style={{ color: 'var(--red)', margin: '12px 0 0', textAlign: 'right', fontSize: 14 }}>Choose a shelf at the top of the page first.</p>}
      </> : (
        <div className="vact">
          {it.status === 'Stored' && <button className="btn approved big" disabled>Approved{it.location ? `, on ${it.location}` : ''}</button>}
          {it.status === 'Rejected' && <>
            <button className="btn ghost" onClick={() => setAgain(true)}>Check again</button>
            <button className="btn red big" disabled>Rejected</button>
          </>}
          {it.status === 'Returned' && <span className="badge Returned">Already returned</span>}
        </div>
      )}
    </div>
  )
}

export default function Verify({ items, locations, actions }) {
  const [q] = useSearchParams()
  const code = q.get('code')
  // Fixed list, so an approved card stays on screen and turns green
  const [ids] = useState(() => {
    const pending = items.filter(i => i.status === 'Pending').map(i => i.id)
    const first = code && items.some(i => i.id === code) ? [code] : []
    return [...first, ...pending.filter(x => x !== code)]
  })
  const list = ids.map(id => items.find(i => i.id === id)).filter(Boolean)
  const waiting = list.filter(i => i.status === 'Pending').length

  // Shelf that approved items go on. Full shelves are listed but cannot be picked.
  const usable = locations.filter(l => l.capacity == null || l.used < l.capacity)
  const [locationId, setLocationId] = useState(() => usable[0]?.id ?? '')
  const shelfPicker = (
    <label className="row" style={{ alignItems: 'center', marginBottom: 18, fontWeight: 600 }}>
      Store approved items in
      <select value={locationId} onChange={e => setLocationId(e.target.value)} aria-label="Storage shelf">
        {locations.length === 0 && <option value="">No shelves set up (ask the admin)</option>}
        {locations.map(l => {
          const full = l.capacity != null && l.used >= l.capacity
          return <option key={l.id} value={l.id} disabled={full}>{l.location}{l.capacity != null ? ` (${l.used}/${l.capacity}${full ? ', full' : ''})` : ''}</option>
        })}
      </select>
    </label>
  )

  if (list.length === 0) return (
    <div className="glass card empty">
      <b>Nothing to verify</b>New registrations will appear here. <Link className="tlink" to="/operator/handover">Go to handover</Link>
    </div>
  )

  return (<div style={{ maxWidth: 1100 }}>
    <p className="muted" style={{ marginTop: 0 }}>{waiting ? `${waiting} waiting. Check each bag in person, then approve or reject it.` : 'Everything in this list has been checked.'}</p>
    {shelfPicker}
    {list.map(it => <ReviewCard key={it.id} it={it} actions={actions} locationId={locationId} />)}
  </div>)
}