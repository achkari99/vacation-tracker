import { useEffect } from 'react'

export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    function onKey(e){ if (e.key === 'Escape') onClose?.() }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm grid place-items-center p-4 z-50" onClick={onClose}>
      <div className="card w-full max-w-2xl animate-[fadeIn_.2s_ease-out]"
           onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-line flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="btn-ghost" onClick={onClose}>x</button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="p-4 border-t border-line flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  )
}
