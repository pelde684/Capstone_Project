import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { api } from '../api'

export default function RequestAccess() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const set = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value })
    setErr('')
  }

  const submit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) return setErr('Password must be at least 8 characters.')
    if (form.password !== form.confirm) return setErr('Passwords do not match.')

    setBusy(true)
    setErr('')
    try {
      await api('/auth/request-access', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
      })
      setDone(true)
    } catch (ex) {
      setErr(ex.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <div className="wrap">
        <div className="logo">
          <Briefcase size={34} strokeWidth={2} />
        </div>

        <h1 style={{ margin: 0 }}>Luggage Room</h1>
        <div className="muted">QR Management System</div>

        {done ? (
          <div className="glass">
            <div>
              <h2 style={{ margin: 0 }}>Request sent</h2>
              <div className="muted">
                An admin must approve your account before you can log in. Please check back later.
              </div>
            </div>
            <Link className="btn" to="/" style={{ textAlign: 'center', textDecoration: 'none' }}>
              Back to log in
            </Link>
          </div>
        ) : (
          <form className="glass" onSubmit={submit}>
            <div>
              <h2 style={{ margin: 0 }}>Request access</h2>
              <div className="muted">An admin will review your request before you can log in</div>
            </div>

            <label>
              Full name
              <input type="text" value={form.name} onChange={set('name')} placeholder="Your name" required />
            </label>

            <label>
              Email
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@college.edu" required />
            </label>

            <label>
              Password
              <input type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" required />
            </label>

            <label>
              Confirm password
              <input type="password" value={form.confirm} onChange={set('confirm')} placeholder="Re-enter password" required />
            </label>

            {err && (
              <div style={{ color: 'var(--danger)' }} role="alert">
                {err}
              </div>
            )}

            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Sending…' : 'Request access'}
            </button>

            <div className="muted" style={{ fontSize: 14 }}>
              Already approved? <Link to="/">Log in</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}