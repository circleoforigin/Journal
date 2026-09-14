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
  onNewJournal: () => void
  onOpenJournal: () => void
  onCloseJournal: () => void
  onDeleteJournal: () => void

  projectName?: string
  hasProject: boolean
  hasJournals: boolean
  hasActiveJournal: boolean
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

  const [
    editMenuOpen,
    setEditMenuOpen,
  ] = useState(false)

  const [
    journalsMenuOpen,
    setJournalsMenuOpen,
    ] = useState(false)

  const anyMenuOpen =
  projectMenuOpen ||
  editMenuOpen ||
  journalsMenuOpen

  useEffect(() => {
    if (!anyMenuOpen) {
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
        closeMenus()
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
  }, [anyMenuOpen])

  function closeMenus() {
    setProjectMenuOpen(false)
    setEditMenuOpen(false)
    setJournalsMenuOpen(false)
  }

  function openProjectMenu() {
    setEditMenuOpen(false)
    setJournalsMenuOpen(false)
    setProjectMenuOpen(
        (open) => !open)
    }

  function openEditMenu() {
    setProjectMenuOpen(false)
    setJournalsMenuOpen(false)
    setEditMenuOpen(
    (open) => !open)
  }  

  function openJournalsMenu() {
    setProjectMenuOpen(false)
    setEditMenuOpen(false)

    setJournalsMenuOpen(
        (open) => !open)
  }

  function runAction(
    action: () => void,
  ) {
    closeMenus()
    action()
  }

  function runEditCommand(
    command: string,
  ) {
    closeMenus()

    document.execCommand(command)
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
          onClick={openProjectMenu}
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

      <div className="menu-group">
        <button
          type="button"
          className="menu-item"
          onClick={openEditMenu}
        >
          Edit
        </button>

        {editMenuOpen && (
          <div className="dropdown-menu">
            <button
              type="button"
              className="dropdown-item"
              onMouseDown={(event) => {
                event.preventDefault()
              }}
              onClick={() => {
                runEditCommand('undo')
              }}
            >
              Undo
            </button>

            <button
              type="button"
              className="dropdown-item"
              onMouseDown={(event) => {
                event.preventDefault()
              }}
              onClick={() => {
                runEditCommand('redo')
              }}
            >
              Redo
            </button>

            <div className="dropdown-separator" />

            <button
              type="button"
              className="dropdown-item"
              onMouseDown={(event) => {
                event.preventDefault()
              }}
              onClick={() => {
                runEditCommand('cut')
              }}
            >
              Cut
            </button>

            <button
              type="button"
              className="dropdown-item"
              onMouseDown={(event) => {
                event.preventDefault()
              }}
              onClick={() => {
                runEditCommand('copy')
              }}
            >
              Copy
            </button>

            <button
              type="button"
              className="dropdown-item"
              onMouseDown={(event) => {
                event.preventDefault()
              }}
              onClick={() => {
                runEditCommand('paste')
              }}
            >
              Paste
            </button>

            <div className="dropdown-separator" />

            <button
              type="button"
              className="dropdown-item"
              onMouseDown={(event) => {
                event.preventDefault()
              }}
              onClick={() => {
                runEditCommand('selectAll')
              }}
            >
              Select All
            </button>
          </div>
        )}
    </div>
    
    <div className="menu-group">
  <button
    type="button"
    className="menu-item"
    onClick={openJournalsMenu}
  >
    Journals
  </button>

  {journalsMenuOpen && (
    <div className="dropdown-menu">
      <button
        type="button"
        className="dropdown-item"
        disabled={!hasProject}
        onClick={() => {
          runAction(onNewJournal)
        }}
      >
        New Journal...
      </button>

      <button
        type="button"
        className="dropdown-item"
        disabled={
          !hasProject ||
          !hasJournals
        }
        onClick={() => {
          runAction(onOpenJournal)
        }}
      >
        Open Journal...
      </button>

      <button
        type="button"
        className="dropdown-item"
        disabled={
          !hasActiveJournal
        }
        onClick={() => {
          runAction(onCloseJournal)
        }}
      >
        Close Journal
      </button>

      <div className="dropdown-separator" />

      <button
        type="button"
        className="dropdown-item"
        disabled={
          !hasProject ||
          !hasJournals
        }
        onClick={() => {
          runAction(onDeleteJournal)
        }}
      >
        Delete Journal...
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