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
          {fincaOptions.map((f) => (
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
