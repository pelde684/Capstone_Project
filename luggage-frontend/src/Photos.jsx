import { useState } from 'react'

// Shows all of an item's photos (up to 4): one big photo plus small thumbnails to switch between them.
// Click the big photo to open it full size in a new tab.
export default function Photos({ it, maxWidth, height = 220, style }) {
  const list = it.photos?.length ? it.photos : it.photo ? [it.photo] : []
  const [i, setI] = useState(0)
  if (!list.length) return null
  const cur = list[Math.min(i, list.length - 1)]

  return (
    <div style={{ maxWidth, ...style }}>
      <a href={cur} target="_blank" rel="noreferrer" title="Open the photo full size" style={{ display: 'block', position: 'relative' }}>
        <img src={cur} alt={`Photo of ${it.name}`} style={{ width: '100%', height, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
        {list.length > 1 && (
          <span style={{ position: 'absolute', right: 8, bottom: 8, background: 'rgba(0,0,0,.7)', color: '#fff', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 8 }}>
            {Math.min(i, list.length - 1) + 1} / {list.length}
          </span>
        )}
      </a>
      {list.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          {list.map((src, k) => (
            <button
              key={k}
              type="button"
              onClick={() => setI(k)}
              title={`Photo ${k + 1}`}
              style={{
                padding: 0, border: k === i ? '2px solid var(--accent, #2563eb)' : '2px solid transparent',
                borderRadius: 8, overflow: 'hidden', width: 52, height: 52, cursor: 'pointer', background: 'none',
                opacity: k === i ? 1 : 0.7,
              }}
            >
              <img src={src} alt={`Photo ${k + 1} of ${it.name}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
