import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Megaphone, AlertTriangle, Clock } from 'lucide-react'

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

export default function NoticeSlider({ notices = NOTICES }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const n = notices.length

  const go = (k) => setI((k + n) % n)

  // Auto-advance; restarts whenever the slide changes
  useEffect(() => {
    if (paused || n < 2) return
    const t = setTimeout(() => setI((x) => (x + 1) % n), DELAY)
    return () => clearTimeout(t)
  }, [i, paused, n])

  if (n === 0) return null

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