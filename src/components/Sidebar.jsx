export default function Sidebar({
  roleSubtitle,
  fincaOptions = [],
  fincaValue,
  onFincaChange,
  navItems,
  activeNavSection,
  onNavClick,
  accountName,
  accountEmail,
  onLogout,
}) {
  // Preparar opciones: ACTIVO + finca seleccionada si es ANULADA
  const displayOptions = (() => {
    // Filtrar solo ACTIVO
    const activeFincas = fincaOptions.filter((f) => {
      const raw = f.estado_registro
      const estado = raw != null ? String(raw).trim().toUpperCase() : null
      return estado === 'ACTIVO'
    })

    // Si hay una finca seleccionada que no está en ACTIVO, agregarla
    const selectedFinca = fincaOptions.find((f) => String(f.id) === String(fincaValue))
    if (selectedFinca) {
      const selectedEstado = selectedFinca.estado_registro
        ? String(selectedFinca.estado_registro).trim().toUpperCase()
        : null
      if (selectedEstado !== 'ACTIVO' && !activeFincas.some((f) => f.id === selectedFinca.id)) {
        return [...activeFincas, selectedFinca]
      }
    }

    return activeFincas
  })()

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img src="/recursos/logo.png" alt="AgroGestión Logo" />
          <div className="logo-text">
            <h2>AgroGestión</h2>
            <p>{roleSubtitle}</p>
          </div>
        </div>
      </div>

      <div className="finca-selector">
        <label htmlFor="fincaSelect">Finca Seleccionada</label>
        <select
          id="fincaSelect"
          className="select-finca"
          value={fincaValue}
          onChange={(e) => onFincaChange(e.target.value)}
        >
          {displayOptions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="sidebar-scrollable">
        <nav className="nav-menu">
          {navItems.map((group) => (
            <div className="menu-section" key={group.title}>
              <h3 className="section-title">{group.title}</h3>
              <ul>
                {group.links.map((link) => (
                  <li key={link.section}>
                    <a
                      href="#"
                      className={`nav-link ${activeNavSection && activeNavSection === link.section ? 'active' : ''}`}
                      data-section={link.section}
                      onClick={(e) => {
                        e.preventDefault()
                        onNavClick(link.section)
                      }}
                    >
                      <span className="icon">{link.icon}</span>
                      <span>{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="account-info">
            <h4>Cuenta</h4>
            <p className="account-name">{accountName}</p>
            <p className="account-email">{accountEmail}</p>
          </div>
          <button type="button" className="logout-btn" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  )
}
