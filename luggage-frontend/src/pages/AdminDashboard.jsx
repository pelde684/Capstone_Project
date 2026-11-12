
import {
  Users,
  Briefcase,
  Clock,
  CheckCircle2,
  BarChart3,
  FileText,
  Package,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Archive,
} from 'lucide-react'

import { semesterStart } from '../period'
import { Stats, Action } from './Stats'

export default function AdminDashboard({ items = [], students = [] }) {
  // Count luggage by status
  const countStatus = (status) =>
    items.filter((item) => item.status === status).length

  const pending = countStatus('Pending')
  const stored = countStatus('Stored')
  const returned = countStatus('Returned')
  const rejected = countStatus('Rejected')

  // Handover progress
  const handled = stored + returned
  const percentage = handled > 0
    ? Math.round((returned / handled) * 100)
    : 0

  // Count items registered during the current semester
  const startDate = semesterStart()

  const semesterItems = items.filter((item) => {
    if (!item.date) return false

    const itemDate = new Date(`${item.date}T00:00:00`)

    return !Number.isNaN(itemDate.getTime()) && itemDate >= startDate
  }).length

  const totalItems = items.length

  const statusCards = [
    {
      label: 'Pending verification',
      value: pending,
      icon: Clock,
      color: '#FEC84B',
      background: 'rgba(247, 144, 9, 0.13)',
    },
    {
      label: 'Currently stored',
      value: stored,
      icon: Archive,
      color: '#84ADFF',
      background: 'rgba(132, 173, 255, 0.13)',
    },
    {
      label: 'Handed back',
      value: returned,
      icon: CheckCircle2,
      color: '#6CE9A6',
      background: 'rgba(18, 183, 106, 0.13)',
    },
    {
      label: 'Rejected',
      value: rejected,
      icon: AlertCircle,
      color: '#FDA29B',
      background: 'rgba(240, 68, 56, 0.13)',
    },
  ]

  return (
    <div className="admin-dashboard">

      {/* Welcome section */}
      <section className="admin-welcome">
        <div>
          <div className="admin-welcome-label">
            <ShieldCheck size={16} />
            ADMINISTRATION PANEL
          </div>

          <h2>Welcome to your dashboard</h2>

          <p>
            Manage students, monitor luggage activity, and keep track
            of the luggage room system.
          </p>
        </div>

        <div className="admin-welcome-icon">
          <Briefcase size={38} />
        </div>
      </section>

      {/* Main statistics */}
      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>System overview</h3>
            <p>Important information about your luggage room.</p>
          </div>

          <span className="admin-live-label">
            <span />
            Live overview
          </span>
        </div>

        <Stats
          cells={[
            ['Students', students.length, Users],
            ['Stored this semester', semesterItems, Briefcase],
            ['Waiting for a check', pending, Clock, pending > 0],
            ['Handed back', returned, CheckCircle2],
          ]}
        />
      </section>

      {/* Quick actions */}
      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Quick access</h3>
            <p>Manage the main areas of your system.</p>
          </div>
        </div>

        <div className="grid2 admin-action-grid">
          <Action
            blue
            to="/admin/students"
            Icon={Users}
            title="Manage students"
            text="View registered students and manage their information."
            link="Open students"
          />

          <Action
            to="/admin/reports"
            Icon={BarChart3}
            title="Reports and analytics"
            text="Review luggage statistics, handovers, and system activity."
            link="Open reports"
          />

          <Action
            to="/admin/records"
            Icon={FileText}
            title="System records"
            text="Monitor luggage room records and follow system activities."
            link="View records"
          />

          <div className="glass card admin-progress-card">
            <div className="admin-progress-top">
              <div>
                <div className="admin-card-icon">
                  <CheckCircle2 size={20} />
                </div>

                <h3>Handover progress</h3>

                <p className="muted">
                  Returned items compared with all stored and returned items.
                </p>
              </div>

              <div className="admin-progress-number">
                {percentage}%
              </div>
            </div>

            <div
              className="admin-progress-track"
              role="progressbar"
              aria-label="Handover progress"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="admin-progress-fill"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <div className="admin-progress-footer">
              <span>{returned} returned</span>
              <span>{handled} total handled</span>
            </div>
          </div>
        </div>
      </section>

      {/* Luggage status overview */}
      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Luggage status overview</h3>
            <p>A quick breakdown of all registered luggage.</p>
          </div>

          <div className="admin-total-items">
            <Package size={17} />
            {totalItems} total items
          </div>
        </div>

        <div className="admin-status-grid">
          {statusCards.map((status) => {
            const Icon = status.icon

            return (
              <div className="admin-status-card" key={status.label}>
                <div
                  className="admin-status-icon"
                  style={{
                    color: status.color,
                    background: status.background,
                  }}
                >
                  <Icon size={21} />
                </div>

                <div>
                  <h3>{status.value}</h3>
                  <p>{status.label}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Bottom information */}
      <section className="admin-bottom-note">
        <div className="admin-note-icon">
          <ShieldCheck size={21} />
        </div>

        <div>
          <strong>System management</strong>
          <p>
            Use the administration panel to manage student information,
            review reports, and monitor luggage room activities.
          </p>
        </div>

        <ArrowUpRight className="admin-note-arrow" size={21} />
      </section>

    </div>
  )
}
