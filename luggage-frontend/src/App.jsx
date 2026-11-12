import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, NavLink, Link } from 'react-router-dom'
import { Briefcase, LayoutDashboard, QrCode, ShieldCheck, HandHelping, Users, BarChart3, FileText, MessageSquare, LogOut, Sun, Moon, Bell, UserCircle2, ChevronDown, Package } from 'lucide-react'
import { api, apiAll, getToken, clearToken, LOGIN_URL } from './api'
import { buildItems, buildPeople } from './adapt'
import OperatorDashboard from './pages/OperatorDashboard'
import Scan from './pages/Scan'
import Verify from './pages/Verify'
import Handover from './pages/Handover'
import OperatorReport from './pages/OperatorReport'
import AdminDashboard from './pages/AdminDashboard'
import AdminTables from './pages/AdminTables'
import AdminReports from './pages/AdminReports'
import AdminComplaints from './pages/AdminComplaints'
import Rooms from './pages/Rooms'

const opLinks = [
  ['/operator', 'Dashboard', LayoutDashboard, true],
  ['/operator/scan', 'Scan QR', QrCode],
  ['/operator/verify', 'Verification', ShieldCheck],
  ['/operator/handover', 'Handover', HandHelping],
  ['/operator/report', 'Report', FileText],
  ['/operator/rooms', 'Rooms', Package],
]
const adminLinks = [
  ['/admin', 'Dashboard', LayoutDashboard, true],
  ['/admin/students', 'Students', Users],
  ['/admin/reports', 'Reports', BarChart3],
  ['/admin/records', 'Records', FileText],
  ['/admin/complaints', 'Complaints', MessageSquare],
  ['/admin/rooms', 'Rooms', Package],
]

// Same toggle as the student site: a button with a sun/moon icon that says which mode it switches to
function ThemeToggle({ dark, setDark }) {
  const Icon = dark ? Sun : Moon
  const label = dark ? 'Light mode' : 'Dark mode'
  return (
    <button type="button" className="themebtn" onClick={() => setDark(!dark)} aria-label={`Switch to ${label.toLowerCase()}`} title={`Switch to ${label.toLowerCase()}`}>
      <Icon size={16} />{label}
    </button>
  )
}

// Remembered in the browser under the same key as the student site
const THEME_KEY = 'luggage-room-theme'
const savedDark = () => { try { return localStorage.getItem(THEME_KEY) !== 'light' } catch { return true } }

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
                <span><b>{user.name}</b><small>{user.role}, CST Luggage Room</small></span>
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

// Not logged in: go to the shared login page (the same one students use)
function GoToLogin() {
  useEffect(() => { window.location.replace(LOGIN_URL) }, [])
  return <p style={{ padding: 24 }}>Opening the login page… <a href={LOGIN_URL}>Click here if nothing happens</a>.</p>
}

export default function App() {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(() => !!getToken()) // checking a saved login
  const [data, setData] = useState({ items: [], students: [], staff: [], locations: [] })
  const [loaded, setLoaded] = useState(false)
  const [loadErr, setLoadErr] = useState('')
  const [dark, setDark] = useState(savedDark)
  const [toast, setToast] = useState('')
  useEffect(() => {
    document.documentElement.classList.toggle('light', !dark)
    try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light') } catch { /* not remembered, still works */ }
  }, [dark])
  useEffect(() => { if (toast) { const t = setTimeout(() => setToast(''), 3500); return () => clearTimeout(t) } }, [toast])

  // Everything the pages show comes from the backend. Called after login and after every action.
  const reload = useCallback(async (who = user) => {
    if (!who) return
    try {
      const isAdmin = who.role === 'Admin'
      const [apiItems, txs, locs, users] = await Promise.all([
        apiAll('/items'),
        apiAll('/transactions'),
        api('/locations'),
        isAdmin ? apiAll('/users') : Promise.resolve([]), // only admins may list users
      ])
      const people = buildPeople(users)
      setData({
        items: buildItems(apiItems, txs, people.emailById),
        students: people.students,
        staff: people.staff,
        locations: locs.data,
      })
      setLoadErr('')
    } catch (e) {
      setLoadErr(e.message)
    } finally {
      setLoaded(true)
    }
  }, [user])

  // A saved login survives a page refresh
  useEffect(() => {
    if (!getToken()) return
    api('/auth/me')
      .then(({ user: u }) => { if (u.role === 'Student') throw new Error(); setUser(u); reload(u) })
      .catch(() => clearToken())
      .finally(() => setBooting(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Logging in and out happens on the shared login page (student site)
  const logout = () => { clearToken(); window.location.assign(LOGIN_URL) }

  // Operator actions. Each one records a transaction in the backend, then reloads.
  const run = async (steps, msg) => {
    try {
      for (const body of steps) await api('/transactions', { method: 'POST', body })
      setToast(msg)
    } catch (e) {
      setToast(`Could not save: ${e.message}`)
      throw e
    } finally {
      await reload()
    }
  }
  const actions = {
    // Approve = hand-in (if not done yet) + check and shelve
    approve: (it, locationId) => run([
      ...(it.apiStatus === 'REGISTERED' ? [{ action: 'DEPOSIT', itemId: it.itemId }] : []),
      { action: 'STORAGE_VERIFICATION', itemId: it.itemId, locationId: Number(locationId) },
    ], `${it.name} (${it.tag}) approved and stored`),
    reject: (it, reason) => run([{ action: 'REJECTION', itemId: it.itemId, remarks: reason }],
      `${it.name} (${it.tag}) rejected: ${reason.toLowerCase()}`),
    collect: (it) => run([{ action: 'COLLECTION', itemId: it.itemId, verificationStatus: 'APPROVED', remarks: 'Student ID checked at handover' }],
      `${it.name} (${it.tag}) handed over to ${it.owner}`),
  }

  const { items, students, staff, locations } = data
  const pending = items.filter(i => i.status === 'Pending').length

  const page = (role, title, sub, el) => {
    if (booting) return <div className="login"><div className="wrap"><p className="muted">Loading…</p></div></div>
    if (user?.role !== role) return <Navigate to="/" />
    return (
      <Shell {...{ user, pending, dark, setDark, title, sub }} onLogout={logout}>
        {loadErr && <div className="glass card" role="alert" style={{ color: 'var(--red)', marginBottom: 24 }}>Could not load data: {loadErr} <button className="btn ghost sm" onClick={() => reload()}>Try again</button></div>}
        {loaded ? el : <p className="muted">Loading…</p>}
      </Shell>
    )
  }
  const op = (t, s, el) => page('Operator', t, s, el)
  const ad = (t, s, el) => page('Admin', t, s, el)

  return (<>
    <div className="bg" />
    <Routes>
      <Route path="/" element={booting ? null : user ? <Navigate to={user.role === 'Admin' ? '/admin' : '/operator'} /> : <GoToLogin />} />
      <Route path="/operator" element={op('Operator Dashboard', 'QR Luggage Room Management System', <OperatorDashboard items={items} />)} />
      <Route path="/operator/scan" element={op('Scan QR', 'Scan a student’s QR code to open their items', <Scan items={items} />)} />
      <Route path="/operator/verify" element={op('Verification', 'Check each item before it is stored', <Verify items={items} locations={locations} actions={actions} />)} />
      <Route path="/operator/handover" element={op('Handover', 'Return stored items to their owners', <Handover items={items} actions={actions} />)} />
      <Route path="/operator/report" element={op('Shift report', 'What happened during a shift, ready to print', <OperatorReport items={items} locations={locations} user={user} />)} />
      <Route path="/admin" element={ad('Admin Dashboard', 'QR Luggage Room Management System', <AdminDashboard items={items} students={students} />)} />
      <Route path="/admin/students" element={ad('Students', 'See who is registered and update their details', <AdminTables items={items} students={students} staff={staff} initial="Students" onChanged={() => reload()} />)} />
      <Route path="/admin/reports" element={ad('Reports', 'Look at luggage and handover numbers', <AdminReports staff={staff} locations={locations} user={user} />)} />
      <Route path="/admin/records" element={ad('System records', 'Follow what is happening in the luggage room', <AdminTables items={items} students={students} staff={staff} initial="Items" />)} />
      <Route path="/operator/rooms" element={op('Rooms', 'Which storage room each department uses', <Rooms canEdit={false} />)} />
      <Route path="/admin/rooms" element={ad('Rooms', 'Storage rooms and the department allocated to each', <Rooms canEdit onChanged={() => reload()} />)} />
      <Route path="/admin/complaints" element={ad('Complaints', 'Feedback and complaints sent by students', <AdminComplaints />)} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    {toast && <div className="toast" role="status">{toast}</div>}
  </>)
}

