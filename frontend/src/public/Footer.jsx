import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronUp, MapPin, Mail, Phone, Clock, Crown } from 'lucide-react'
import Logo from './Logo'
import paint from './cst-paint.jpeg'
import { useSidebarCollapsed } from '../components/useSidebarCollapsed'

// EDIT THESE: your real details
const CONTACT = {
  address: 'Phuentsholing, Chhukha, Bhutan',
  email: 'luggage@rub.edu.bt',
  phone: '+975 17611250',
  hours: 'Open daily, 8:00 AM to 5:00 PM',
}
const GUIDE = { name: 'Norbu Tshering Lepcha', phone: '17922146' }
const LEADER = { name: 'Pelden Nidup', phone: '17611350' }
const MEMBERS = ['Kinley Tshering', 'Tandin Yoezer Wangmo', 'Karma Wangchuk', 'Sonamsangay Yoezer']

const LINKS = [
  ['/dashboard', 'Dashboard'],
  ['/register', 'Register item'],
  ['/belongings', 'My belongings'],
  ['/feedback', 'Feedback'],
]

const initials = (n) => n.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

// The student site is light by default and switches to dark when <html> has the "dark" class
// (see @custom-variant dark in index.css), so the footer follows the same rule.
function readTheme() {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// Compact footer: the painting shows along the bottom (building, water tower, hills), and a navy
// shade over the top keeps the text easy to read and matches the side menu.
// To show more painting, lower the numbers in the two wash lines: --cf-top / --cf-bottom
// (the first line of the CSS is dark mode, the line with data-theme="light" is light mode).
const CSS = `
.cf { --cf-top: rgba(14,28,46,0.92); --cf-mid: rgba(14,28,46,0.73); --cf-bottom: rgba(14,28,46,0.58); --cf-text: #ffffff; --cf-soft: rgba(255,255,255,0.86); --cf-muted: #b9c6d8; --cf-icon: #cfd9e6; --cf-chip: rgba(255,255,255,0.10); --cf-line: rgba(255,255,255,0.18); --cf-avatar: rgba(255,255,255,0.22); --cf-avatar-text: #ffffff;
  width: 100%; box-sizing: border-box; color: var(--cf-text);
  position: relative; isolation: isolate; background-color: var(--cf-base); --cf-base: #0e1c2e; --cf-paint-filter: none; }
/* the painting and the shade are two separate layers behind the text */
.cf-bg { position: absolute; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.cf-bg-img { display: block; position: absolute; inset: 0; width: 100%; height: 100%; max-width: none; object-fit: cover; object-position: center bottom; filter: var(--cf-paint-filter); }
.cf-bg-veil { position: absolute; inset: 0; background: linear-gradient(to bottom, var(--cf-top), var(--cf-mid) 55%, var(--cf-bottom)); }
.cf[data-theme="light"] { --cf-top: rgba(236,242,248,0.72); --cf-mid: rgba(236,242,248,0.28); --cf-bottom: rgba(236,242,248,0); --cf-text: #0b1030; --cf-soft: #3b4456; --cf-muted: #1f5a6b; --cf-icon: #1f5a6b; --cf-chip: rgba(255,255,255,0.62); --cf-line: rgba(18,48,74,0.16); --cf-avatar: #1e3a5f; --cf-avatar-text: #ffffff; --cf-base: #c6d3e2; --cf-paint-filter: saturate(1.55) contrast(1.12) brightness(0.9); }
.cf-in { container-type: inline-size; width: 100%; }
.cf *, .cf *::before, .cf *::after { box-sizing: border-box; }
.cf a { color: inherit; text-decoration: none; }
.cf a:hover { text-decoration: underline; }
.cf h3, .cf h4, .cf p, .cf ul, .cf nav { margin: 0; padding: 0; }
.cf ul { list-style: none; }

.cf-main { display: grid; grid-template-columns: 1.4fr 0.8fr 1.2fr; gap: 36px; padding: 34px 5vw 22px; }
.cf-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.cf-logo { display: grid; place-items: center; flex: none; width: 52px; height: 52px; border-radius: 12px; background: #fff; overflow: hidden; }
.cf-brand b { display: block; font-size: 1.15rem; line-height: 1.2; }
.cf-brand small { display: block; margin-top: 2px; font-size: 0.7rem; letter-spacing: 0.06em; color: var(--cf-soft); }
.cf h3 { font-size: 1.2rem; line-height: 1.3; font-weight: 600; margin-bottom: 6px; }
.cf-main p { font-size: 0.95rem; line-height: 1.55; color: var(--cf-soft); max-width: 34rem; }
.cf h4 { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.2em; color: var(--cf-muted); margin-bottom: 12px; }
.cf nav { display: flex; flex-direction: column; gap: 9px; font-size: 0.95rem; }
.cf-contact { display: flex; flex-direction: column; gap: 9px; font-size: 0.95rem; }
.cf-contact li { display: flex; align-items: flex-start; gap: 10px; }
.cf-contact svg { flex: none; color: var(--cf-icon); margin-top: 3px; }

.cf-team { border-top: 1px solid var(--cf-line); padding: 16px 5vw 14px; }
.cf-team h4 { margin-bottom: 10px; }
.cf-chips { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 10px; }
.cf-chip { display: flex; align-items: center; gap: 10px; min-width: 0; padding: 8px 14px 8px 8px; border-radius: 16px; background: var(--cf-chip); border: 1px solid var(--cf-line); }
.cf-av { display: grid; place-items: center; flex: none; width: 36px; height: 36px; border-radius: 50%; background: var(--cf-avatar); color: var(--cf-avatar-text); font-weight: 700; font-size: 0.8rem; }
.cf-chip.lead .cf-av, .cf-chip.guide .cf-av { background: #fff; color: #12304a; }
.cf-chip b { display: block; font-size: 0.9rem; line-height: 1.2; overflow-wrap: anywhere; }
.cf-chip small { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; font-size: 0.75rem; color: var(--cf-soft); }
.cf-chip small svg { flex: none; }

.cf-copy { border-top: 1px solid var(--cf-line); padding: 10px 5vw; font-size: 0.8rem; color: var(--cf-soft); }
.cf[data-theme="light"] .cf-team { background: rgba(236,242,248,0.38); }
.cf[data-theme="light"] .cf-copy { background: rgba(236,242,248,0.70); }
.cf-top { position: fixed; right: 24px; bottom: 24px; z-index: 40; display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; border: 0; background: #fff; color: #2f7cf6; box-shadow: 0 8px 24px rgba(0,0,0,0.35); cursor: pointer; }

@media (max-width: 1000px) {
  .cf-main { grid-template-columns: 1fr 1fr; }
  .cf-main > div:first-child { grid-column: 1 / -1; }
}
@media (max-width: 640px) {
  .cf-main { grid-template-columns: 1fr; gap: 24px; padding-top: 28px; }
  .cf-chip { border-radius: 16px; }
  .cf-top { right: 14px; bottom: 14px; }
}

@container (max-width: 1700px) { .cf-chips { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@container (max-width: 760px) { .cf-chips { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@container (max-width: 480px) { .cf-chips { grid-template-columns: minmax(0, 1fr); } }
`

export default function Footer() {
  const [top, setTop] = useState(false)
  const [theme, setTheme] = useState(readTheme)
  const [collapsed] = useSidebarCollapsed()
  const { pathname } = useLocation() // measure again when the page changes
  const [offset, setOffset] = useState(0) // width of the side menu, so the footer starts right after it

  useEffect(() => {
    const on = () => setTop(window.scrollY > 300)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  useEffect(() => {
    const update = () => setTheme(readTheme())
    update()
    const mo = new MutationObserver(update)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    return () => mo.disconnect()
  }, [])

  // Sits to the right of the side menu, like the staff footer. With the menu hidden it uses the full width.
  useEffect(() => {
    const measure = () => {
      // the side menu only takes space on a wide screen and when it has not been hidden
      if (collapsed || !window.matchMedia('(min-width: 768px)').matches) {
        setOffset(0)
        return
      }
      let left = 0
      document.querySelectorAll('aside').forEach((a) => {
        if (a.closest('.fixed')) return // the phone drawer floats above the page, ignore it
        const r = a.getBoundingClientRect()
        if (r.width > 0 && r.left <= 1 && getComputedStyle(a).display !== 'none') left = Math.max(left, Math.round(r.right))
      })
      setOffset(left)
    }
    measure()
    // the footer can be created before the page and its side menu are drawn, so measure again a few times
    const timers = [100, 400, 1000].map((ms) => setTimeout(measure, ms))
    // and whenever the page layout changes size
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
    if (ro) ro.observe(document.body)
    window.addEventListener('resize', measure)
    return () => {
      timers.forEach(clearTimeout)
      if (ro) ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [collapsed, pathname])

  return (
    <footer className="cf" data-theme={theme} style={{ marginLeft: offset, width: offset ? `calc(100% - ${offset}px)` : '100%' }}>
      <style>{CSS}</style>
      <span className="cf-bg" aria-hidden="true">
        <img className="cf-bg-img" src={paint} alt="" />
        <span className="cf-bg-veil" />
      </span>

      <div className="cf-in">
      <div className="cf-main">
        <div>
          <div className="cf-brand">
            <span className="cf-logo"><Logo variant="mark" size={40} /></span>
            <div><b>CST Luggage Room</b><small>COLLEGE OF SCIENCE AND TECHNOLOGY</small></div>
          </div>
          <h3>QR Luggage Room Management System</h3>
          <p>Safe luggage storage for students, hostel residents and visitors. Secure storage, smarter collection.</p>
        </div>

        <div>
          <h4>QUICK LINKS</h4>
          <nav>{LINKS.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}</nav>
        </div>

        <div>
          <h4>CONTACT &amp; INFO</h4>
          <ul className="cf-contact">
            <li><MapPin size={16} />{CONTACT.address}</li>
            <li><Mail size={16} /><a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></li>
            <li><Phone size={16} /><a href={`tel:${CONTACT.phone.replace(/[\s-]/g, '')}`}>{CONTACT.phone}</a></li>
            <li><Clock size={16} />{CONTACT.hours}</li>
          </ul>
        </div>
      </div>

      <div className="cf-team">
        <h4>PROJECT GUIDE &amp; TEAM</h4>
        <div className="cf-chips">
          <div className="cf-chip guide">
            <span className="cf-av">{initials(GUIDE.name)}</span>
            <div><b>{GUIDE.name}</b><small><Phone size={11} /><a href={`tel:${GUIDE.phone}`}>{GUIDE.phone}</a> · Project guide</small></div>
          </div>
          <div className="cf-chip lead">
            <span className="cf-av">{initials(LEADER.name)}</span>
            <div><b>{LEADER.name}</b><small><Crown size={11} /> Team leader · <a href={`tel:${LEADER.phone}`}>{LEADER.phone}</a></small></div>
          </div>
          {MEMBERS.map((n) => (
            <div className="cf-chip" key={n}>
              <span className="cf-av">{initials(n)}</span>
              <div><b>{n}</b><small>Team member</small></div>
            </div>
          ))}
        </div>
      </div>

      <div className="cf-copy">
        © {new Date().getFullYear()} CST Luggage Room · Built by the project team
      </div>
      </div>

      {top && (
        <button className="cf-top" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <ChevronUp size={22} />
        </button>
      )}
    </footer>
  )
}