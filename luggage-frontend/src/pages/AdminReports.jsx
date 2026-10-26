import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { periods, inPeriod, periodLabel } from '../period'

const statusColor = { Pending: 'var(--amber)', Stored: '#6ea4ff', Returned: 'var(--green)', Rejected: 'var(--red)' }

function BarChart({ title, data, unit = 'items' }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <figure className="chartbox">
      <figcaption>{title}</figcaption>
      <div className="chart" role="img" aria-label={`${title}: ${data.map(d => `${d.label} ${d.value}`).join(', ')}`}>
        {data.map(d => {
          const pct = (d.value / max) * 86
          return (
            <div className="col" key={d.label} title={`${d.label}: ${d.value} ${unit}`}>
              <div className="plot">
                <b style={{ bottom: `calc(${pct}% + 6px)` }}>{d.value}</b>
                <i style={{ height: d.value ? `${pct}%` : '3px', background: d.color || 'var(--blue)' }} />
              </div>
              <span>{d.label}</span>
            </div>
          )
        })}
      </div>
    </figure>
  )
}

function Section({ id, title, meta, open, toggle, children }) {
  return (
    <section className={'acc' + (open ? ' open' : '')}>
      <button className="acc-head" aria-expanded={open} aria-controls={`acc-${id}`} onClick={() => toggle(id)}>
        <span>{title}{meta && <small className="meta">{meta}</small>}</span>
        <ChevronDown size={20} />
      </button>
      <div className="acc-body" id={`acc-${id}`}>
        <div className="acc-inner">{children}</div>
      </div>
    </section>
  )
}

export default function AdminReports({ items }) {
  const [period, setPeriod] = useState('This semester')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [open, setOpen] = useState({ charts: true, status: false, category: false, items: false })

  const toggle = (id) => setOpen(o => ({ ...o, [id]: !o[id] }))
  const setAll = (v) => setOpen({ charts: v, status: v, category: v, items: v })
  const allOpen = Object.values(open).every(Boolean)

  const list = items.filter(i => inPeriod(i.date, period, from, to))
  const count = (k, v) => list.filter(i => i[k] === v).length
  const statuses = ['Pending', 'Stored', 'Returned', 'Rejected']
  const cats = [...new Set(list.map(i => i.category))]
  const handled = count('status', 'Stored') + count('status', 'Returned')
  const rate = handled ? Math.round((count('status', 'Returned') / handled) * 100) : 0
  const studentsWithItems = new Set(list.map(i => i.studentId)).size
  const share = (n) => (list.length ? Math.round((n / list.length) * 100) : 0) + '%'

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const shortDate = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  const statusData = statuses.map(s => ({ label: s, value: count('status', s), color: statusColor[s] }))
  const days = [...new Set(list.map(i => i.date))].sort()
  const dayData = days.map(d => ({ label: shortDate(d), value: list.filter(i => i.date === d).length }))

  return (<>
    <div className="rhead">
      <Link to="/admin" className="back">Back to dashboard</Link>
      <button className="btn" onClick={() => window.print()}>Print report</button>
    </div>

    <div className="rfilter noprint">
      <label>Time period
        <select value={period} onChange={e => setPeriod(e.target.value)}>
          {periods.map(p => <option key={p}>{p}</option>)}
        </select>
      </label>
      {period === 'Custom range' && <>
        <label>From<input type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} /></label>
        <label>To<input type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} /></label>
      </>}
      <span className="muted">{list.length} of {items.length} items</span>
      <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => setAll(!allOpen)}>{allOpen ? 'Collapse all' : 'Expand all'}</button>
    </div>

    <article className="glass report">
      <header>
        <h1>Luggage Room Report</h1>
        <div className="rmeta muted">
          <span>CST Luggage Room. Period: {periodLabel(period, from, to)}</span>
          <span>Report date: {today}</span>
        </div>
      </header>

      <div className="rsum">
        <div><small>Students with items</small><b>{studentsWithItems}</b></div>
        <div><small>Total items</small><b>{list.length}</b></div>
        <div><small>Returned</small><b>{count('status', 'Returned')}</b></div>
        <div><small>Handover rate</small><b>{rate}%</b></div>
      </div>

      {list.length === 0 ? (
        <div className="empty"><b>No items in this period</b>Pick a longer period, or change the dates.</div>
      ) : (<div className="accs">
        <Section id="charts" title="Charts" meta={`${days.length} day${days.length === 1 ? '' : 's'} of activity`} open={open.charts} toggle={toggle}>
          <div className="charts">
            <BarChart title="Items by status" data={statusData} />
            <BarChart title="Registrations by date" data={dayData} />
          </div>
        </Section>

        <Section id="status" title="Items by status" meta={`${list.length} items`} open={open.status} toggle={toggle}>
          <table>
            <thead><tr><th>Status</th><th>Items</th><th>Share</th></tr></thead>
            <tbody>{statuses.map(s => <tr key={s}><td><span className={'badge ' + s}>{s}</span></td><td>{count('status', s)}</td><td>{share(count('status', s))}</td></tr>)}</tbody>
          </table>
        </Section>

        <Section id="category" title="Items by category" meta={`${cats.length} categor${cats.length === 1 ? 'y' : 'ies'}`} open={open.category} toggle={toggle}>
          <table>
            <thead><tr><th>Category</th><th>Items</th><th>Share</th></tr></thead>
            <tbody>{cats.map(k => <tr key={k}><td>{k}</td><td>{count('category', k)}</td><td>{share(count('category', k))}</td></tr>)}</tbody>
          </table>
        </Section>

        <Section id="items" title="All items" meta={`${list.length} items`} open={open.items} toggle={toggle}>
          <div className="tw"><table>
            <thead><tr><th>QR ID</th><th>Item</th><th>Owner</th><th>Student ID</th><th>Date</th><th>Status</th></tr></thead>
            <tbody>{list.map(i => <tr key={i.id}><td className="nw">{i.id}</td><td>{i.name}</td><td>{i.owner}</td><td>{i.studentId}</td><td>{i.date}</td><td><span className={'badge ' + i.status}>{i.status}</span></td></tr>)}</tbody>
          </table></div>
        </Section>
      </div>)}

      <div className="sign"><div>Prepared by (Administrator)</div><div>Date</div></div>
    </article>
  </>)
}