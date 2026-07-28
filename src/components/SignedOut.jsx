// The one signed-out empty state. Every gated page used to roll its own — two
// centred hero blocks and one bare GlassCard — so the shell visibly changed
// shape as you moved between tabs while logged out. Pages pass the icon and the
// copy; the layout is fixed here.

export default function SignedOut({ icon = '◎', title, body }) {
  return (
    <div className="px-4 sm:px-6 py-16 sm:py-24 text-center space-y-3">
      <div className="w-12 h-12 mx-auto rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-xl text-slate-500">
        {icon}
      </div>
      <p className="text-slate-300 font-medium">{title}</p>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">{body}</p>
    </div>
  )
}
