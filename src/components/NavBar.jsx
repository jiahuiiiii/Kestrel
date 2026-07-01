import { NavLink } from 'react-router-dom'
import Logo from '../assets/Logo'
import UserMenu from './UserMenu'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/proposals', label: 'Proposals' },
  { to: '/account', label: 'Account' },
]

export default function NavBar({ pendingCount = 0 }) {
  return (
    <header className="glass-nav sticky top-0 z-50">
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-between">
        {/* brand */}
        <div className="flex items-center gap-2.5">
          <Logo className="w-12 h-12" />
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-white tracking-tight text-xl">Kestrel</span>
            <span className="text-lg text-slate-500 mt-0.5 hidden sm:block">Watchlist Monitor</span>
          </div>
        </div>

        {/* nav + status */}
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 px-3.5 py-1.5 text-md rounded-lg transition-all duration-200 ${isActive
                    ? 'text-white bg-white/[0.09] shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                  }`
                }
              >
                {label}
                {label === 'Proposals' && pendingCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-full">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
