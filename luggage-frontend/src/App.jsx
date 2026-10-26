import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, NavLink, Link, useNavigate } from 'react-router-dom'
import { Briefcase, LayoutDashboard, QrCode, ShieldCheck, HandHelping, Users, BarChart3, FileText, LogOut, Bell, UserCircle2, ChevronDown } from 'lucide-react'
import { initialItems } from './data'
import Login from './pages/Login'
import OperatorDashboard from './pages/OperatorDashboard'
import Scan from './pages/Scan'
import Verify from './pages/Verify'
import Handover from './pages/Handover'
import OperatorReport from './pages/OperatorReport'
import AdminDashboard from './pages/AdminDashboard'
import AdminTables from './pages/AdminTables'
import AdminReports from './pages/AdminReports'

const opLinks = [
  ['/operator', 'Dashboard', LayoutDashboard, true],
  ['/operator/scan', 'Scan QR', QrCode],
  ['/operator/verify', 'Verification', ShieldCheck],
  ['/operator/handover', 'Handover', HandHelping],
  ['/operator/report', 'Report', FileText],
]
const adminLinks = [
  ['/admin', 'Dashboard', LayoutDashboard, true],
  ['/admin/students', 'Students', Users],
  ['/admin/reports', 'Reports', BarChart3],
  ['/admin/records', 'Records', FileText],
]

function ThemeToggle({ dark, setDark }) {
  return (
    <button className={'switch' + (dark ? ' dark' : '')} role="switch" aria-checked={dark} aria-label="Dark mode" onClick={() => setDark(!dark)}>
      <span className="track">
        <span className="lbl l">Light</span>
        <span className="lbl d">Dark</span>
        <span className="knob" />
      </span>
    </button>
  )
}

function Shell({ user, pending, dark, setDark, onLogout, title, sub, children }) {
  const [open, setOpen] = useState(false)
  const admin = user.role === 'Admin'
  const links = admin ? adminLinks : opLinks
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><div className="logo"><Briefcase size={24} /></div><div><b>Luggage Room</b><small>Management System</small></div></div>
        <div className="role">{user.role.toUpperCase()}</div>
        <nav>{links.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => 'nav' + (isActive ? ' active' : '')}><Icon size={20} />{label}</NavLink>
        ))}</nav>
        <div className="spacer" />
        <ThemeToggle dark={dark} setDark={setDark} />
        <button className="nav plain" onClick={onLogout}><LogOut size={20} />Logout</button>
      </aside>
      <div>
        <header className="top">
          <div><h1>{title}</h1><p className="muted">{sub}</p></div>
          <div className="tools">
            <Link to={admin ? '/admin/records' : '/operator/verify'} className="bell" aria-label={`${pending} items pending`}>
              <Bell size={22} />{pending > 0 && <span className="dot">{pending}</span>}
            </Link>
            <div className="usermenu">
              <button className="userbtn" onClick={() => setOpen(!open)} aria-expanded={open}>
                <UserCircle2 size={38} strokeWidth={1.5} />
                <span><b>{user.role}</b><small>CST Luggage Room</small></span>
                <ChevronDown size={16} />
              </button>
              {open && <div className="menu glass"><button onClick={onLogout}><LogOut size={16} />Log out</button></div>}
            </div>
          </div>
        </header>
        <main className="main">{children}</main>
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [items, setItems] = useState(initialItems)
  const [dark, setDark] = useState(true)
  const [toast, setToast] = useState('')
  const nav = useNavigate()
  useEffect(() => { document.documentElement.classList.toggle('light', !dark) }, [dark])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 2500); return () => clearTimeout(t) } }, [toast])

  // Saves who approved or rejected an item, and when
  const setStatus = (id, status, msg) => {
    const decided = status === 'Stored' || status === 'Rejected'
    const who = decided ? { verifiedBy: user?.id, verifiedOn: new Date().toISOString().slice(0, 10) } : {}
    setItems(p => p.map(i => i.id === id ? { ...i, status, ...who } : i))
    setToast(msg)
  }
  const login = (u) => { setUser(u); nav(u.role === 'Admin' ? '/admin' : '/operator') }
  const logout = () => { setUser(null); nav('/') }
  const pending = items.filter(i => i.status === 'Pending').length

  const page = (role, title, sub, el) => user?.role === role
    ? <Shell {...{ user, pending, dark, setDark, title, sub }} onLogout={logout}>{el}</Shell>
    : <Navigate to="/" />
  const op = (t, s, el) => page('Operator', t, s, el)
  const ad = (t, s, el) => page('Admin', t, s, el)

  return (<>
    <div className="bg" />
    <Routes>
      <Route path="/" element={<Login onLogin={login} />} />
      <Route path="/operator" element={op('Operator Dashboard', 'QR Luggage Room Management System', <OperatorDashboard items={items} />)} />
      <Route path="/operator/scan" element={op('Scan QR', 'Scan a student’s QR code to open the item', <Scan items={items} />)} />
      <Route path="/operator/verify" element={op('Verification', 'Check each item before it is stored', <Verify items={items} setStatus={setStatus} />)} />
      <Route path="/operator/handover" element={op('Handover', 'Return stored items to their owners', <Handover items={items} setStatus={setStatus} />)} />
      <Route path="/operator/report" element={op('Shift report', 'Print a summary of the luggage room', <OperatorReport items={items} />)} />
      <Route path="/admin" element={ad('Admin Dashboard', 'QR Luggage Room Management System', <AdminDashboard items={items} />)} />
      <Route path="/admin/students" element={ad('Students', 'See who is registered and update their details', <AdminTables items={items} initial="Students" />)} />
      <Route path="/admin/reports" element={ad('Reports', 'Look at luggage and handover numbers', <AdminReports items={items} />)} />
      <Route path="/admin/records" element={ad('System records', 'Follow what is happening in the luggage room', <AdminTables items={items} initial="Items" />)} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    {toast && <div className="toast" role="status">{toast}</div>}
  </>)
}