export default function GlassCard({ children, className = '', onClick }) {
  const base = 'glass transition-all duration-200'
  const interactive = onClick ? 'cursor-pointer hover:bg-white/[0.07] hover:border-white/[0.13] active:scale-[0.99]' : ''
  return (
    <div className={`${base} ${interactive} ${className}`} onClick={onClick}>
      {children}
    </div>
  )
}
