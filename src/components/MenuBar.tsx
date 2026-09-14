interface MenuBarProps {
  projectName?: string
}

export function MenuBar({
  projectName,
}: MenuBarProps) {
  return (
    <div className="menu-bar">
      <div className="menu-group">
        <button
          className="menu-item"
          type="button"
        >
          Project
        </button>
      </div>

      <div className="menu-group">
        <button
          className="menu-item"
          type="button"
        >
          Edit
        </button>
      </div>

      <div className="menu-group">
        <button
          className="menu-item"
          type="button"
        >
          Journal
        </button>
      </div>

      {projectName && (
        <div className="menu-project-name">
          {projectName}.proj
        </div>
      )}
    </div>
  )
}