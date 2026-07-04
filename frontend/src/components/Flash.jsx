export default function Flash({ flash, onDismiss }) {
  if (!flash) return null
  return (
    <div className={`alert alert-${flash.type} alert-dismissible fade show`} role="alert">
      {flash.message}
      <button type="button" className="btn-close" onClick={onDismiss} />
    </div>
  )
}
