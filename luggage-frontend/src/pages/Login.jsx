
import { useState } from 'react'
import { Briefcase } from 'lucide-react'

export default function Login({ onLogin }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  const [busy, setBusy] = useState(false)

  // Checks the email and password with the backend. Only operators and admins get in here.
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await onLogin(id.trim().toLowerCase(), pw)
    } catch (ex) {
      setErr(ex.message === 'Invalid credentials' ? 'Wrong email or password.' : ex.message)
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
        <div className="muted">
          QR Management System
        </div>

        <form className="glass" onSubmit={submit}>
          <div>
            <h2 style={{ margin: 0 }}>Welcome back</h2>
            <div className="muted">
              Log in to access the system
            </div>
          </div>

          <label>
            Email
            <input
              type="email"
              value={id}
              onChange={(e) => {
                setId(e.target.value)
                setErr('')
              }}
              placeholder="operator@college.edu"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Enter password"
              required
            />
          </label>

          {err && (
            <div style={{ color: 'var(--danger)' }} role="alert">
              {err}
            </div>
          )}

          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>

          <div className="muted" style={{ fontSize: 14 }}>
            Students log in on the student site.
          </div>
        </form>
      </div>
    </div>
  )
}
