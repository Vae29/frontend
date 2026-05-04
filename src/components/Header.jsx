export default function Header({ title, showNavCultivo, onScrollToSection }) {
  return (
    <header className="header">
      <div className="header-content">
        <h1 id="pageTitle">{title}</h1>
        {showNavCultivo ? (
          <div className="nav-buttons-cultivo" id="nav-cultivo-header" style={{ display: 'flex' }}>
            <button type="button" className="btn-nav-cultivo" onClick={() => onScrollToSection?.('etapas-section')}>
              📋 Etapas
            </button>
            <button type="button" className="btn-nav-cultivo" onClick={() => onScrollToSection?.('cosechas-section')}>
              🌾 Cosechas
            </button>
            <button type="button" className="btn-nav-cultivo" onClick={() => onScrollToSection?.('costos-cultivo-section')}>
              💰 Costos
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}
