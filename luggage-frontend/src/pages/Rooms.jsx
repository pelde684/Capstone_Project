import { useEffect, useState } from 'react'
import { api } from '../api'
import { HOSTELS, HOSTEL_ROOMS, splitRoom } from '../hostelRooms'

// Which hostel room each programme stores its luggage in (e.g. SWE and ME -> HF 210).
// The admin picks a hostel, then a room number; operators see the same lists read-only,
// so they know which room a student's items belong in. Students see their own room on the student site.
// (Programmes are stored as "departments" in the backend.)

// Hostel + room number, or another storage room (e.g. "Luggage Room"). Calls onPick with what to send.
function RoomPicker({ current, rooms, onPick, disabled, label }) {
  const parsed = splitRoom(current)
  const others = rooms.filter((r) => !splitRoom(r.location))
  const [hostel, setHostel] = useState(parsed ? parsed.hostel : current ? 'OTHER' : '')
  const [room, setRoom] = useState(parsed ? parsed.room : '')
  useEffect(() => { // follow changes saved elsewhere
    const p = splitRoom(current)
    setHostel(p ? p.hostel : current ? 'OTHER' : ''); setRoom(p ? p.room : '')
  }, [current])

  const pickHostel = (h) => {
    setHostel(h); setRoom('')
    if (h === '') onPick({ roomId: null })
  }
  return (
    <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
      <select value={hostel} disabled={disabled} onChange={(e) => pickHostel(e.target.value)} aria-label={`${label}: hostel`}>
        <option value="">No room</option>
        {HOSTELS.map((h) => <option key={h} value={h}>{h}</option>)}
        {others.length > 0 && <option value="OTHER">Other room</option>}
      </select>
      {hostel === 'OTHER' ? (
        <select value={rooms.find((r) => r.location === current)?.id ?? ''} disabled={disabled}
          onChange={(e) => e.target.value && onPick({ roomId: Number(e.target.value) })} aria-label={`${label}: room`}>
          <option value="">Choose…</option>
          {others.map((r) => <option key={r.id} value={r.id}>{r.location}</option>)}
        </select>
      ) : hostel ? (
        <select value={room} disabled={disabled}
          onChange={(e) => { setRoom(e.target.value); if (e.target.value) onPick({ roomName: `${hostel} ${e.target.value}` }) }} aria-label={`${label}: room number`}>
          <option value="">Room…</option>
          {HOSTEL_ROOMS[hostel].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      ) : null}
    </span>
  )
}

const space = (r) => (r.capacity == null ? `${r.used} stored` : `${r.used} / ${r.capacity}${r.used >= r.capacity ? ' (full)' : ''}`)

export default function Rooms({ canEdit, onChanged }) {
  const [rooms, setRooms] = useState([])
  const [depts, setDepts] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [newRoom, setNewRoom] = useState({ location: '', capacity: '' })
  const [newDept, setNewDept] = useState({ name: '', room: {} })

  const load = () =>
    Promise.all([api(`/locations${canEdit ? '?all=1' : ''}`), api(`/departments${canEdit ? '?all=1' : ''}`)])
      .then(([l, d]) => { setRooms(l.data); setDepts(d.data); setErr('') })
      .catch((e) => setErr(e.message))
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Runs one change, then reloads this page and the rest of the app (the Verify page uses the rooms)
  const save = async (fn, done) => {
    setBusy(true); setMsg(''); setErr('')
    try { await fn(); setMsg(done); await load(); onChanged?.(); return true } catch (e) { setErr(e.message); return false } finally { setBusy(false) }
  }

  const addRoom = (e) => {
    e.preventDefault()
    const capacity = newRoom.capacity === '' ? null : Number(newRoom.capacity)
    save(() => api('/locations', { method: 'POST', body: { location: newRoom.location.trim(), capacity } }), `Room "${newRoom.location.trim()}" added.`)
      .then((ok) => ok && setNewRoom({ location: '', capacity: '' }))
  }
  const addDept = (e) => {
    e.preventDefault()
    save(() => api('/departments', { method: 'POST', body: { name: newDept.name.trim(), ...newDept.room } }), `Programme "${newDept.name.trim()}" added.`)
      .then((ok) => ok && setNewDept({ name: '', room: {} }))
  }
  const allocate = (d, body) =>
    save(() => api(`/departments/${d.id}`, { method: 'PUT', body }),
      body.roomName ? `${d.name} now stores in ${body.roomName}.`
        : body.roomId ? `${d.name} now stores in ${rooms.find((r) => r.id === body.roomId)?.location}.` : `${d.name} has no room now.`)
  const toggleRoom = (r) => save(() => api(`/locations/${r.id}`, { method: 'PUT', body: { isActive: !r.isActive } }), `${r.location} ${r.isActive ? 'closed' : 'opened'}.`)
  const toggleDept = (d) => save(() => api(`/departments/${d.id}`, { method: 'PUT', body: { isActive: !d.isActive } }), `${d.name} ${d.isActive ? 'turned off' : 'turned on'}.`)

  const deptsIn = (r) => depts.filter((d) => String(d.roomId) === String(r.id) && d.isActive).map((d) => d.name)

  return (<div style={{ maxWidth: 1100 }}>
    {err && <div className="glass card" role="alert" style={{ color: 'var(--red)', marginBottom: 18 }}>{err}</div>}
    {msg && <div className="glass card" role="status" style={{ color: 'var(--green)', marginBottom: 18, fontWeight: 600 }}>{msg}</div>}

    <div className="glass card" style={{ marginBottom: 18 }}>
      <h3 style={{ marginTop: 0 }}>Programmes and their storage room</h3>
      <p className="muted" style={{ marginTop: 0 }}>Each student's items are stored in the room of their programme. Pick the hostel, then the room. Several programmes can share a room.</p>
      <div className="tw"><table>
        <thead><tr><th>Programme</th><th>Storage room</th><th>Room space</th><th>Students</th>{canEdit && <th></th>}</tr></thead>
        <tbody>
          {depts.length === 0 && <tr><td colSpan={5} className="muted">No programmes yet{canEdit ? ' - add one below.' : '.'}</td></tr>}
          {depts.map((d) => (
            <tr key={d.id} style={d.isActive ? undefined : { opacity: 0.55 }}>
              <td><b>{d.name}</b>{!d.isActive && <small className="rsub">turned off</small>}</td>
              <td>
                {canEdit
                  ? <RoomPicker current={d.room} rooms={rooms} disabled={busy} label={`Room for ${d.name}`} onPick={(body) => allocate(d, body)} />
                  : (d.room || <span className="muted">none</span>)}
              </td>
              <td className="nw">{d.room ? (d.roomCapacity == null ? `${d.roomUsed} stored` : `${d.roomUsed} / ${d.roomCapacity}`) : '-'}</td>
              <td>{d.students}</td>
              {canEdit && <td><button className="btn ghost sm" disabled={busy} onClick={() => toggleDept(d)}>{d.isActive ? 'Turn off' : 'Turn on'}</button></td>}
            </tr>
          ))}
        </tbody>
      </table></div>
      {canEdit && (
        <form className="row" onSubmit={addDept} style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
          <input value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} placeholder="New programme" maxLength={100} required aria-label="Programme name" />
          <RoomPicker key={depts.length} current="" rooms={rooms} label="Room for the new programme" onPick={(room) => setNewDept({ ...newDept, room })} />
          <button className="btn sm" disabled={busy || !newDept.name.trim()}>Add programme</button>
        </form>
      )}
    </div>

    <div className="glass card">
      <h3 style={{ marginTop: 0 }}>Storage rooms in use</h3>
      <p className="muted" style={{ marginTop: 0 }}>Hostel rooms appear here once they are given to a programme.</p>
      <div className="tw"><table>
        <thead><tr><th>Room</th><th>Space used</th><th>Programmes using it</th>{canEdit && <th></th>}</tr></thead>
        <tbody>
          {rooms.length === 0 && <tr><td colSpan={4} className="muted">No storage rooms yet{canEdit ? ' - add one below.' : '.'}</td></tr>}
          {rooms.map((r) => (
            <tr key={r.id} style={r.isActive ? undefined : { opacity: 0.55 }}>
              <td><b>{r.location}</b>{!r.isActive && <small className="rsub">closed</small>}</td>
              <td className="nw">{space(r)}</td>
              <td>{deptsIn(r).join(', ') || <span className="muted">none</span>}</td>
              {canEdit && <td><button className="btn ghost sm" disabled={busy} onClick={() => toggleRoom(r)}>{r.isActive ? 'Close' : 'Open'}</button></td>}
            </tr>
          ))}
        </tbody>
      </table></div>
      {canEdit && (
        <form className="row" onSubmit={addRoom} style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
          <input value={newRoom.location} onChange={(e) => setNewRoom({ ...newRoom, location: e.target.value })} placeholder="Other room, e.g. Luggage Room" maxLength={100} required aria-label="Room name" />
          <input type="number" min="1" value={newRoom.capacity} onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })} placeholder="Capacity (optional)" aria-label="Capacity" style={{ width: 170 }} />
          <button className="btn sm" disabled={busy || !newRoom.location.trim()}>Add room</button>
        </form>
      )}
    </div>
  </div>)
}
