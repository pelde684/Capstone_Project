
import { useState } from 'react'
import { Briefcase } from 'lucide-react'

export default function Login({ onLogin }) {
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    const v = id.trim().toLowerCase()

    if (v.startsWith('admin')) {
      return onLogin({ role: 'Admin', id: v })
    }

    if (v.startsWith('operator')) {
      return onLogin({ role: 'Operator', id: v })
    }

    setErr('Use an operator or admin email. Students log in on the student site.')
  }

  const demo = (role) => {
    setId(role + '@gmail.com')
    setPw('password')
    setErr('')
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
              placeholder="operator@gmail.com"
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

          <button className="btn" type="submit">
            Log in
          </button>

          <div className="muted" style={{ fontSize: 14 }}>
            Demo login:{' '}
            <button
              type="button"
              className="link"
              onClick={() => demo('operator')}
            >
              Operator
            </button>
            {' '}or{' '}
            <button
              type="button"
              className="link"
              onClick={() => demo('admin')}
            >
              Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
