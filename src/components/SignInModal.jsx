import { useState } from 'react'
import Modal from './Modal'
import { useAuth } from '../context/AuthContext'

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="text-xs text-slate-500 mb-1.5 block">{label}</span>
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-400/40 focus:bg-white/[0.06] transition-colors"
      />
    </label>
  )
}

export default function SignInModal({ open, onClose }) {
  const { signIn } = useAuth()
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    if (!form.email || !form.password || (mode === 'signup' && !form.name)) {
      setError('Please fill in all fields.')
      return
    }
    // Demo auth — no backend. Derive a display name from email if signing in.
    const name = mode === 'signup'
      ? form.name
      : form.email.split('@')[0].replace(/[._]/g, ' ')
    signIn({ name, email: form.email })
    setForm({ name: '', email: '', password: '' })
    setError('')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'signin' ? 'Sign in to Kestrel' : 'Create your account'}
      subtitle="Manage your watchlist and get alerted when your thesis conditions are met."
    >
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && (
          <Field label="Name" type="text" placeholder="Jane Doe" value={form.name} onChange={set('name')} autoFocus />
        )}
        <Field label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} autoFocus={mode === 'signin'} />
        <Field label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} />

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-emerald-400 text-slate-900 text-sm font-semibold hover:bg-emerald-300 transition-colors"
        >
          {mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>

        <p className="text-center text-xs text-slate-500">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </form>
    </Modal>
  )
}
