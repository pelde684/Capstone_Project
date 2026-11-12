
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiAll } from '../api'

// Shift report: what one operator did during one shift,
// and what is in the room at the end.

const SHIFTS = [
  ['Whole day', 0, 24, 'WHOLE_DAY'],
  ['Morning shift (before 1 pm)', 0, 13, 'MORNING'],
  ['Afternoon shift (from 1 pm)', 13, 24, 'AFTERNOON'],
]

const ACTIONS = {
  REGISTERED: ['Registered', 'Pending'],
  DEPOSIT: ['Deposited', 'Pending'],
  STORAGE_VERIFICATION: ['Verified and stored', 'Stored'],
  COLLECTION_REQUEST: ['Marked ready', 'Stored'],
  COLLECTION: ['Handed back', 'Returned'],
  REJECTION: ['Rejected', 'Rejected'],
  CANCELLATION: ['Cancelled', 'Rejected'],
}

const today = () => new Date().toLocaleDateString('en-CA')

const time = (s) =>
  new Date(s).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

const stamp = (s) =>
  new Date(s).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

const longDate = (s) =>
  new Date(s + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

// Save unsubmitted notes in this browser
const notesKey = (date, op) => `shift-notes-${date}-${op}`

function readNotes(key) {
  try {
    return localStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

function writeNotes(key, v) {
  try {
    localStorage.setItem(key, v)
  } catch {
    // Notes can still be printed
  }
}

export default function OperatorReport({
  items = [],
  locations = [],
  user,
}) {
  const [date, setDate] = useState(today())
  const [shift, setShift] = useState(0)
  const [operatorId, setOperatorId] = useState(String(user?.id ?? ''))

  const [txs, setTxs] = useState([])
  const [operators, setOperators] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    let stale = false

    setLoading(true)

    apiAll(`/transactions?from=${date}&to=${date}`)
      .then((all) => {
        if (stale) return

        setTxs(all)

        const seen = new Map(
          all.map((t) => [String(t.operatorId), t.operatorName])
        )

        if (user && !seen.has(String(user.id))) {
          seen.set(String(user.id), user.name)
        }

        setOperators(
          [...seen].map(([id, name]) => ({ id, name }))
        )

        setErr('')
      })
      .catch((e) => {
        if (!stale) setErr(e.message)
      })
      .finally(() => {
        if (!stale) setLoading(false)
      })

    return () => {
      stale = true
    }
  }, [date, user])

  const [, fromHour, toHour] = SHIFTS[shift]

  // Filter operator transactions by shift
  const rows = useMemo(
    () =>
      txs
        .filter(
          (t) =>
            !operatorId ||
            String(t.operatorId) === operatorId
        )
        .filter((t) => {
          const h = new Date(t.transactionTime).getHours()
          return h >= fromHour && h < toHour
        })
        .sort(
          (a, b) =>
            a.transactionTime.localeCompare(b.transactionTime) ||
            a.id - b.id
        ),
    [txs, operatorId, fromHour, toHour]
  )

  // Student online registrations during the selected shift
  const registered = useMemo(
    () =>
      items
        .filter(
          (i) =>
            i.registeredAt &&
            new Date(i.registeredAt).toLocaleDateString('en-CA') === date
        )
        .filter((i) => {
          const h = new Date(i.registeredAt).getHours()
          return h >= fromHour && h < toHour
        })
        .map((i) => ({
          id: `reg-${i.itemId ?? i.id}`,
          dropOffId: i.dropOffId,
          action: 'REGISTERED',
          transactionTime: i.registeredAt,
          itemName: i.name,
          ownerName: i.owner,
          ownerHostel: i.hostel,
          ownerStudentId: i.studentId,
          locationName: null,
          operatorName: 'Student (online)',
          remarks: '',
        })),
    [items, date, fromHour, toHour]
  )

  const activity = [...registered, ...rows].sort(
    (a, b) =>
      a.transactionTime.localeCompare(b.transactionTime)
  )

  const count = (action) =>
    rows.filter((t) => t.action === action).length

  // GRAPH DATA
  const chartData = [
    {
      label: 'Registered',
      value: registered.length,
      color: '#64748b',
    },
    {
      label: 'Deposited',
      value: count('DEPOSIT'),
      color: '#e5a23b',
    },
    {
      label: 'Verified & Stored',
      value: count('STORAGE_VERIFICATION'),
      color: '#16a085',
    },
    {
      label: 'Handed Back',
      value: count('COLLECTION'),
      color: '#2d7df6',
    },
    {
      label: 'Rejected',
      value: count('REJECTION'),
      color: '#e05252',
    },
  ]

  const maxChartValue = Math.max(
    ...chartData.map((item) => item.value),
    1
  )

  const totalActivities = chartData.reduce(
    (sum, item) => sum + item.value,
    0
  )

  // QR codes
  const tagByDrop = useMemo(
    () =>
      Object.fromEntries(
        items.map((i) => [i.dropOffId, i.tag])
      ),
    [items]
  )

  const qrOf = (t) =>
    tagByDrop[t.dropOffId] ||
    (t.dropOffId ? `#${t.dropOffId}` : '-')

  // Group activities by student drop-off
  const groups = useMemo(() => {
    const map = new Map()

    for (const t of activity) {
      const k = t.dropOffId ?? `item-${t.itemId ?? t.id}`

      if (!map.has(k)) {
        map.set(k, {
          key: k,
          first: t,
          items: new Set(),
          steps: new Map(),
          shelves: new Set(),
          ops: new Set(),
          remarks: new Set(),
        })
      }

      const g = map.get(k)

      g.items.add(t.itemName)

      const st = g.steps.get(t.action) || {
        n: 0,
        last: t.transactionTime,
      }

      st.n += 1
      st.last = t.transactionTime

      g.steps.set(t.action, st)

      if (t.locationName) g.shelves.add(t.locationName)

      if (t.action !== 'REGISTERED' && t.operatorName) {
        g.ops.add(t.operatorName)
      }

      if (t.remarks) g.remarks.add(t.remarks)
    }

    return [...map.values()]
  }, [activity])

  const [detail, setDetail] = useState(false)

  const students = new Set(
    activity
      .map((t) => t.ownerStudentId)
      .filter(Boolean)
  ).size

  // Current room storage
  const shelves = locations.map((l) => ({
    ...l,
    here: items.filter(
      (i) =>
        i.status === 'Stored' &&
        i.location === l.location
    ),
  }))

  const inRoom = items.filter(
    (i) => i.status === 'Stored'
  ).length

  const waiting = items.filter(
    (i) => i.status === 'Pending'
  ).length

  const shiftKey = SHIFTS[shift][3]

  const isMine =
    !!user && operatorId === String(user.id)

  const key = notesKey(
    date,
    `${operatorId || 'all'}-${shiftKey}`
  )

  const [notes, setNotes] = useState(() => readNotes(key))
  const [saved, setSaved] = useState(null)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')
  const [mine, setMine] = useState([])

  const loadMine = () => {
    if (!user) return

    api(`/shift-reports?operatorId=${user.id}&limit=30`)
      .then((r) => setMine(r.data))
      .catch(() => {})
  }

  useEffect(() => {
    loadMine()
  }, [user])

  const open = (r) => {
    setDate(r.date)

    setShift(
      Math.max(
        SHIFTS.findIndex((x) => x[3] === r.shift),
        0
      )
    )

    setOperatorId(String(r.operatorId))

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // Load submitted report
  useEffect(() => {
    let stale = false

    setSaved(null)
    setMsg('')
    setNotes(readNotes(key))

    if (!operatorId) return

    api(
      `/shift-reports?operatorId=${operatorId}&shift=${shiftKey}&from=${date}&to=${date}`
    )
      .then((r) => {
        if (stale) return

        const report = r.data[0] || null

        setSaved(report)

        if (report && !readNotes(key)) {
          setNotes(report.notes || '')
        }
      })
      .catch(() => {})

    return () => {
      stale = true
    }
  }, [key, operatorId, shiftKey, date])

  // Submit report
  const submit = async () => {
    setSending(true)
    setMsg('')

    try {
      const report = await api('/shift-reports', {
        method: 'POST',
        body: {
          date,
          shift: shiftKey,
          notes,
        },
      })

      setSaved(report)

      writeNotes(key, '')

      loadMine()

      setMsg(
        `Shift report ${saved ? 'updated' : 'submitted'}. The admin and other operators can now see it.`
      )
    } catch (e) {
      setMsg(`Could not submit: ${e.message}`)
    } finally {
      setSending(false)
    }
  }

  const opName =
    operators.find((o) => o.id === operatorId)?.name ||
    'All operators'

  const isToday = date === today()

  const submitLabel = sending
    ? 'Submitting…'
    : saved
      ? 'Update submitted report'
      : 'Submit shift report'

  return (
    <>
      <div className="rhead">
        <Link to="/operator" className="back">
          Back to dashboard
        </Link>

        <div className="row">
          <button
            className="btn ghost"
            onClick={() => window.print()}
            disabled={loading}
          >
            Print
          </button>

          {isMine && (
            <button
              className="btn"
              onClick={submit}
              disabled={loading || sending}
            >
              {submitLabel}
            </button>
          )}
        </div>
      </div>

      {/* REPORT FILTERS */}
      <div className="glass card rfilters noprint">
        <div className="rgrid">
          <label>
            Date
            <input
              type="date"
              value={date}
              max={today()}
              onChange={(e) =>
                e.target.value && setDate(e.target.value)
              }
            />
          </label>

          <label>
            Shift
            <select
              value={shift}
              onChange={(e) =>
                setShift(Number(e.target.value))
              }
            >
              {SHIFTS.map(([name], i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Operator
            <select
              value={operatorId}
              onChange={(e) =>
                setOperatorId(e.target.value)
              }
            >
              {operators.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                  {user && o.id === String(user.id)
                    ? ' (you)'
                    : ''}
                </option>
              ))}

              <option value="">All operators</option>
            </select>
          </label>
        </div>

        <div className="rfoot">
          <span className="muted">
            {loading
              ? 'Loading…'
              : `${activity.length} action${activity.length === 1 ? '' : 's'} in this shift`}
          </span>

          {msg && (
            <span
              role="status"
              style={{
                color: msg.startsWith('Could not')
                  ? 'var(--red)'
                  : 'var(--green)',
                fontWeight: 600,
              }}
            >
              {msg}
            </span>
          )}
        </div>
      </div>

      {err && (
        <div
          className="glass card noprint"
          role="alert"
          style={{
            color: 'var(--red)',
            maxWidth: 960,
            margin: '0 auto 16px',
          }}
        >
          Could not load the shift: {err}
        </div>
      )}

      {/* PREVIOUS REPORTS */}
      {mine.length > 0 && (
        <div className="glass card rfilters noprint">
          <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>
            My submitted reports
          </h3>

          <div className="chips">
            {mine.map((r) => {
              const on =
                r.date === date &&
                r.shift === shiftKey &&
                String(r.operatorId) === operatorId

              return (
                <button
                  key={r.id}
                  className={'chip' + (on ? ' on' : '')}
                  onClick={() => open(r)}
                  title={r.notes || 'No notes'}
                  aria-pressed={on}
                >
                  {new Date(
                    r.date + 'T00:00:00'
                  ).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}

                  {' · '}

                  {SHIFTS.find(
                    (x) => x[3] === r.shift
                  )?.[0]
                    .replace(' shift', '')
                    .replace(/ \(.*\)/, '') || r.shift}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* MAIN REPORT */}
      <article
        className="paper report"
        aria-busy={loading}
      >
        <header>
          <h1>CST Luggage Room · Shift Report</h1>

          <dl className="rapplied">
            <div>
              <dt>Date</dt>
              <dd>{longDate(date)}</dd>
            </div>

            <div>
              <dt>Shift</dt>
              <dd>{SHIFTS[shift][0]}</dd>
            </div>

            <div>
              <dt>Operator</dt>
              <dd>{opName}</dd>
            </div>

            <div>
              <dt>Status</dt>
              <dd
                style={{
                  color: saved
                    ? 'var(--green)'
                    : 'var(--muted)',
                }}
              >
                {saved
                  ? `Submitted ${stamp(
                      saved.updatedAt || saved.submittedAt
                    )}`
                  : operatorId
                    ? 'Not submitted yet'
                    : 'Pick one operator to see their submitted report'}
              </dd>
            </div>
          </dl>
        </header>

        {/* SUMMARY CARDS */}
        <div className="rsum five">
          <div>
            <small>Items registered</small>
            <b>{registered.length}</b>
          </div>

          <div>
            <small>Deposited</small>
            <b>{count('DEPOSIT')}</b>
          </div>

          <div>
            <small>Verified and stored</small>
            <b>{count('STORAGE_VERIFICATION')}</b>
          </div>

          <div>
            <small>Handed back</small>
            <b>{count('COLLECTION')}</b>
          </div>

          <div>
            <small>Rejected</small>
            <b>{count('REJECTION')}</b>
          </div>
        </div>

        {/* NEW ACTIVITY GRAPH */}
        <section
          style={{
            margin: '25px 0',
            padding: '22px',
            border: '1px solid var(--line)',
            borderRadius: '16px',
            background: 'var(--surface)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '25px',
            }}
          >
            <div>
              <h3 style={{ margin: '0 0 5px' }}>
                Shift Activity Overview
              </h3>

              <p
                style={{
                  margin: 0,
                  color: 'var(--muted)',
                  fontSize: '13px',
                }}
              >
                Summary of luggage activities during this shift
              </p>
            </div>

            <span
              style={{
                padding: '8px 13px',
                borderRadius: '20px',
                background: 'var(--soft)',
                color: 'var(--blue)',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              {totalActivities} activities
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {chartData.map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '13px',
                    gap: '10px',
                  }}
                >
                  <span>{item.label}</span>

                  <strong>{item.value}</strong>
                </div>

                <div
                  role="progressbar"
                  aria-label={item.label}
                  aria-valuenow={item.value}
                  aria-valuemin={0}
                  aria-valuemax={maxChartValue}
                  style={{
                    width: '100%',
                    height: '13px',
                    borderRadius: '20px',
                    background: 'var(--soft)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${
                        (item.value / maxChartValue) * 100
                      }%`,
                      height: '100%',
                      minWidth: item.value > 0 ? '5px' : 0,
                      borderRadius: '20px',
                      background: item.color,
                      transition: 'width 700ms ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {totalActivities === 0 && (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: '13px',
                margin: '20px 0 0',
              }}
            >
              No activities recorded for this shift yet.
            </p>
          )}
        </section>

        <p className="rnote">
          {activity.length} action
          {activity.length === 1 ? '' : 's'} for {students}{' '}
          student{students === 1 ? '' : 's'} during this shift.
        </p>

        {/* ACTIVITY TABLE */}
        <div
          className="row"
          style={{
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 12,
          }}
        >
          <h3>Activity during the shift</h3>

          {activity.length > 0 && (
            <button
              type="button"
              className="btn ghost sm noprint"
              onClick={() => setDetail((d) => !d)}
            >
              {detail
                ? 'Group by student'
                : 'Show each action'}
            </button>
          )}
        </div>

        {activity.length === 0 ? (
          <div className="rempty">
            <b>No activity in this shift.</b>{' '}
            Pick another date, shift or operator.
          </div>
        ) : !detail ? (
          <div className="tw">
            <table className="rtable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>QR</th>
                  <th>Items</th>
                  <th>What happened</th>
                  <th>Shelf</th>
                  {!operatorId && <th>Operator</th>}
                  <th>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {groups.map((g) => (
                  <tr key={g.key}>
                    <td>
                      {g.first.ownerName}
                      {g.first.ownerHostel && (
                        <small className="rsub">
                          {g.first.ownerHostel}
                        </small>
                      )}
                    </td>

                    <td className="nw">
                      {g.first.ownerStudentId}
                    </td>

                    <td className="nw">
                      {qrOf(g.first)}
                    </td>

                    <td>
                      {[...g.items].join(', ')}
                      <small className="rsub">
                        {g.items.size} item
                        {g.items.size === 1 ? '' : 's'}
                      </small>
                    </td>

                    <td>
                      {[...g.steps].map(([action, st]) => {
                        const [label, tone] =
                          ACTIONS[action] || [action, '']

                        return (
                          <div key={action} className="nw">
                            <span className={'badge ' + tone}>
                              {label}
                            </span>

                            <span
                              className="muted"
                              style={{ fontSize: 13 }}
                            >
                              {' '}
                              {st.n > 1
                                ? `×${st.n} · `
                                : ''}
                              {time(st.last)}
                            </span>
                          </div>
                        )
                      })}
                    </td>

                    <td>
                      {[...g.shelves].join(', ') || '-'}
                    </td>

                    {!operatorId && (
                      <td>
                        {[...g.ops].join(', ') || '-'}
                      </td>
                    )}

                    <td>
                      {[...g.remarks].join('; ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tw">
            <table className="rtable">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Item</th>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>QR</th>
                  <th>Shelf</th>
                  {!operatorId && <th>Operator</th>}
                  <th>Remarks</th>
                </tr>
              </thead>

              <tbody>
                {activity.map((t) => {
                  const [label, tone] =
                    ACTIONS[t.action] || [t.action, '']

                  return (
                    <tr key={t.id}>
                      <td className="nw">
                        {time(t.transactionTime)}
                      </td>

                      <td>
                        <span className={'badge ' + tone}>
                          {label}
                        </span>
                      </td>

                      <td>{t.itemName}</td>

                      <td>
                        {t.ownerName}
                        {t.ownerHostel && (
                          <small className="rsub">
                            {t.ownerHostel}
                          </small>
                        )}
                      </td>

                      <td className="nw">
                        {t.ownerStudentId}
                      </td>

                      <td className="nw">
                        {qrOf(t)}
                      </td>

                      <td>{t.locationName || '-'}</td>

                      {!operatorId && (
                        <td>{t.operatorName}</td>
                      )}

                      <td>{t.remarks || ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* CURRENT STORAGE */}
        <h3>
          In the room{' '}
          {isToday ? 'now' : 'at the time of printing'}
        </h3>

        <p
          className="rnote"
          style={{ marginTop: 0 }}
        >
          {inRoom} item{inRoom === 1 ? '' : 's'} in storage,{' '}
          {waiting} waiting for a check.
        </p>

        {shelves.length > 0 && (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Shelf</th>
                  <th className="num">Items stored</th>
                  <th className="num">Capacity</th>
                  <th className="num">Space left</th>
                </tr>
              </thead>

              <tbody>
                {shelves.map((l) => (
                  <tr key={l.id}>
                    <td>{l.location}</td>

                    <td className="num">
                      {l.here.length}
                    </td>

                    <td className="num">
                      {l.capacity ?? '-'}
                    </td>

                    <td className="num">
                      {l.capacity != null
                        ? Math.max(l.capacity - l.used, 0)
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* NEXT SHIFT NOTES */}
        <h3>Notes for the next shift</h3>

        {isMine ? (
          <>
            <textarea
              className="notes noprint"
              value={notes}
              maxLength={2000}
              onChange={(e) => {
                setNotes(e.target.value)
                writeNotes(key, e.target.value)
              }}
              placeholder="Anything unusual, e.g. Shelf B is almost full, a student came without their ID card…"
              rows={4}
            />

            <div
              className="row noprint"
              style={{
                justifyContent: 'flex-end',
                marginTop: 12,
              }}
            >
              <button
                className="btn"
                onClick={submit}
                disabled={loading || sending}
              >
                {submitLabel}
              </button>
            </div>

            <p
              className="onlyprint"
              style={{
                whiteSpace: 'pre-wrap',
                minHeight: 60,
              }}
            >
              {notes || ' '}
            </p>
          </>
        ) : (
          <p
            style={{
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}
            className={saved?.notes ? '' : 'muted'}
          >
            {!operatorId
              ? 'Pick one operator to see their notes.'
              : saved
                ? saved.notes || 'No notes were written.'
                : 'This operator has not submitted a report for this shift yet.'}
          </p>
        )}
      </article>
    </>
  )
}
