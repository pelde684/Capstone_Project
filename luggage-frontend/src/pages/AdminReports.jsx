import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, apiAll } from '../api'
import { shortCode } from '../adapt'

// Admin report (meeting 9): filters for date range, semester, hostel, student, item status,
// storage location and operator; items grouped by semester and hostel; operator activity.
// All filtering is done by the backend (GET /items and GET /transactions).

const STATUSES = [
  ['REGISTERED', 'Registered, not handed in', 'Pending'],
  ['DEPOSITED', 'Deposited', 'Pending'],
  ['STORED', 'Stored', 'Stored'],
  ['READY_FOR_COLLECTION', 'Ready for collection', 'Stored'],
  ['COLLECTED', 'Collected', 'Returned'],
  ['CANCELLED', 'Cancelled', 'Rejected'],
]
const statusName = Object.fromEntries(STATUSES.map(([k, n]) => [k, n]))
const statusBadge = Object.fromEntries(STATUSES.map(([k, , b]) => [k, b]))

const ACTIONS = {
  DEPOSIT: 'Deposited',
  STORAGE_VERIFICATION: 'Verified and stored',
  COLLECTION_REQUEST: 'Marked ready',
  COLLECTION: 'Handed back',
  REJECTION: 'Rejected',
  CANCELLATION: 'Cancelled',
}
// Columns of the per-group tables (semester, hostel, shelf, category)
const GROUP_COLS = [
  ['Waiting', (s) => s === 'REGISTERED'],
  ['Deposited', (s) => s === 'DEPOSITED'],
  ['In storage', (s) => s === 'STORED' || s === 'READY_FOR_COLLECTION'],
  ['Collected', (s) => s === 'COLLECTED'],
]

const day = (d) => d.toLocaleDateString('en-CA') // 2026-10-27 in local time
const niceDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const niceTime = (s) => new Date(s).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
const shortDay = (s) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const PERIODS = ['All time', 'Today', 'Last 7 days', 'This month', 'Custom range']
function periodRange(period, from, to) {
  const now = new Date()
  if (period === 'Today') return [day(now), day(now)]
  if (period === 'Last 7 days') return [day(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)), day(now)]
  if (period === 'This month') return [day(new Date(now.getFullYear(), now.getMonth(), 1)), day(now)]
  if (period === 'Custom range') return [from, to]
  return ['', '']
}

const qs = (o) => Object.entries(o).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')

// Count items per group (semester, hostel ...) and status column
function groupBy(items, keyOf) {
  const rows = {}
  for (const i of items) {
    const k = keyOf(i) || 'Not set'
    rows[k] ||= { name: k, cols: GROUP_COLS.map(() => 0), total: 0 }
    GROUP_COLS.forEach(([, test], n) => { if (test(i.status)) rows[k].cols[n]++ })
    rows[k].total++
  }
  return Object.values(rows).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
}

// Download what is on screen as a spreadsheet-friendly CSV file
function downloadCsv(name, header, rows) {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const text = [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv' }))
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

function GroupTable({ title, rows }) {
  if (!rows.length) return null
  const sum = GROUP_COLS.map((_, n) => rows.reduce((t, r) => t + r.cols[n], 0))
  return (<>
    <h3>{title}</h3>
    <div className="tw"><table>
      <thead><tr><th>{title.replace('Items by ', '')}</th>{GROUP_COLS.map(([h]) => <th key={h} className="num">{h}</th>)}<th className="num">Total</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.name}><td>{r.name}</td>{r.cols.map((n, k) => <td key={k} className="num">{n}</td>)}<td className="num"><b>{r.total}</b></td></tr>
      ))}</tbody>
      {rows.length > 1 && <tfoot><tr><td>Total</td>{sum.map((n, k) => <td key={k} className="num">{n}</td>)}<td className="num">{sum.reduce((a, b) => a + b, 0)}</td></tr></tfoot>}
    </table></div>
  </>)
}

export default function AdminReports({ staff = [], locations = [], user }) {
  // ---- filters ----
  const [period, setPeriod] = useState('All time')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [hostelId, setHostelId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('') // student name, student ID or item name
  const [q, setQ] = useState('')
  const [operatorId, setOperatorId] = useState('')
  const [tab, setTab] = useState('Summary')

  // ---- data ----
  const [semesters, setSemesters] = useState([])
  const [hostels, setHostels] = useState([])
  const [items, setItems] = useState([])
  const [txs, setTxs] = useState([])
  const [shiftReports, setShiftReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const operators = staff.filter((s) => s.role === 'Operator')
  const [rangeFrom, rangeTo] = periodRange(period, from, to)

  useEffect(() => {
    Promise.all([api('/semesters'), api('/hostels')])
      .then(([s, h]) => { setSemesters(s.data); setHostels(h.data) })
      .catch(() => { /* the dropdowns just stay empty */ })
  }, [])

  // Wait until typing stops before searching
  useEffect(() => { const t = setTimeout(() => setQ(search.trim()), 400); return () => clearTimeout(t) }, [search])

  useEffect(() => {
    let stale = false
    setLoading(true)
    const shared = { from: rangeFrom, to: rangeTo, semesterId, hostelId, locationId }
    Promise.all([
      apiAll(`/items?${qs({ ...shared, status, q })}`),
      apiAll(`/transactions?${qs({ ...shared, operatorId })}`),
    ]).then(([its, ts]) => {
      if (stale) return
      setItems(its)
      setTxs(ts)
      setErr('')
    }).catch((e) => { if (!stale) setErr(e.message) })
      .finally(() => { if (!stale) setLoading(false) })
    return () => { stale = true }
  }, [rangeFrom, rangeTo, semesterId, hostelId, locationId, status, q, operatorId])

  // Submitted shift reports for the same period and operator
  useEffect(() => {
    let stale = false
    apiAll(`/shift-reports?${qs({ from: rangeFrom, to: rangeTo, operatorId })}`)
      .then((r) => { if (!stale) setShiftReports(r) })
      .catch(() => { if (!stale) setShiftReports([]) })
    return () => { stale = true }
  }, [rangeFrom, rangeTo, operatorId])

  // Cancelled registrations are left out unless asked for. With an operator chosen,
  // only items that operator worked on are shown (and only their activity).
  const shownItems = useMemo(() => {
    let list = status ? items : items.filter((i) => i.status !== 'CANCELLED')
    if (operatorId) {
      const touched = new Set(txs.map((t) => t.itemId))
      list = list.filter((i) => touched.has(i.id))
    }
    return list
  }, [items, txs, status, operatorId])
  const shownTxs = useMemo(() => {
    if (!q) return txs
    const needle = q.toLowerCase()
    return txs.filter((t) => `${t.ownerName} ${t.ownerStudentId} ${t.itemName}`.toLowerCase().includes(needle))
  }, [txs, q])

  // ---- numbers ----
  const n = (test) => shownItems.filter((i) => test(i.status)).length
  const inStorage = n((s) => s === 'STORED' || s === 'READY_FOR_COLLECTION')
  const collected = n((s) => s === 'COLLECTED')
  const handled = inStorage + collected
  const rate = handled ? Math.round((collected / handled) * 100) : 0
  const studentCount = new Set(shownItems.map((i) => i.ownerId)).size

  const opRows = useMemo(() => {
    const rows = {}
    for (const t of shownTxs) {
      rows[t.operatorId] ||= { name: t.operatorName, counts: {}, total: 0, last: t.transactionTime }
      const r = rows[t.operatorId]
      r.counts[t.action] = (r.counts[t.action] || 0) + 1
      r.total++
      if (t.transactionTime > r.last) r.last = t.transactionTime
    }
    return Object.values(rows).sort((a, b) => b.total - a.total)
  }, [shownTxs])

  // ---- what the filters say, for the printed header ----
  const nameOf = (list, id, key = 'name') => list.find((x) => String(x.id) === String(id))?.[key]
  const periodText = !rangeFrom && !rangeTo ? 'All time'
    : rangeFrom && rangeTo ? (rangeFrom === rangeTo ? niceDate(rangeFrom) : `${niceDate(rangeFrom)} to ${niceDate(rangeTo)}`)
    : rangeFrom ? `From ${niceDate(rangeFrom)}` : `Up to ${niceDate(rangeTo)}`
  const applied = [
    ['Period', periodText],
    semesterId && ['Semester', nameOf(semesters, semesterId)],
    hostelId && ['Hostel', nameOf(hostels, hostelId)],
    locationId && ['Shelf', nameOf(locations, locationId, 'location')],
    status && ['Status', statusName[status]],
    q && ['Search', `“${q}”`],
    operatorId && ['Operator', operators.find((o) => String(o.userId) === String(operatorId))?.name],
  ].filter(Boolean)
  const anyFilter = applied.length > 1 || period !== 'All time'
  const clearAll = () => { setPeriod('All time'); setFrom(''); setTo(''); setSemesterId(''); setHostelId(''); setLocationId(''); setStatus(''); setSearch(''); setOperatorId('') }

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const fileDay = day(new Date())

  const itemCsv = () => downloadCsv(`luggage-items-${fileDay}.csv`,
    ['Tag', 'Item', 'Category', 'Student', 'Student ID', 'Hostel', 'Shelf', 'Semester', 'Registered', 'Status'],
    shownItems.map((i) => [shortCode(i.qrValue), i.name, i.categoryName, i.ownerName, i.ownerStudentId, i.ownerHostel, i.locationName, i.semesterName, day(new Date(i.registeredAt)), statusName[i.status]]))
  const txCsv = () => downloadCsv(`operator-activity-${fileDay}.csv`,
    ['Date and time', 'Operator', 'Action', 'Item', 'Student', 'Student ID', 'Hostel', 'Shelf', 'Remarks'],
    shownTxs.map((t) => [niceTime(t.transactionTime), t.operatorName, ACTIONS[t.action] || t.action, t.itemName, t.ownerName, t.ownerStudentId, t.ownerHostel, t.locationName, t.remarks]))

  const tabs = [['Summary', shownItems.length], ['Items', shownItems.length], ['Operator activity', shownTxs.length], ['Shift reports', shiftReports.length]]

  return (<>
    <div className="rhead">
      <Link to="/admin" className="back">Back to dashboard</Link>
      <div className="row">
        {tab === 'Items' && <button className="btn ghost" onClick={itemCsv} disabled={!shownItems.length}>Download CSV</button>}
        {tab === 'Operator activity' && <button className="btn ghost" onClick={txCsv} disabled={!shownTxs.length}>Download CSV</button>}
        <button className="btn" onClick={() => window.print()}>Print {tab === 'Summary' ? 'report' : tab.toLowerCase()}</button>
      </div>
    </div>

    {/* ---- filters ---- */}
    <div className="glass card rfilters noprint">
      <div className="rgrid">
        <label>Time period
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>{PERIODS.map((p) => <option key={p}>{p}</option>)}</select>
        </label>
        {period === 'Custom range' && <>
          <label>From<input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} /></label>
          <label>To<input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} /></label>
        </>}
        <label>Semester
          <select value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
            <option value="">All semesters</option>
            {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? ' (current)' : ''}</option>)}
          </select>
        </label>
        <label>Hostel
          <select value={hostelId} onChange={(e) => setHostelId(e.target.value)}>
            <option value="">All hostels</option>
            {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </label>
        <label>Item status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All (except cancelled)</option>
            {STATUSES.map(([k, name]) => <option key={k} value={k}>{name}</option>)}
          </select>
        </label>
        <label>Storage shelf
          <select value={locationId} onChange={(e) => setLocationId(e.target.value)}>
            <option value="">All shelves</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.location}</option>)}
          </select>
        </label>
        <label>Operator
          <select value={operatorId} onChange={(e) => setOperatorId(e.target.value)}>
            <option value="">All operators</option>
            {operators.map((o) => <option key={o.userId} value={o.userId}>{o.name}</option>)}
          </select>
        </label>
        <label className="wide">Student name, student ID or item
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. 02250123 or Pema" />
        </label>
      </div>
      <div className="rfoot">
        <span className="muted">{loading ? 'Updating…' : `${shownItems.length} item${shownItems.length === 1 ? '' : 's'}, ${shownTxs.length} operator action${shownTxs.length === 1 ? '' : 's'}`}</span>
        {anyFilter && <button className="btn ghost sm" onClick={clearAll}>Clear filters</button>}
      </div>
    </div>

    {/* ---- tabs ---- */}
    <div className="rtabs noprint" role="tablist">
      {tabs.map(([t, count]) => (
        <button key={t} role="tab" aria-selected={tab === t} className={'subtab' + (tab === t ? ' on' : '')} onClick={() => setTab(t)}>
          {t}<span>{count}</span>
        </button>
      ))}
    </div>

    {err && <div className="glass card noprint" role="alert" style={{ color: 'var(--red)', maxWidth: 960, margin: '0 auto 16px' }}>Could not load the report: {err}</div>}

    {/* ---- the report itself: a plain "paper" page that prints cleanly ---- */}
    <article className="paper report" aria-busy={loading}>
      <header>
        <h1>CST Luggage Room · {{ Summary: 'Luggage Report', Items: 'Item List', 'Operator activity': 'Operator Activity', 'Shift reports': 'Submitted Shift Reports' }[tab]}</h1>
        <dl className="rapplied">
          {applied.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          <div><dt>Report date</dt><dd>{today}</dd></div>
        </dl>
      </header>

      {tab === 'Summary' && (<>
        <div className="rsum">
          <div><small>Students with items</small><b>{studentCount}</b></div>
          <div><small>Items</small><b>{shownItems.length}</b></div>
          <div><small>In storage now</small><b>{inStorage}</b></div>
          <div><small>Collected</small><b>{collected}</b></div>
        </div>
        <p className="rnote">
          {n((s) => s === 'REGISTERED')} registered but not handed in, {n((s) => s === 'DEPOSITED')} deposited and waiting for a check.
          Handover rate: <b>{rate}%</b> of verified items have been collected.
        </p>

        {shownItems.length === 0 ? (
          <div className="rempty"><b>No items match these filters.</b> Try a longer period or clear some filters.</div>
        ) : (<>
          <GroupTable title="Items by semester" rows={groupBy(shownItems, (i) => i.semesterName)} />
          <GroupTable title="Items by hostel" rows={groupBy(shownItems, (i) => i.ownerHostel)} />
          <GroupTable title="Items by storage shelf" rows={groupBy(shownItems.filter((i) => i.locationName), (i) => i.locationName)} />
          <GroupTable title="Items by category" rows={groupBy(shownItems, (i) => i.categoryName)} />
        </>)}

        {opRows.length > 0 && (<>
          <h3>Operator activity</h3>
          <div className="tw"><table>
            <thead><tr><th>Operator</th><th className="num">Deposited</th><th className="num">Stored</th><th className="num">Handed back</th><th className="num">Rejected</th><th className="num">Total actions</th></tr></thead>
            <tbody>{opRows.map((r) => (
              <tr key={r.name}><td>{r.name}</td><td className="num">{r.counts.DEPOSIT || 0}</td><td className="num">{r.counts.STORAGE_VERIFICATION || 0}</td><td className="num">{r.counts.COLLECTION || 0}</td><td className="num">{r.counts.REJECTION || 0}</td><td className="num"><b>{r.total}</b></td></tr>
            ))}</tbody>
          </table></div>
        </>)}
      </>)}

      {tab === 'Items' && (shownItems.length === 0
        ? <div className="rempty"><b>No items match these filters.</b></div>
        : <div className="tw"><table className="rtable">
          <thead><tr><th>Tag</th><th>Item</th><th>Student</th><th>Student ID</th><th>Hostel</th><th>Shelf</th><th>Semester</th><th>Registered</th><th>Status</th></tr></thead>
          <tbody>{shownItems.map((i) => (
            <tr key={i.id}>
              <td className="nw">{shortCode(i.qrValue) || `#${i.dropOffId}`}</td>
              <td>{i.name}<small className="rsub">{i.categoryName}</small></td>
              <td>{i.ownerName}</td><td className="nw">{i.ownerStudentId}</td>
              <td>{i.ownerHostel || '-'}</td><td>{i.locationName || '-'}</td><td>{i.semesterName || '-'}</td>
              <td className="nw">{shortDay(i.registeredAt)}</td>
              <td><span className={'badge ' + statusBadge[i.status]}>{statusName[i.status]}</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}

      {tab === 'Operator activity' && (shownTxs.length === 0
        ? <div className="rempty"><b>No operator activity matches these filters.</b></div>
        : (<>
          <div className="tw"><table>
            <thead><tr><th>Operator</th><th className="num">Deposited</th><th className="num">Stored</th><th className="num">Marked ready</th><th className="num">Handed back</th><th className="num">Rejected</th><th className="num">Total</th><th>Last active</th></tr></thead>
            <tbody>{opRows.map((r) => (
              <tr key={r.name}><td>{r.name}</td>
                {['DEPOSIT', 'STORAGE_VERIFICATION', 'COLLECTION_REQUEST', 'COLLECTION', 'REJECTION'].map((a) => <td key={a} className="num">{r.counts[a] || 0}</td>)}
                <td className="num"><b>{r.total}</b></td><td className="nw">{niceTime(r.last)}</td></tr>
            ))}</tbody>
          </table></div>
          <h3>Every action ({shownTxs.length})</h3>
          <div className="tw"><table className="rtable">
            <thead><tr><th>Date and time</th><th>Operator</th><th>Action</th><th>Item</th><th>Student</th><th>Hostel</th><th>Shelf</th><th>Remarks</th></tr></thead>
            <tbody>{shownTxs.map((t) => (
              <tr key={t.id}>
                <td className="nw">{niceTime(t.transactionTime)}</td><td>{t.operatorName}</td>
                <td><span className={'badge ' + (t.action === 'REJECTION' || t.action === 'CANCELLATION' ? 'Rejected' : t.action === 'COLLECTION' ? 'Returned' : t.action === 'DEPOSIT' ? 'Pending' : 'Stored')}>{ACTIONS[t.action] || t.action}</span></td>
                <td>{t.itemName}</td><td>{t.ownerName}<small className="rsub">{t.ownerStudentId}</small></td>
                <td>{t.ownerHostel || '-'}</td><td>{t.locationName || '-'}</td><td>{t.remarks || ''}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </>)
      )}

      {tab === 'Shift reports' && (shiftReports.length === 0
        ? <div className="rempty"><b>No shift reports submitted for this period.</b> Operators submit them from their Report page.</div>
        : shiftReports.map((r) => (
          <section key={r.id} className="shiftcard">
            <div className="shifthead">
              <div><b>{r.operatorName}</b><small className="rsub">{new Date(r.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} · {r.shiftLabel}</small></div>
              <small className="muted">Submitted {niceTime(r.updatedAt || r.submittedAt)}</small>
            </div>
            <div className="shiftnums">
              <span>Deposited <b>{r.deposited}</b></span>
              <span>Stored <b>{r.stored}</b></span>
              <span>Handed back <b>{r.handedBack}</b></span>
              <span>Rejected <b>{r.rejected}</b></span>
              <span>In storage at the end <b>{r.itemsInStorage}</b></span>
            </div>
            <p className={r.notes ? '' : 'muted'} style={{ whiteSpace: 'pre-wrap', margin: '10px 0 0' }}>{r.notes || 'No notes.'}</p>
          </section>
        ))
      )}

      <div className="sign"><div>Prepared by {user?.name ? `${user.name} (Administrator)` : '(Administrator)'}</div><div>Signature and date</div></div>
    </article>
  </>)
}
