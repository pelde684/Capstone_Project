import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Megaphone, AlertTriangle, Clock, X } from 'lucide-react'

// Edit these notices, or pass a `notices` prop from your backend later.
// tone: 'info' (blue) | 'warn' (amber) | 'good' (green)
const NOTICES = [
  {
    id: 1,
    tone: 'info',
    title: 'Welcome to the luggage room',
    text: 'Verify every item against its tag before it is stored.',
  },
  {
    id: 2,
    tone: 'warn',
    title: 'Luggage room closes at 6:00 PM',
    text: 'Finish all handovers and print the shift report before closing.',
    to: '/operator/report',
    cta: 'Open report',
  },
  {
    id: 3,
    tone: 'good',
    title: 'New: Rooms page',
    text: 'You can now see which room each stored item is kept in.',
    to: '/operator/rooms',
    cta: 'View rooms',
  },
]

const ICONS = { info: Megaphone, warn: AlertTriangle, good: Clock }
const DELAY = 5000

// Makes the notice box fit any width: the box measures its own width, and when it is
// narrow (phone, small window) each notice stacks: icon, then text, then the button.
const NT_CSS = `
.nt { container-type: inline-size; position: relative; }
.nt .nt-slide { padding-left: 64px; padding-right: 64px; padding-bottom: 40px; box-sizing: border-box; }
.nt .nt-text { flex: 1 1 220px; min-width: 0; overflow-wrap: break-word; }
.nt .nt-text b, .nt .nt-text span { display: block; }
.nt .nt-cta { flex: none; white-space: nowrap; }
.nt .nt-close { position: absolute; top: 10px; right: 10px; z-index: 3; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 999px; border: 0; background: rgba(128, 150, 175, 0.22); color: inherit; cursor: pointer; }
.nt .nt-close:hover { background: rgba(128, 150, 175, 0.4); }

@container (max-width: 640px) {
  .nt .nt-slide { flex-wrap: wrap; align-items: flex-start; gap: 10px 14px; padding-left: 56px; padding-right: 48px; }
  .nt .nt-text { flex: 1 1 100%; order: 2; }
  .nt .nt-ico { order: 1; }
  .nt .nt-cta { order: 3; }
}
@container (max-width: 380px) {
  .nt .nt-slide { padding-left: 52px; padding-right: 44px; }
  .nt .nt-arrow { width: 32px; height: 32px; }
}
`

export default function NoticeSlider({ notices = NOTICES }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [closed, setClosed] = useState(false)
  const n = notices.length

  const go = (k) => setI((k + n) % n)

  // Auto-advance; restarts whenever the slide changes
  useEffect(() => {
    if (paused || n < 2) return
    const t = setTimeout(() => setI((x) => (x + 1) % n), DELAY)
    return () => clearTimeout(t)
  }, [i, paused, n])

  if (n === 0 || closed) return null

  return (
    <section
      className="glass nt"
      aria-roledescription="carousel"
      aria-label="Notices"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <style>{NT_CSS}</style>
      <button type="button" className="nt-close" onClick={() => setClosed(true)} aria-label="Close notices" title="Close">
        <X size={16} />
      </button>

      <div className="nt-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {notices.map((x, idx) => {
          const Icon = ICONS[x.tone] || Megaphone
          return (
            <div
              key={x.id}
              className={'nt-slide ' + (x.tone || 'info')}
              aria-hidden={idx !== i}
              role="group"
              aria-label={`${idx + 1} of ${n}`}
            >
              <div className="nt-ico"><Icon size={26} /></div>
              <div className="nt-text">
                <b>{x.title}</b>
                <span>{x.text}</span>
              </div>
              {x.to && (
                <Link className="nt-cta" to={x.to} tabIndex={idx === i ? 0 : -1}>
                  {x.cta || 'Open'}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {n > 1 && (
        <>
          <button type="button" className="nt-arrow l" onClick={() => go(i - 1)} aria-label="Previous notice">
            <ChevronLeft size={20} />
          </button>
          <button type="button" className="nt-arrow r" onClick={() => go(i + 1)} aria-label="Next notice">
            <ChevronRight size={20} />
          </button>

          <div className="nt-dots">
            {notices.map((x, idx) => (
              <button
                key={x.id}
                type="button"
                className={idx === i ? 'on' : ''}
                onClick={() => go(idx)}
                aria-label={`Go to notice ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}