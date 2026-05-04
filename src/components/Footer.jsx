/** Pie opcional; las pantallas principales usan el bloque de cuenta en el sidebar. */
export default function Footer({ className = '' }) {
  return (
    <footer className={className} style={{ display: 'none' }} aria-hidden="true">
      AgroGestión
    </footer>
  )
}
