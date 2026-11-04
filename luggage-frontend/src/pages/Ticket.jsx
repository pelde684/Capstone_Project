import Photos from '../Photos'
export default function Ticket({ it, tone, children }) {
  return (
    <div className={'ticket' + (tone ? ' ' + tone : '')}>
      <div className="stub">
        <small>Tag number</small>
        <b>{it.tag}</b>
        <span className={'badge ' + it.status}>{it.status}</span>
      </div>
      <div className="body">
        <Photos it={it} style={{ marginBottom: 12 }} />
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
