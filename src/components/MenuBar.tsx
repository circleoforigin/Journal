import {
  useEffect,
  useRef,
  useState,
} from 'react'

interface MenuBarProps {
  onNewProject: () => void
  onLoadProject: () => void
  onSaveProject: () => void
  onCloseProject: () => void
  onDeleteProject: () => void

  projectName?: string
}

export function MenuBar({
  onNewProject,
  onLoadProject,
  onSaveProject,
  onCloseProject,
  onDeleteProject,
  projectName,
}: MenuBarProps) {
  const menuBarRef =
    useRef<HTMLDivElement>(null)

  const [
    projectMenuOpen,
    setProjectMenuOpen,
  ] = useState(false)

  useEffect(() => {
    if (!projectMenuOpen) {
      return
    }

    function handleOutsidePointerDown(
      event: PointerEvent,
    ) {
      const target =
        event.target

      if (
        target instanceof Node &&
        !menuBarRef.current?.contains(
          target,
        )
      ) {
        setProjectMenuOpen(false)
      }
    }

    document.addEventListener(
      'pointerdown',
      handleOutsidePointerDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleOutsidePointerDown,
      )
    }
  }, [projectMenuOpen])

  function runAction(
    action: () => void,
  ) {
    setProjectMenuOpen(false)
    action()
  }

  return (
    <div
      ref={menuBarRef}
      className="menu-bar"
    >
      <div className="menu-group">
        <button
          type="button"
          className="menu-item"
          onClick={() => {
            setProjectMenuOpen(
              (open) => !open,
            )
          }}
        >
          Project
        </button>

        {projectMenuOpen && (
          <div className="dropdown-menu">
            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                runAction(onNewProject)
              }}
            >
              New Project...
            </button>

            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                runAction(onLoadProject)
              }}
            >
              Load Project...
            </button>

            <button
              type="button"
              className="dropdown-item"
              disabled={!projectName}
              onClick={() => {
                runAction(onSaveProject)
              }}
            >
              Save Project
            </button>

            <button
              type="button"
              className="dropdown-item"
              disabled={!projectName}
              onClick={() => {
                runAction(onCloseProject)
              }}
            >
              Close Project
            </button>

            <div className="dropdown-separator" />

            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                runAction(onDeleteProject)
              }}
            >
              Delete Project...
            </button>
          </div>
        )}
      </div>

      {projectName && (
        <div className="menu-project-name">
          {projectName}.proj
        </div>
      )}
    </div>
  )
}