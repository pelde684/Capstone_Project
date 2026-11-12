import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, ChevronUp, MapPin, Mail, Phone, Clock, Crown } from 'lucide-react'

// EDIT THESE: your real details
const CONTACT = {
  address: 'Phuentsholing, Chhukha, Bhutan',
  email: 'luggage@rub.edu.bt',
  phone: '+975-17611350',
  hours: 'Open every day, 8:00 AM to 5:00 PM',
}
const GUIDE = { name: 'Norbu Tshering Lepcha', phone: '17922146' }
const LEADER = { name: 'Pelden Nidup', phone: '17611350' }
const MEMBERS = ['Kinley Tshering', 'Tandin Yoezer Wangmo', 'Karma Wangchuk', 'Sonamsangay Yoezer']

const OP_LINKS = [
  ['/operator', 'Dashboard'], ['/operator/scan', 'Scan QR'], ['/operator/verify', 'Verification'],
  ['/operator/handover', 'Handover'], ['/operator/report', 'Shift report'], ['/operator/rooms', 'Rooms'],
]
const ADMIN_LINKS = [
  ['/admin', 'Dashboard'], ['/admin/students', 'Students'], ['/admin/reports', 'Reports'],
  ['/admin/records', 'Records'], ['/admin/complaints', 'Complaints'], ['/admin/rooms', 'Rooms'],
]

const initials = (n) => n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

export default function StaffFooter({ role }) {
  const links = role === 'Admin' ? ADMIN_LINKS : OP_LINKS
  const [top, setTop] = useState(false)
  useEffect(() => {
    const on = () => setTop(window.scrollY > 300)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <footer className="sfoot">
      <div className="sf-in">
        <div>
          <div className="sf-brand">
            <span className="sf-logo"><Briefcase size={24} /></span>
            <div><b>CST Luggage Room</b><small>COLLEGE OF SCIENCE AND TECHNOLOGY</small></div>
          </div>
          <h3>QR Luggage Room Management System</h3>
          <p>Safe luggage storage for students, hostel residents and visitors. Staff tools for scanning, verifying and handing over items.</p>
        </div>

        <div>
          <h4>{role === 'Admin' ? 'ADMIN TOOLS' : 'OPERATOR TOOLS'}</h4>
          <nav>{links.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}</nav>
        </div>

        <div>
          <h4>CONTACT & INFO</h4>
          <ul>
            <li><MapPin size={16} />{CONTACT.address}</li>
            <li><Mail size={16} /><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
            <li><Phone size={16} /><a href={`tel:${CONTACT.phone.replace(/[\s-]/g, '')}`}>{CONTACT.phone}</a></li>
            <li><Clock size={16} />{CONTACT.hours}</li>
          </ul>
        </div>
      </div>

      <div className="sf-team">
        <div className="sf-in2">
          <h4>PROJECT GUIDE</h4>
          <div className="sf-guide">
            <span className="av big">{initials(GUIDE.name)}</span>
            <div><b>{GUIDE.name}</b><small>Project guide</small></div>
            <a href={`tel:${GUIDE.phone}`}><Phone size={16} />{GUIDE.phone}</a>
          </div>

          <h4 style={{ marginTop: 26 }}>PROJECT TEAM</h4>
          <div className="sf-members">
            <div className="mem lead">
              <span className="av">{initials(LEADER.name)}</span>
              <b>{LEADER.name}</b>
              <small><Crown size={12} /> Team leader</small>
              <a href={`tel:${LEADER.phone}`}><Phone size={12} />{LEADER.phone}</a>
            </div>
            {MEMBERS.map(n => (
              <div className="mem" key={n}>
                <span className="av">{initials(n)}</span>
                <b>{n}</b>
                <small>Team member</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sf-copy">
        © {new Date().getFullYear()} CST Luggage Room. Guide: {GUIDE.name}. Built by {LEADER.name} (leader), {MEMBERS.join(', ')}.
      </div>

      {top && (
        <button className="totop" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ChevronUp size={22} />
        </button>
      )}
    </footer>
  )
}