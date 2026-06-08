// State filter menu component for use in admin sections
export function StateFilterMenu({ 
  states, 
  activeState, 
  onStateChange, 
  labels = {} 
}) {
  return (
    <div className="state-filter-menu">
      {states.map((state) => (
        <button
          key={state}
          type="button"
          className={`state-filter-button ${activeState === state ? 'active' : ''}`}
          onClick={() => onStateChange(state)}
        >
          {labels[state] || state}
        </button>
      ))}
    </div>
  );
}

// Archive/State change button component
export function StateChangeButton({ 
  icon, 
  label, 
  onClick, 
  disabled = false,
  title = '',
  className = ''
}) {
  return (
    <button
      type="button"
      className={`btn-icon btn-state-change ${className}`}
      title={title || label}
      onClick={onClick}
      disabled={disabled}
      style={{
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {icon}
    </button>
  );
}
