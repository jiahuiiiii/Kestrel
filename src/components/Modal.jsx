import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  // Portal to <body>: escapes the NavBar's backdrop-filter containing block,
  // which would otherwise trap our `position: fixed` overlay to the 64px header.
  return createPortal((
    // Outer wrapper scrolls the whole modal so a tall panel is never clipped
    // at the top edge — you can always scroll up to the title.
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* backdrop — fixed so it covers the viewport while content scrolls */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* centering track: centers when it fits, top-aligns + scrolls when tall */}
      <div className="relative flex min-h-full items-center justify-center p-4">
        {/* panel */}
        <div className={`glass-strong relative w-full ${maxWidth} p-6 shadow-2xl animate-[fadeIn_0.15s_ease-out]`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>

          {title && (
            <div className="mb-5 pr-8">
              <h2 className="text-lg font-semibold text-white tracking-tight">{title}</h2>
              {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  ), document.body)
}
