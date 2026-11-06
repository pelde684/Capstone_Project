import { useEffect, useState } from 'react'
import { api, apiAll } from '../api'

// Feedback and complaints sent by students from the student site (Feedback page).
// The admin reads them, forwards them to someone (e.g. "Hostel warden"), and writes how each was resolved.
// The student sees the status, who it was forwarded to and the reply on their Feedback page.

const STATUSES = [
  ['OPEN', 'New', 'Pending'],
  ['FORWARDED', 'Forwarded', 'Stored'],
  ['IN_PROGRESS', 'In progress', 'Stored'],
  ['RESOLVED', 'Resolved', 'Returned'],
  ['CLOSED', 'Closed', ''],
]
const LABEL = Object.fromEntries(STATUSES.map(([k, l, tone]) => [k, [l, tone]]))
const when = (s) => (s ? new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')

// Type of feedback chosen by the student (complaints.category, migration 008)
const CATEGORY = { COMPLAINT: 'Complaint', NOT_WORKING: "Something isn't working", SUGGESTION: 'Suggestion', OTHER: 'Other' }

export default function AdminComplaints() {
  const [list, setList] = useState([])
  const [counts, setCounts] = useState({})
  const [filter, setFilter] = useState('OPEN')
  const [sel, setSel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([apiAll('/complaints'), api('/complaints?limit=1')])
      .then(([all, r]) => { setList(all); setCounts(r.byStatus || {}); setErr('') })
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const shown = filter === 'All' ? list : list.filter((c) => c.status === filter)
  const current = list.find((c) => c.id === sel)

  return (<>
    <div className="fchips noprint" role="group" aria-label="Filter by status" style={{ marginBottom: 18 }}>
      {[['All', 'All'], ...STATUSES.map(([k, l]) => [k, l])].map(([k, l]) => (
        <button key={k} className={'fchip' + (filter === k ? ' on' : '')} aria-pressed={filter === k} onClick={() => { setFilter(k); setSel(null) }}>
          {l}<span>{k === 'All' ? list.length : counts[k] ?? 0}</span>
        </button>
      ))}
    </div>

    {err && <div className="glass card" role="alert" style={{ color: 'var(--red)', marginBottom: 18 }}>Could not load complaints: {err}</div>}

    <div className={'sgrid' + (current ? ' open' : '')}>
      <div className="glass card">
        <div className="tw">
          <table className="pick">
            <thead><tr><th>Received</th><th>Student</th><th>Subject</th><th>Type</th><th>Status</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="muted">Loading…</td></tr>
              ) : shown.length === 0 ? (
                <tr><td colSpan={5} className="muted">No {filter === 'All' ? '' : LABEL[filter][0].toLowerCase() + ' '}complaints.</td></tr>
              ) : shown.map((c) => {
                const [label, tone] = LABEL[c.status] || [c.status, '']
                return (
                  <tr key={c.id} className={sel === c.id ? 'sel' : ''} onClick={() => setSel(sel === c.id ? null : c.id)}>
                    <td className="nw">{when(c.createdAt)}</td>
                    <td>{c.studentName}<small className="rsub">{c.studentId}{c.studentHostel ? ` · ${c.studentHostel}` : ''}</small></td>
                    <td>{c.subject}</td>
                    <td>{CATEGORY[c.category] || '-'}</td>
                    <td><span className={'badge ' + tone}>{label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {current && <Detail key={current.id} c={current} onClose={() => setSel(null)} onSaved={load} />}
    </div>
  </>)
}

function Detail({ c, onClose, onSaved }) {
  const [label, tone] = LABEL[c.status] || [c.status, '']
  const [forwardedTo, setForwardedTo] = useState(c.forwardedTo || '')
  const [resolution, setResolution] = useState(c.resolution || '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const closed = c.status === 'CLOSED'

  const save = async (body, done) => {
    setBusy(true); setMsg('')
    try {
      await api(`/complaints/${c.id}`, { method: 'PATCH', body })
      setMsg(done)
      onSaved()
    } catch (e) {
      setMsg('Could not save: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="glass card sdetail noprint" aria-label={`Complaint: ${c.subject}`}>
      <div className="shead">
        <div>
          <h3>{c.subject}</h3>
          <p className="muted">From {c.studentName}, {when(c.createdAt)}</p>
        </div>
        <button className="btn ghost sm" onClick={onClose}>Close</button>
      </div>
      <div className="schips"><span className={'badge ' + tone}>{label}</span></div>

      <p style={{ whiteSpace: 'pre-wrap', margin: '14px 0 0' }}>{c.description}</p>

      <dl className="facts" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div><dt>Student ID</dt><dd>{c.studentId}</dd></div>
        {c.studentHostel && <div><dt>Hostel</dt><dd>{c.studentHostel}</dd></div>}
        {c.category && <div><dt>Type</dt><dd>{CATEGORY[c.category] || c.category}</dd></div>}
        {c.page && <div><dt>Page</dt><dd>{c.page}</dd></div>}
        {c.itemName && <div><dt>Item</dt><dd>{c.itemName}</dd></div>}
        {c.handledByName && <div><dt>Handled by</dt><dd>{c.handledByName}</dd></div>}
        {c.resolvedAt && <div><dt>Resolved</dt><dd>{when(c.resolvedAt)}</dd></div>}
      </dl>

      {closed ? (
        <>
          {c.forwardedTo && <p><b>Forwarded to:</b> {c.forwardedTo}</p>}
          {c.resolution && <p style={{ whiteSpace: 'pre-wrap' }}><b>Resolution:</b> {c.resolution}</p>}
          <p className="muted">This complaint is closed and can no longer be changed.</p>
        </>
      ) : (
        <>
          <label style={{ display: 'grid', gap: 6, marginTop: 16, fontWeight: 600, fontSize: 14 }}>
            Forward to (person or department)
            <input value={forwardedTo} maxLength={150} onChange={(e) => setForwardedTo(e.target.value)} placeholder="e.g. Hostel warden, ICT office" style={{ minWidth: 0 }} />
          </label>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn sm" disabled={busy || !forwardedTo.trim()} onClick={() => save({ status: 'FORWARDED', forwardedTo: forwardedTo.trim() }, 'Forwarded.')}>Forward</button>
            <button className="btn ghost sm" disabled={busy || c.status === 'IN_PROGRESS'} onClick={() => save({ status: 'IN_PROGRESS' }, 'Marked as in progress.')}>Mark in progress</button>
          </div>

          <label style={{ display: 'grid', gap: 6, marginTop: 18, fontWeight: 600, fontSize: 14 }}>
            Resolution (the student sees this as the reply)
            <textarea value={resolution} maxLength={2000} rows={3} onChange={(e) => setResolution(e.target.value)} placeholder="What was done about it" />
          </label>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn green sm" disabled={busy || !resolution.trim()} onClick={() => save({ status: 'RESOLVED', resolution: resolution.trim() }, 'Resolved. The student can see your reply.')}>Resolve</button>
            {c.status === 'RESOLVED' && (
              <button className="btn ghost sm" disabled={busy} onClick={() => save({ status: 'CLOSED' }, 'Closed.')}>Close complaint</button>
            )}
          </div>
        </>
      )}
      {msg && <p role="status" style={{ marginTop: 12, fontWeight: 600, color: msg.startsWith('Could not') ? 'var(--red)' : 'var(--green)' }}>{msg}</p>}
    </aside>
  )
}
