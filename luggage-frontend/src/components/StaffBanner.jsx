import { Link } from 'react-router-dom'
import { CalendarDays, ShieldCheck, QrCode, Users, BarChart3 } from 'lucide-react'

export default function StaffBanner({ user, pending }) {
  const admin = user.role === 'Admin'
  const first = (user.name || '').split(' ')[0] || user.role
  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const date = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
  const text = pending > 0
    ? `${pending} item${pending === 1 ? ' is' : 's are'} waiting for a check.`
    : 'Nothing is waiting. The luggage room is up to date.'

  return (
    <section className="sbanner noprint">
      <i className="c1" /><i className="c2" />
      <div className="sb-text">
        <p><CalendarDays size={16} /> {date}</p>
        <h2>{greeting}, {first}</h2>
        <span>{text}</span>
      </div>
      <div className="sb-acts">
        {admin ? (<>
          <Link to="/admin/students" className="bbtn"><Users size={16} />Students</Link>
          <Link to="/admin/reports" className="bbtn ghost"><BarChart3 size={16} />Reports</Link>
        </>) : (<>
          <Link to="/operator/scan" className="bbtn"><QrCode size={16} />Scan QR</Link>
          <Link to="/operator/verify" className="bbtn ghost"><ShieldCheck size={16} />Verification{pending > 0 && ` (${pending})`}</Link>
        </>)}
      </div>
    </section>
  )
}