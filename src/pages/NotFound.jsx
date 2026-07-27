import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24 text-center space-y-3">
      <div className="w-12 h-12 mx-auto rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-xl text-slate-500">
        ◎
      </div>
      <p className="text-slate-300 font-medium">Page not found</p>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">
        This page doesn't exist. Check the URL or head back to your watchlist.
      </p>
      <Link
        to="/"
        className="inline-block pt-1 text-sm text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}