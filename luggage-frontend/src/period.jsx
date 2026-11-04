const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const parse = (s) => new Date(s + 'T00:00:00')

// Semesters: Feb to Jul (spring) and Aug to Jan (autumn)
export const semesterStart = (now = new Date()) => {
  const y = now.getFullYear()
  const m = now.getMonth()
  if (m >= 7) return new Date(y, 7, 1)
  if (m === 0) return new Date(y - 1, 7, 1)
  return new Date(y, 1, 1)
}

export const periods = ['All time', 'Today', 'Last 7 days', 'Last 30 days', 'This month', 'This semester', 'Custom range']

export function inPeriod(dateStr, period, from = '', to = '', now = new Date()) {
  const d = parse(dateStr)
  const today = startOfDay(now)
  const daysAgo = (n) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - n)
  switch (period) {
    case 'Today': return d.getTime() === today.getTime()
    case 'Last 7 days': return d >= daysAgo(6) && d <= today
    case 'Last 30 days': return d >= daysAgo(29) && d <= today
    case 'This month': return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
    case 'This semester': return d >= semesterStart(now) && d <= today
    case 'Custom range':
      if (from && d < parse(from)) return false
      if (to && d > parse(to)) return false
      return true
    default: return true
  }
}

export function periodLabel(period, from = '', to = '') {
  if (period !== 'Custom range') return period
  const f = (s) => parse(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  if (from && to) return `${f(from)} to ${f(to)}`
  if (from) return `From ${f(from)}`
  if (to) return `Up to ${f(to)}`
  return 'All time'
}