import { NavLink } from 'react-router-dom'
import Logo from '../assets/Logo'
import UserMenu from './UserMenu'

// `short` is the phone label. Four equal-width tabs make the longest label set
// the rhythm for all of them, and "Notification" at 12 characters left the other
// three as mostly padding. "Alerts" is the word the rest of the app already uses
// for these (alert cards, "No alerts yet", the unread count).
const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/proposals', label: 'Proposals' },
  { to: '/notification', label: 'Notification', short: 'Alerts' },
  { to: '/account', label: 'Account' },
]

export default function NavBar({ pendingCount = 0, unreadAlerts = 0 }) {
  return (
    <header className="glass-nav sticky top-0 z-50">
      {/* Brand + four tabs + avatar need ~700px to sit on one line, so the nav
          gets its own full-width row below `lg` and only moves inline above it.
          `order` does that without duplicating the links in the DOM. */}
      <div className="max-w-6xl mx-auto px-4 py-2 sm:px-6 sm:py-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* brand — the subtitle stays visible on phones so this reads as a
            two-line lockup that balances the avatar opposite it. Without it the
            row was one short word against a lot of empty space. */}
        <div className="order-1 flex items-center gap-2.5 min-w-0">
          <Logo className="w-8 h-8 sm:w-12 sm:h-12 flex-shrink-0" />
          <div className="flex flex-col leading-none min-w-0">
            <span className="font-semibold text-white tracking-tight text-base sm:text-xl">Kestrel</span>
            <span className="text-[10px] sm:text-xs text-slate-500 mt-1 tracking-wide">Watchlist Monitor</span>
          </div>
        </div>

        <nav className="order-3 w-full lg:order-2 lg:w-auto lg:ml-auto flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.05] overflow-x-auto scrollbar-none">
          {links.map(({ to, label, short }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex flex-1 lg:flex-none items-center justify-center gap-1.5 whitespace-nowrap px-2 sm:px-3.5 py-2 lg:py-1.5 text-xs sm:text-sm lg:text-base rounded-lg transition-all duration-200 ${isActive
                  ? 'text-white bg-white/[0.09] shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              {short ? (
                <>
                  <span className="lg:hidden">{short}</span>
                  <span className="hidden lg:inline">{label}</span>
                </>
              ) : label}
              {label === 'Proposals' && pendingCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-amber-400 text-slate-900 rounded-full">
                  {pendingCount}
                </span>
              )}
              {label === 'Notification' && unreadAlerts > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-emerald-400 text-slate-900 rounded-full">
                  {unreadAlerts > 99 ? '99+' : unreadAlerts}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="order-2 lg:order-3 ml-auto lg:ml-0 flex-shrink-0 relative z-20">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
