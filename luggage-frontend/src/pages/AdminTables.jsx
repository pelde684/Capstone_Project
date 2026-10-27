import { useState, useEffect } from 'react'
import { ChevronDown, CalendarDays, X } from 'lucide-react'

const statusOrder = ['Pending', 'Stored', 'Returned', 'Rejected']

const heads = {
  id: 'Tag',
  name: 'Item',
  category: 'Category',
  owner: 'Owner',
  studentId: 'Student ID',
  hostel: 'Hostel',
  location: 'Shelf',
  date: 'Registered',
  status: 'Status',
  verifiedBy: 'Verified by'
}

const fmtDay = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  })

const rank = { reg: 0, ok: 1, bad: 1, back: 2 }

function Day({ id, title, meta, open, toggle, children }) {
  return (
    <section className={'acc' + (open ? ' open' : '')}>
      <button
        className="acc-head"
        aria-expanded={open}
        aria-controls={`day-${id}`}
        onClick={() => toggle(id)}
      >
        <span>
          {title}
          <small className="meta">{meta}</small>
        </span>
        <ChevronDown size={20} />
      </button>

      <div className="acc-body" id={`day-${id}`}>
        <div className="acc-inner">{children}</div>
      </div>
    </section>
  )
}

export default function AdminTables({ items, students, staff, initial = 'Items' }) {
  const [tab, setTab] = useState(initial)
  const [q, setQ] = useState('')
  const [st, setSt] = useState('All')
  const [sel, setSel] = useState(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [sort, setSort] = useState({ key: 'date', dir: 'desc' })
  const [openDays, setOpenDays] = useState({})

  // Reset when sidebar link changes
  useEffect(() => {
    setTab(initial)
    setQ('')
    setSel(null)
    setSelectedDate('')
  }, [initial])

  const has = (o) =>
    Object.values(o).join(' ').toLowerCase().includes(q.toLowerCase())

  const matchesDate = (date) =>
    !selectedDate || date?.slice(0, 10) === selectedDate

  const mine = (sid) => items.filter(i => i.studentId === sid)
  const doneBy = (email) => items.filter(i => i.verifiedBy === email)

  const nameOf = (email) =>
    staff.find(s => s.email === email)?.name || email || '-'

  const now = new Date().toLocaleString('en-GB', {
    dateStyle: 'long',
    timeStyle: 'short'
  })

  const pick = (id) => setSel(sel === id ? null : id)

  const sortBy = (key) =>
    setSort(s =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )

  // Activity feed
  const allEvents = items.flatMap(i => [
    {
      date: i.date,
      kind: 'reg',
      who: { name: i.owner, key: i.studentId },
      verb: 'registered',
      item: i.name,
      tag: i.tag
    },

    i.verifiedOn && {
      date: i.verifiedOn,
      kind: i.status === 'Rejected' ? 'bad' : 'ok',
      who: { name: nameOf(i.verifiedBy), key: i.verifiedBy },
      verb: i.status === 'Rejected' ? 'rejected' : 'approved',
      item: i.name,
      tag: i.tag,
      from: { name: i.owner, key: i.studentId }
    },

    i.returnedOn && {
      date: i.returnedOn,
      kind: 'back',
      who: { name: i.owner, key: i.studentId },
      verb: 'collected',
      item: i.name,
      tag: i.tag
    }
  ].filter(Boolean))

  const events = allEvents
    .filter(e =>
      `${e.who.name} ${e.verb} ${e.item} ${e.from?.name || ''} ${e.tag}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      matchesDate(e.date)
    )
    .sort((a, b) =>
      b.date.localeCompare(a.date) || rank[b.kind] - rank[a.kind]
    )

  const days = [...new Set(events.map(e => e.date))]

  const isOpen = (d) =>
    q || selectedDate ? true : (openDays[d] ?? d === days[0])

  const toggleDay = (d) =>
    setOpenDays(o => ({ ...o, [d]: !isOpen(d) }))

  const setAllDays = (v) =>
    setOpenDays(Object.fromEntries(days.map(d => [d, v])))

  const allDaysOpen = days.length > 0 && days.every(isOpen)

  const evSel = (e) =>
    sel && (sel === e.who.key || sel === e.from?.key)

  const tabs = [
    ['Students', students.length],
    ['Items', items.length],
    ['Activity', allEvents.length],
    ['Staff', staff.length]
  ]

  // Selection
  const stu = students.find(s => s.studentId === sel)
  const stuItems = stu ? mine(stu.studentId) : []

  const person = staff.find(s => s.email === sel)
  const checked = person ? doneBy(person.email) : []

  const rejected = checked.filter(i => i.status === 'Rejected').length
  const it = items.find(i => i.id === sel)

  const open =
    tab === 'Students' ? !!stu :
    tab === 'Staff' ? !!person :
    tab === 'Activity' ? !!(stu || person) :
    !!it

  // Items table
  const val = (i, k) =>
    k === 'verifiedBy'
      ? (i.verifiedBy ? nameOf(i.verifiedBy) : '')
      : k === 'id' ? i.tag
      : (i[k] || '')

  const itemRows = items
    .filter(i =>
      has(i) &&
      (st === 'All' || i.status === st) &&
      matchesDate(i.date)
    )
    .sort((a, b) =>
      String(val(a, sort.key)).localeCompare(
        String(val(b, sort.key)),
        undefined,
        { numeric: true }
      ) * (sort.dir === 'asc' ? 1 : -1)
    )

  const cols = it && tab === 'Items'
    ? ['id', 'name', 'status']
    : ['id', 'name', 'category', 'owner', 'studentId', 'hostel', 'location', 'date', 'status', 'verifiedBy']

  // Student filtering
  const filteredStudents = students.filter(s =>
    has(s) &&
    (!selectedDate ||
      mine(s.studentId).some(i => matchesDate(i.date)))
  )

  // Staff filtering
  const filteredStaff = staff.filter(s =>
    has(s) &&
    (!selectedDate ||
      doneBy(s.email).some(i =>
        matchesDate(i.verifiedOn)
      ))
  )

  // Student panel
  const studentPanel = stu && (
    <aside
      className="glass card sdetail noprint"
      aria-label={`Items registered by ${stu.name}`}
    >
      <div className="shead">
        <div>
          <h3>{stu.name}</h3>
          <p className="muted">{stu.studentId}{stu.hostel ? `, ${stu.hostel}` : ''}</p>
        </div>
        <button className="btn ghost sm" onClick={() => setSel(null)}>
          Close
        </button>
      </div>

      <div className="schips">
        {statusOrder.map(s => {
          const n = stuItems.filter(i => i.status === s).length
          return n > 0
            ? <span key={s} className={'badge ' + s}>
                {n} {s.toLowerCase()}
              </span>
            : null
        })}
      </div>

      <h4 className="shead2">Registered items ({stuItems.length})</h4>

      {stuItems.length === 0 ? (
        <div className="empty">
          <b>Nothing registered yet</b>
          Items this student registers will show up here.
        </div>
      ) : stuItems.map(i => (
        <div key={i.id} className={'icard s-' + i.status}>
          <div className="itop">
            <b>{i.name}</b>
            <span className={'badge ' + i.status}>{i.status}</span>
          </div>
          <p>{i.description}</p>
          <small className="muted">
            Tag {i.tag}, {i.category}, registered {i.date}{i.location ? `, ${i.location}` : ''}
            {i.verifiedBy && `. Verified by ${nameOf(i.verifiedBy)}`}
          </small>
        </div>
      ))}
    </aside>
  )

  // Staff panel
  const staffPanel = person && (
    <aside
      className="glass card sdetail noprint"
      aria-label={`Items verified by ${person.name}`}
    >
      <div className="shead">
        <div>
          <h3>{person.name}</h3>
          <p className="muted">
            {person.email}
            {person.shift !== '-' && `, ${person.shift} shift`}
          </p>
        </div>
        <button className="btn ghost sm" onClick={() => setSel(null)}>
          Close
        </button>
      </div>

      {person.role !== 'Operator' ? (
        <div className="empty">
          <b>Administrator</b>
          Administrators manage the system and do not verify items.
        </div>
      ) : (
        <>
          <div className="schips">
            <span className="badge Returned">
              {checked.length - rejected} approved
            </span>
            {rejected > 0 &&
              <span className="badge Rejected">
                {rejected} rejected
              </span>
            }
          </div>

          <h4 className="shead2">Items verified ({checked.length})</h4>

          {checked.length === 0 ? (
            <div className="empty">
              <b>Nothing verified yet</b>
              Items this operator approves or rejects will show up here.
            </div>
          ) : checked.map(i => (
            <div key={i.id} className={'icard s-' + i.status}>
              <div className="itop">
                <b>{i.name}</b>
                <span className={'badge ' + (i.status === 'Rejected' ? 'Rejected' : 'Returned')}>
                  {i.status === 'Rejected' ? 'Rejected' : 'Approved'}
                </span>
              </div>
              <p>{i.description}</p>
              <small className="muted">
                {i.owner}, {i.studentId}. Tag {i.tag}.
                Verified {i.verifiedOn}. Now: {i.status.toLowerCase()}
              </small>
            </div>
          ))}
        </>
      )}
    </aside>
  )

  return (
    <>
      <div className="subnav glass noprint">
        <div className="subtabs" role="tablist">
          {tabs.map(([t, n]) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={'subtab' + (tab === t ? ' on' : '')}
              onClick={() => {
                setTab(t)
                setQ('')
                setSel(null)
                setSelectedDate('')
              }}
            >
              {t}<span>{n}</span>
            </button>
          ))}
        </div>

        <div className="subtools">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={`Search ${tab.toLowerCase()}`}
            aria-label="Search"
          />

          <div className="date-filter-wrap">
            <CalendarDays size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              aria-label="Filter by date"
              title="Filter records by date"
              className="date-filter"
            />

            {selectedDate && (
              <button
                className="clear-date"
                onClick={() => setSelectedDate('')}
                title="Clear date filter"
                aria-label="Clear date filter"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button className="btn ghost" onClick={() => window.print()}>
            Print table
          </button>
        </div>
      </div>

      {/* Students */}
      {tab === 'Students' && (
        <div className={'sgrid' + (open ? ' open' : '')}>
          <div className="glass card">
            <div className="onlyprint">
              <h1>Luggage Room: Students</h1>
              <p className="muted">{now}</p>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="empty">
                <b>No students found</b>
                Try a different search or date.
              </div>
            ) : (
              <div className="tw">
                <table className="pick">
                  <thead>
                    <tr>
                      {stu
                        ? <><th>Name</th><th>Student ID</th><th>Items</th></>
                        : <><th>Student ID</th><th>Name</th><th>Hostel</th><th>Items</th></>
                      }
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStudents.map(s => {
                      const nameCell = (
                        <td>
                          <button
                            className="namebtn"
                            onClick={e => {
                              e.stopPropagation()
                              pick(s.studentId)
                            }}
                          >
                            {s.name}
                          </button>
                        </td>
                      )

                      const n = mine(s.studentId).length

                      return (
                        <tr
                          key={s.studentId}
                          className={sel === s.studentId ? 'sel' : ''}
                          onClick={() => pick(s.studentId)}
                        >
                          {stu
                            ? <>{nameCell}<td>{s.studentId}</td><td>{n}</td></>
                            : <><td>{s.studentId}</td>{nameCell}<td>{s.hostel || '-'}</td><td>{n}</td></>
                          }
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {studentPanel}
        </div>
      )}

      {/* Items */}
      {tab === 'Items' && (
        <>
          <div className="fchips noprint" role="group" aria-label="Filter by status">
            {['All', ...statusOrder].map(s => {
              const n = s === 'All'
                ? items.length
                : items.filter(i => i.status === s).length

              return (
                <button
                  key={s}
                  className={'fchip' + (st === s ? ' on' : '') + (s !== 'All' ? ' f-' + s : '')}
                  aria-pressed={st === s}
                  onClick={() => setSt(s)}
                >
                  {s}<span>{n}</span>
                </button>
              )
            })}
          </div>

          <div className={'sgrid' + (open ? ' open' : '')}>
            <div className="glass card">
              <div className="onlyprint">
                <h1>Luggage Room: Items</h1>
                <p className="muted">{now}</p>
              </div>

              <div className="tw">
                <table className="pick">
                  <thead>
                    <tr>
                      {cols.map(c => (
                        <th
                          key={c}
                          aria-sort={sort.key === c ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          <button
                            className={'sorth' + (sort.key === c ? ' on ' + sort.dir : '')}
                            onClick={() => sortBy(c)}
                          >
                            {heads[c]}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {itemRows.length === 0 ? (
                      <tr>
                        <td colSpan={cols.length} className="muted">
                          Nothing matches your search or date.
                        </td>
                      </tr>
                    ) : itemRows.map(r => (
                      <tr
                        key={r.id}
                        className={sel === r.id ? 'sel' : ''}
                        onClick={() => pick(r.id)}
                      >
                        {cols.map(c => (
                          <td key={c} className={c === 'id' ? 'nw' : ''}>
                            {c === 'status'
                              ? <span className={'badge ' + r[c]}>{r[c]}</span>
                              : c === 'verifiedBy'
                                ? (r.verifiedBy ? nameOf(r.verifiedBy) : '-')
                                : c === 'id' ? r.tag
                                : r[c] || '-'
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {it && (
              <aside className="glass card sdetail noprint" aria-label={`Details for ${it.name}`}>
                <div className="shead">
                  <div>
                    <h3>{it.name}</h3>
                    <p className="muted">Tag {it.tag}, {it.category}</p>
                  </div>
                  <button className="btn ghost sm" onClick={() => setSel(null)}>
                    Close
                  </button>
                </div>

                <div className="schips">
                  <span className={'badge ' + it.status}>{it.status}</span>
                </div>

                {it.photo && <img src={it.photo} alt={`Photo of ${it.name}`} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, marginTop: 14 }} />}
                <p style={{ margin: '14px 0 0' }}>{it.description}</p>

                <dl className="facts" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div><dt>Owner</dt><dd>{it.owner}</dd></div>
                  <div><dt>Student ID</dt><dd>{it.studentId}</dd></div>
                  {it.hostel && <div><dt>Hostel</dt><dd>{it.hostel}</dd></div>}
                  {it.location && <div><dt>Shelf</dt><dd>{it.location}</dd></div>}
                  {it.semester && <div><dt>Semester</dt><dd>{it.semester}</dd></div>}
                </dl>

                <h4 className="shead2">What happened</h4>

                <ol className="tl">
                  <li className="done">
                    <b>Registered by student</b>
                    <small>{it.date}</small>
                  </li>

                  {it.status === 'Pending' && (
                    <li className="wait">
                      <b>Waiting for an operator</b>
                      <small>Not checked yet</small>
                    </li>
                  )}

                  {it.status !== 'Pending' && (
                    <li className={it.status === 'Rejected' ? 'bad' : 'done'}>
                      <b>{it.status === 'Rejected' ? `Rejected${it.rejectReason ? `: ${it.rejectReason}` : ''}` : 'Verified and stored'}</b>
                      <small>
                        {it.verifiedBy ? `${nameOf(it.verifiedBy)}, ` : ''}
                        {it.verifiedOn || 'date not recorded'}
                      </small>
                    </li>
                  )}

                  {it.status === 'Returned' && (
                    <li className="done">
                      <b>Handed back to {it.owner}</b>
                      <small>{it.returnedOn || 'date not recorded'}</small>
                    </li>
                  )}

                  {it.status === 'Stored' && (
                    <li className="wait">
                      <b>Waiting for the owner</b>
                      <small>In the luggage room</small>
                    </li>
                  )}
                </ol>
              </aside>
            )}
          </div>
        </>
      )}

      {/* Activity */}
      {tab === 'Activity' && (
        <div className={'sgrid' + (open ? ' open' : '')}>
          <div className="glass card">
            <div className="onlyprint">
              <h1>Luggage Room: Activity</h1>
              <p className="muted">{now}</p>
            </div>

            {events.length === 0 ? (
              <div className="empty">
                <b>No activity found</b>
                Try a different search or date.
              </div>
            ) : (
              <>
                <div className="actbar noprint">
                  <span className="muted">
                    {events.length} events across {days.length} day{days.length === 1 ? '' : 's'}. Click a name to see their items.
                  </span>

                  <button
                    className="btn ghost sm"
                    onClick={() => setAllDays(!allDaysOpen)}
                  >
                    {allDaysOpen ? 'Collapse all' : 'Expand all'}
                  </button>
                </div>

                <div className="accs flush">
                  {days.map(d => {
                    const list = events.filter(e => e.date === d)

                    return (
                      <Day
                        key={d}
                        id={d}
                        title={fmtDay(d)}
                        meta={`${list.length} event${list.length === 1 ? '' : 's'}`}
                        open={isOpen(d)}
                        toggle={toggleDay}
                      >
                        <ul className="feed">
                          {list.map((e, k) => (
                            <li
                              key={e.tag + e.kind + k}
                              className={'ev ev-' + e.kind + (evSel(e) ? ' ev-sel' : '')}
                            >
                              <span>
                                <button className="namebtn" onClick={() => pick(e.who.key)}>
                                  {e.who.name}
                                </button>{' '}
                                {e.verb} <b className="itm">{e.item}</b>

                                {e.from && (
                                  <>
                                    {' '}from{' '}
                                    <button className="namebtn" onClick={() => pick(e.from.key)}>
                                      {e.from.name}
                                    </button>
                                  </>
                                )}
                              </span>

                              <small className="muted">{e.tag}</small>
                            </li>
                          ))}
                        </ul>
                      </Day>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {studentPanel}
          {staffPanel}
        </div>
      )}

      {/* Staff */}
      {tab === 'Staff' && (
        <div className={'sgrid' + (open ? ' open' : '')}>
          <div className="glass card">
            <div className="onlyprint">
              <h1>Luggage Room: Staff</h1>
              <p className="muted">{now}</p>
            </div>

            {filteredStaff.length === 0 ? (
              <div className="empty">
                <b>No staff found</b>
                Try a different search or date.
              </div>
            ) : (
              <div className="tw">
                <table className="pick">
                  <thead>
                    <tr>
                      {person
                        ? <><th>Name</th><th>Role</th><th>Verified</th></>
                        : <><th>Name</th><th>Email</th><th>Role</th><th>Shift</th><th>Verified</th></>
                      }
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStaff.map(s => {
                      const nameCell = (
                        <td>
                          <button
                            className="namebtn"
                            onClick={e => {
                              e.stopPropagation()
                              pick(s.email)
                            }}
                          >
                            {s.name}
                          </button>
                        </td>
                      )

                      const n = s.role === 'Operator'
                        ? doneBy(s.email).length
                        : '-'

                      return (
                        <tr
                          key={s.email}
                          className={sel === s.email ? 'sel' : ''}
                          onClick={() => pick(s.email)}
                        >
                          {person
                            ? <>{nameCell}<td>{s.role}</td><td>{n}</td></>
                            : <>{nameCell}<td>{s.email}</td><td>{s.role}</td><td>{s.shift}</td><td>{n}</td></>
                          }
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {staffPanel}
        </div>
      )}
    </>
  )
}