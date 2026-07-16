import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { api } from './api/client'
import { pendingProposalCount } from './api/adapt'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import ThesisDetail from './pages/ThesisDetail'
import Proposals from './pages/Proposals'
import Account from './pages/Account'

function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-indigo-500/[0.05] rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-sky-500/[0.04] rounded-full blur-3xl" />
    </div>
  )
}

// Inside AuthProvider so it can read auth + fetch the live proposal count.
function Shell() {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!user) { setPendingCount(0); return }
    let active = true
    api.proposals.all()
      .then((data) => active && setPendingCount(pendingProposalCount(data)))
      .catch(() => active && setPendingCount(0))
    return () => { active = false }
  }, [user])

  return (
    <>
      <Background />
      <NavBar pendingCount={pendingCount} />
      <main className="min-h-screen pb-16">
        <Routes>
          <Route path="/"            element={<Dashboard />} />
          <Route path="/thesis/:id"  element={<ThesisDetail />} />
          <Route path="/proposals"   element={<Proposals />} />
          <Route path="/account"     element={<Account />} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  )
}
