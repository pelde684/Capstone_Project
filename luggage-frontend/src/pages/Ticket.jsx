export default function Ticket({ it, tone, children }) {
  return (
    <div className={'ticket' + (tone ? ' ' + tone : '')}>
      <div className="stub">
        <small>Tag number</small>
        <b>{it.tag}</b>
        <span className={'badge ' + it.status}>{it.status}</span>
      </div>
      <div className="body">
        {it.photo && (
          <a href={it.photo} target="_blank" rel="noreferrer" title="Open the photo full size">
            <img src={it.photo} alt={`Photo of ${it.name}`} style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />
          </a>
        )}
        <h4>{it.name}</h4>
        <p className="muted" style={{ margin: '4px 0 0' }}>{it.description}</p>
        <dl className="facts">
          <div><dt>Owner</dt><dd>{it.owner}</dd></div>
          <div><dt>Student ID</dt><dd>{it.studentId}</dd></div>
          <div><dt>Category</dt><dd>{it.category}</dd></div>
          {it.hostel && <div><dt>Hostel</dt><dd>{it.hostel}</dd></div>}
          {it.location && <div><dt>Shelf</dt><dd>{it.location}</dd></div>}
        </dl>
        {children}
      </div>
    </div>
  )
}
