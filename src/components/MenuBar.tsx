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
  onNewBook: () => void
  onOpenBook: () => void
  onCloseBook: () => void
  onDeleteBook: () => void
  onFieldDefinitions: () => void
  onTocStructure: () => void

  projectName?: string
  hasProject: boolean
}

export function MenuBar({
  onNewProject,
  onLoadProject,
  onSaveProject,
  onCloseProject,
  onDeleteProject,
  onFieldDefinitions,
  onTocStructure,

  onNewBook,
  onOpenBook,
  onCloseBook,
  onDeleteBook,

  projectName,
  hasProject,
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
    booksMenuOpen,
    setBooksMenuOpen,
    ] = useState(false)

  const [
    structureMenuOpen,
    setStructureMenuOpen,
    ] = useState(false)

  const anyMenuOpen =
    projectMenuOpen ||
    editMenuOpen ||
    booksMenuOpen ||
    structureMenuOpen

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
    setBooksMenuOpen(false)
    setStructureMenuOpen(false)
  }

  function openProjectMenu() {
    setEditMenuOpen(false)
    setBooksMenuOpen(false)
    setStructureMenuOpen(false)
    setProjectMenuOpen(
        (open) => !open)
    }

  function openEditMenu() {
    setProjectMenuOpen(false)
    setBooksMenuOpen(false)
    setStructureMenuOpen(false)
    setEditMenuOpen(
    (open) => !open)
  }  

  function openBooksMenu() {
    setProjectMenuOpen(false)
    setEditMenuOpen(false)
    setStructureMenuOpen(false)
    setBooksMenuOpen(
        (open) => !open)
  }

  function openStructureMenu() {
    setProjectMenuOpen(false)
    setEditMenuOpen(false)
    setBooksMenuOpen(false)
    setStructureMenuOpen(
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
    onClick={openBooksMenu}
  >
    Books
  </button>

  {booksMenuOpen && (
    <div className="dropdown-menu">
      <button
        type="button"
        className="dropdown-item"
        disabled={!hasProject}
        onClick={() => {
          runAction(onNewBook)
        }}
      >
        New Book...
      </button>

      <button
        type="button"
        className="dropdown-item"
        disabled={!hasProject}
        onClick={() => {
          runAction(onOpenBook)
        }}
      >
        Open Book...
      </button>

      <button
        type="button"
        className="dropdown-item"
        disabled
        onClick={() => {
          runAction(onCloseBook)
        }}
      >
        Close Book
      </button>

      <div className="dropdown-separator" />

      <button
        type="button"
        className="dropdown-item"
        disabled={!hasProject}
        onClick={() => {
          runAction(onDeleteBook)
        }}
      >
        Delete Book...
      </button>
    </div>
  )}
</div>

<div className="menu-group">
  <button
    type="button"
    className="menu-item"
    onClick={openStructureMenu}
  >
    Structure
  </button>

  {structureMenuOpen && (
    <div className="dropdown-menu">
      <button
        type="button"
        className="dropdown-item"
        disabled={!hasProject}
        onClick={() => {
          runAction(
            onFieldDefinitions,
          )
        }}
      >
        Field Definitions...
      </button>

      <button
        type="button"
        className="dropdown-item"
        disabled={!hasProject}
        onClick={() => {
          runAction(
            onTocStructure,
          )
        }}
      >
        Table of Contents...
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