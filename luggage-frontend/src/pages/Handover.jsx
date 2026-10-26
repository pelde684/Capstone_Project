import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Ticket from './Ticket'

export default function Handover({ items, setStatus }) {
  const [q, setQ] = useSearchParams()
  const [find, setFind] = useState('')
  const [sid, setSid] = useState('')
  const [err, setErr] = useState('')

  const allStored = items.filter(i => i.status === 'Stored')
  const stored = allStored.filter(i => Object.values(i).join(' ').toLowerCase().includes(find.toLowerCase()))
  const it = items.find(i => i.id === q.get('code'))

  const pick = (id) => { setQ({ code: id }); setSid(''); setErr('') }
  const confirm = () => {
    if (sid.trim() !== it.studentId) return setErr('That ID does not match the owner of this item. Ask the student to show their card.')
    setStatus(it.id, 'Returned', `${it.id} handed over to ${it.owner}`)
    setSid(''); setErr('')
  }

  return (<>
    <div className="grid2 split noprint">
      <div className="glass card">
        <h3>In storage ({allStored.length})</h3>
        <input style={{ width: '100%', marginBottom: 14 }} value={find} onChange={e => setFind(e.target.value)} placeholder="Search by name, tag or student ID" aria-label="Search stored items" />
        {stored.length === 0
          ? <div className="empty"><b>{allStored.length ? 'No match' : 'Nothing in storage'}</b>{allStored.length ? 'Try a different search.' : 'Approved items will wait here for their owners.'}</div>
          : <div className="tw"><table className="pick">
            <thead><tr><th>Tag</th><th>Item</th><th>Owner</th><th></th></tr></thead>
            <tbody>{stored.map(p => {
              const on = it?.id === p.id
              return (
                <tr key={p.id} className={on ? 'sel' : ''} onClick={() => pick(p.id)}>
                  <td className="nw">{p.id}</td><td>{p.name}</td><td>{p.owner}</td>
                  <td><button className={'btn sm ' + (on ? 'on' : 'ghost')} onClick={(e) => { e.stopPropagation(); pick(p.id) }}>{on ? 'Selected' : 'Select'}</button></td>
                </tr>
              )
            })}</tbody>
          </table></div>}
      </div>

      <div>
        {!it ? (
          <div className="glass card empty"><b>Pick an item</b>Choose a stored item on the left to hand it back to its owner.</div>
        ) : (
          <Ticket it={it} tone={it.status === 'Returned' ? 'good' : ''}>
            {it.status === 'Stored' && <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, fontWeight: 600 }}>
                Ask the student for their ID
                <input value={sid} onChange={e => { setSid(e.target.value); setErr('') }} placeholder="Student ID" onKeyDown={e => e.key === 'Enter' && confirm()} />
              </label>
              {err && <p style={{ color: 'var(--red)', marginTop: 0 }} role="alert">{err}</p>}
              <button className="btn big" disabled={!sid.trim()} onClick={confirm}>Confirm handover</button>
            </>}
            {it.status === 'Returned' && (
              <div className="row" style={{ alignItems: 'center' }}>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>Handed back to {it.owner}</span>
                <button className="btn ghost" onClick={() => window.print()}>Print receipt</button>
              </div>
            )}
            {it.status !== 'Stored' && it.status !== 'Returned' && <p className="muted" style={{ margin: 0 }}>This item is {it.status.toLowerCase()} and cannot be handed over.</p>}
          </Ticket>
        )}
      </div>
    </div>

    {it?.status === 'Returned' && (
      <article className="onlyprint report">
        <header><h1>Handover receipt</h1><div className="muted">CST Luggage Room</div></header>
        <table>
          <tbody>
            <tr><th>Tag number</th><td>{it.id}</td></tr>
            <tr><th>Item</th><td>{it.name}</td></tr>
            <tr><th>Description</th><td>{it.description}</td></tr>
            <tr><th>Owner</th><td>{it.owner}</td></tr>
            <tr><th>Student ID</th><td>{it.studentId}</td></tr>
          </tbody>
        </table>
        <p>The item above was returned to its owner.</p>
        <div className="sign"><div>Student signature</div><div>Operator signature</div></div>
      </article>
    )}
  </>)
}