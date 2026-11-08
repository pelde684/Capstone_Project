import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export function Stats({ cells }) {
  return (
    <div className="stats">{cells.map(([label, n, Icon, warn]) => (
      <div key={label} className={'stat glass' + (warn ? ' warn' : '')}>
        <div><span>{label}</span><b>{n}</b></div>
        <Icon size={30} strokeWidth={1.6} />
      </div>
    ))}</div>
  )
}

export function Action({ to, Icon, title, text, link, blue }) {
  return (
    <Link to={to} className={'act glass' + (blue ? ' blue' : '')}>
      {blue ? <Icon size={34} strokeWidth={1.6} /> : <span className="ico"><Icon size={22} /></span>}
      <h2>{title}</h2>
      <p>{text}</p>
      <span className="go">{link}<ChevronRight size={18} /></span>
    </Link>
  )
}