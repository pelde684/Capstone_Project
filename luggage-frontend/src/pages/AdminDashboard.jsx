import { Users, Briefcase, Clock, CheckCircle2, BarChart3, FileText } from 'lucide-react'
import { students } from '../data'
import { semesterStart } from '../period'
import { Stats, Action } from './Stats'

export default function AdminDashboard({ items }) {
  const c = (s) => items.filter(i => i.status === s).length
  const handled = c('Stored') + c('Returned')
  const pct = handled ? Math.round((c('Returned') / handled) * 100) : 0
  const semItems = items.filter(i => new Date(i.date + 'T00:00:00') >= semesterStart()).length

  return (<>
    <Stats cells={[
      ['Students', students.length, Users],
      ['Stored this semester', semItems, Briefcase],
      ['Waiting for a check', c('Pending'), Clock, c('Pending') > 0],
      ['Handed back', c('Returned'), CheckCircle2],
    ]} />

    <div className="grid2">
      <Action blue to="/admin/students" Icon={Users} title="Manage students" text="See who is registered and update their details." link="Open students" />
      <Action to="/admin/reports" Icon={BarChart3} title="Reports" text="Look at luggage and handover numbers. Print them for the office." link="Open reports" />
    </div>

    <div className="grid2">
      <Action to="/admin/records" Icon={FileText} title="System records" text="Follow what is happening in the luggage room." link="Open records" />
      <div className="glass card" style={{ padding: 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h3 style={{ margin: 0, fontSize: 21 }}>Handover progress</h3><p className="muted" style={{ margin: '6px 0 0' }}>{c('Returned')} of {handled} verified items returned to students</p></div>
          <b style={{ fontSize: 42, letterSpacing: '-.03em' }}>{pct}%</b>
        </div>
        <div className="prog"><i style={{ width: pct + '%' }} /></div>
      </div>
    </div>
  </>)
}