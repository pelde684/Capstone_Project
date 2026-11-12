
import { useEffect, useState } from 'react'
import { api } from '../api'
import { HOSTELS, HOSTEL_ROOMS, splitRoom } from '../hostelRooms'

// Hostel room picker
function RoomPicker({ current, rooms, onPick, disabled, label }) {
  const parsed = splitRoom(current)
  const others = rooms.filter((r) => !splitRoom(r.location))

  const [hostel, setHostel] = useState(
    parsed ? parsed.hostel : current ? 'OTHER' : ''
  )
  const [room, setRoom] = useState(parsed ? parsed.room : '')

  useEffect(() => {
    const p = splitRoom(current)
    setHostel(p ? p.hostel : current ? 'OTHER' : '')
    setRoom(p ? p.room : '')
  }, [current])

  const pickHostel = (h) => {
    setHostel(h)
    setRoom('')
    if (h === '') onPick({ roomId: null })
  }

  return (
    <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
      <select
        value={hostel}
        disabled={disabled}
        onChange={(e) => pickHostel(e.target.value)}
        aria-label={`${label}: hostel`}
      >
        <option value="">No room</option>
        {HOSTELS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
        {others.length > 0 && <option value="OTHER">Other room</option>}
      </select>

      {hostel === 'OTHER' ? (
        <select
          value={rooms.find((r) => r.location === current)?.id ?? ''}
          disabled={disabled}
          onChange={(e) =>
            e.target.value && onPick({ roomId: Number(e.target.value) })
          }
          aria-label={`${label}: room`}
        >
          <option value="">Choose…</option>
          {others.map((r) => (
            <option key={r.id} value={r.id}>{r.location}</option>
          ))}
        </select>
      ) : hostel ? (
        <select
          value={room}
          disabled={disabled}
          onChange={(e) => {
            setRoom(e.target.value)
            if (e.target.value) {
              onPick({ roomName: `${hostel} ${e.target.value}` })
            }
          }}
          aria-label={`${label}: room number`}
        >
          <option value="">Room…</option>
          {(HOSTEL_ROOMS[hostel] || []).map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      ) : null}
    </span>
  )
}

const space = (r) =>
  r.capacity == null
    ? `${r.used} stored`
    : `${r.used} / ${r.capacity}${r.used >= r.capacity ? ' (full)' : ''}`

export default function Rooms({ canEdit, onChanged }) {
  const [rooms, setRooms] = useState([])
  const [depts, setDepts] = useState([])
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const [newRoom, setNewRoom] = useState({
    location: '',
    capacity: ''
  })

  const [newDept, setNewDept] = useState({
    name: '',
    room: {}
  })

  // Search states
  const [deptSearch, setDeptSearch] = useState('')
  const [roomSearch, setRoomSearch] = useState('')

  // Hostel dropdown filter
  const [selectedHostel, setSelectedHostel] = useState('ALL')

  const load = () =>
    Promise.all([
      api(`/locations${canEdit ? '?all=1' : ''}`),
      api(`/departments${canEdit ? '?all=1' : ''}`)
    ])
      .then(([l, d]) => {
        setRooms(l.data)
        setDepts(d.data)
        setErr('')
      })
      .catch((e) => setErr(e.message))

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Save and reload
  const save = async (fn, done) => {
    setBusy(true)
    setMsg('')
    setErr('')

    try {
      await fn()
      setMsg(done)
      await load()
      onChanged?.()
      return true
    } catch (e) {
      setErr(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  // Add room
  const addRoom = (e) => {
    e.preventDefault()

    const capacity =
      newRoom.capacity === '' ? null : Number(newRoom.capacity)

    save(
      () =>
        api('/locations', {
          method: 'POST',
          body: {
            location: newRoom.location.trim(),
            capacity
          }
        }),
      `Room "${newRoom.location.trim()}" added.`
    ).then((ok) => {
      if (ok) setNewRoom({ location: '', capacity: '' })
    })
  }

  // Add programme
  const addDept = (e) => {
    e.preventDefault()

    save(
      () =>
        api('/departments', {
          method: 'POST',
          body: {
            name: newDept.name.trim(),
            ...newDept.room
          }
        }),
      `Programme "${newDept.name.trim()}" added.`
    ).then((ok) => {
      if (ok) setNewDept({ name: '', room: {} })
    })
  }

  // Allocate room
  const allocate = (d, body) =>
    save(
      () => api(`/departments/${d.id}`, {
        method: 'PUT',
        body
      }),
      body.roomName
        ? `${d.name} now stores in ${body.roomName}.`
        : body.roomId
          ? `${d.name} now stores in ${
              rooms.find((r) => r.id === body.roomId)?.location
            }.`
          : `${d.name} has no room now.`
    )

  // Open or close room
  const toggleRoom = (r) =>
    save(
      () =>
        api(`/locations/${r.id}`, {
          method: 'PUT',
          body: { isActive: !r.isActive }
        }),
      `${r.location} ${r.isActive ? 'closed' : 'opened'}.`
    )

  // Turn programme on or off
  const toggleDept = (d) =>
    save(
      () =>
        api(`/departments/${d.id}`, {
          method: 'PUT',
          body: { isActive: !d.isActive }
        }),
      `${d.name} ${d.isActive ? 'turned off' : 'turned on'}.`
    )

  // Get programmes using a room
  const deptsIn = (r) =>
    depts
      .filter(
        (d) => String(d.roomId) === String(r.id) && d.isActive
      )
      .map((d) => d.name)

  // Filter programmes
  const filteredDepts = depts.filter((d) =>
    `${d.name} ${d.room || ''}`
      .toLowerCase()
      .includes(deptSearch.trim().toLowerCase())
  )

  // Filter storage rooms by hostel and search text
  const filteredRooms = rooms.filter((r) => {
    const programmes = deptsIn(r).join(' ')
    const parsed = splitRoom(r.location)

    // Hostel dropdown filter
    const matchesHostel =
      selectedHostel === 'ALL' ||
      parsed?.hostel === selectedHostel

    // Search filter
    const matchesSearch = `${r.location} ${programmes}`
      .toLowerCase()
      .includes(roomSearch.trim().toLowerCase())

    return matchesHostel && matchesSearch
  })

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* Error message */}
      {err && (
        <div
          className="glass card"
          role="alert"
          style={{ color: 'var(--red)', marginBottom: 18 }}
        >
          {err}
        </div>
      )}

      {/* Success message */}
      {msg && (
        <div
          className="glass card"
          role="status"
          style={{
            color: 'var(--green)',
            marginBottom: 18,
            fontWeight: 600
          }}
        >
          {msg}
        </div>
      )}

      {/* PROGRAMMES SECTION */}
      <div className="glass card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>
          Programmes and their storage room
        </h3>

        <p className="muted" style={{ marginTop: 0 }}>
          Each student's items are stored in the room of their programme.
          Pick the hostel, then the room. Several programmes can share a room.
        </p>

        {/* Programme search */}
        <div
          className="row"
          style={{ gap: 8, marginBottom: 14, flexWrap: 'wrap' }}
        >
          <input
            value={deptSearch}
            onChange={(e) => setDeptSearch(e.target.value)}
            placeholder="Search programme or storage room..."
            aria-label="Search programmes"
            style={{ flex: 1, minWidth: 180 }}
          />

          <button
            className="btn sm"
            type="button"
            onClick={() => setDeptSearch(deptSearch.trim())}
          >
            Search
          </button>

          <button
            className="btn ghost sm"
            type="button"
            onClick={() => setDeptSearch('')}
          >
            Clear
          </button>
        </div>

        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Programme</th>
                <th>Storage room</th>
                <th>Room space</th>
                <th>Students</th>
                {canEdit && <th></th>}
              </tr>
            </thead>

            <tbody>
              {filteredDepts.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="muted">
                    {depts.length === 0
                      ? 'No programmes yet.'
                      : 'No matching programmes found.'}
                  </td>
                </tr>
              )}

              {filteredDepts.map((d) => (
                <tr
                  key={d.id}
                  style={d.isActive ? undefined : { opacity: 0.55 }}
                >
                  <td>
                    <b>{d.name}</b>
                    {!d.isActive && (
                      <small className="rsub">turned off</small>
                    )}
                  </td>

                  <td>
                    {canEdit ? (
                      <RoomPicker
                        current={d.room}
                        rooms={rooms}
                        disabled={busy}
                        label={`Room for ${d.name}`}
                        onPick={(body) => allocate(d, body)}
                      />
                    ) : (
                      d.room || <span className="muted">none</span>
                    )}
                  </td>

                  <td className="nw">
                    {d.room
                      ? d.roomCapacity == null
                        ? `${d.roomUsed} stored`
                        : `${d.roomUsed} / ${d.roomCapacity}`
                      : '-'}
                  </td>

                  <td>{d.students}</td>

                  {canEdit && (
                    <td>
                      <button
                        className="btn ghost sm"
                        disabled={busy}
                        onClick={() => toggleDept(d)}
                      >
                        {d.isActive ? 'Turn off' : 'Turn on'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add programme */}
        {canEdit && (
          <form
            className="row"
            onSubmit={addDept}
            style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}
          >
            <input
              value={newDept.name}
              onChange={(e) =>
                setNewDept({ ...newDept, name: e.target.value })
              }
              placeholder="New programme"
              maxLength={100}
              required
              aria-label="Programme name"
            />

            <RoomPicker
              key={depts.length}
              current=""
              rooms={rooms}
              label="Room for the new programme"
              onPick={(room) => setNewDept({ ...newDept, room })}
            />

            <button
              className="btn sm"
              disabled={busy || !newDept.name.trim()}
            >
              Add programme
            </button>
          </form>
        )}
      </div>

      {/* STORAGE ROOMS SECTION */}
      <div className="glass card">
        <h3 style={{ marginTop: 0 }}>
          Storage rooms in use
        </h3>

        <p className="muted" style={{ marginTop: 0 }}>
          Hostel rooms appear here once they are given to a programme.
          Select a hostel to view its rooms.
        </p>

        {/* Hostel dropdown and room search */}
        <div
          className="row"
          style={{ gap: 8, marginBottom: 14, flexWrap: 'wrap' }}
        >
          <select
            value={selectedHostel}
            onChange={(e) => setSelectedHostel(e.target.value)}
            aria-label="Filter rooms by hostel"
            style={{ minWidth: 150 }}
          >
            <option value="ALL">All Hostels</option>
            {HOSTELS.map((h) => (
              <option key={h} value={h}>
                Hostel {h}
              </option>
            ))}
          </select>

          <input
            value={roomSearch}
            onChange={(e) => setRoomSearch(e.target.value)}
            placeholder="Search room or programme..."
            aria-label="Search storage rooms"
            style={{ flex: 1, minWidth: 180 }}
          />

          <button
            className="btn sm"
            type="button"
            onClick={() => setRoomSearch(roomSearch.trim())}
          >
            Search
          </button>

          <button
            className="btn ghost sm"
            type="button"
            onClick={() => {
              setRoomSearch('')
              setSelectedHostel('ALL')
            }}
          >
            Clear
          </button>
        </div>

        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>Room</th>
                <th>Space used</th>
                <th>Programmes using it</th>
                {canEdit && <th></th>}
              </tr>
            </thead>

            <tbody>
              {filteredRooms.length === 0 && (
                <tr>
                  <td colSpan={canEdit ? 4 : 3} className="muted">
                    {rooms.length === 0
                      ? 'No storage rooms yet.'
                      : 'No matching rooms found for this hostel.'}
                  </td>
                </tr>
              )}

              {filteredRooms.map((r) => (
                <tr
                  key={r.id}
                  style={r.isActive ? undefined : { opacity: 0.55 }}
                >
                  <td>
                    <b>{r.location}</b>
                    {!r.isActive && (
                      <small className="rsub">closed</small>
                    )}
                  </td>

                  <td className="nw">{space(r)}</td>

                  <td>
                    {deptsIn(r).join(', ') || (
                      <span className="muted">none</span>
                    )}
                  </td>

                  {canEdit && (
                    <td>
                      <button
                        className="btn ghost sm"
                        disabled={busy}
                        onClick={() => toggleRoom(r)}
                      >
                        {r.isActive ? 'Close' : 'Open'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add storage room */}
        {canEdit && (
          <form
            className="row"
            onSubmit={addRoom}
            style={{ marginTop: 14, gap: 10, flexWrap: 'wrap' }}
          >
            <input
              value={newRoom.location}
              onChange={(e) =>
                setNewRoom({ ...newRoom, location: e.target.value })
              }
              placeholder="Other room, e.g. Luggage Room"
              maxLength={100}
              required
              aria-label="Room name"
            />

            <input
              type="number"
              min="1"
              value={newRoom.capacity}
              onChange={(e) =>
                setNewRoom({ ...newRoom, capacity: e.target.value })
              }
              placeholder="Capacity (optional)"
              aria-label="Capacity"
              style={{ width: 170 }}
            />

            <button
              className="btn sm"
              disabled={busy || !newRoom.location.trim()}
            >
              Add room
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
