import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { PROPOSALS } from './data/mock'
import { AuthProvider } from './context/AuthContext'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import ThesisDetail from './pages/ThesisDetail'
import Proposals from './pages/Proposals'
import Account from './pages/Account'

const pendingCount = PROPOSALS.filter(p => p.status === 'pending').length

function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-emerald-500/[0.04] rounded-full blur-3xl" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-indigo-500/[0.05] rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-sky-500/[0.04] rounded-full blur-3xl" />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  )
}
