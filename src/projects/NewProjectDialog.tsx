import {
  useState,
} from 'react'

interface NewProjectDialogProps {
  onCreate: (
    name: string,
  ) => Promise<void>

  onCancel: () => void
}

export function NewProjectDialog({
  onCreate,
  onCancel,
}: NewProjectDialogProps) {
  const [
    name,
    setName,
  ] = useState('')

  const [
    creating,
    setCreating,
  ] = useState(false)

  async function handleCreate() {
    const trimmedName =
      name.trim()

    if (
      !trimmedName ||
      creating
    ) {
      return
    }

    setCreating(true)

    try {
      await onCreate(
        trimmedName,
      )
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        <h2>New Project</h2>

        <label className="dialog-field">
          <span>Project Name</span>

          <input
            autoFocus
            value={name}
            onChange={(event) => {
              setName(
                event.target.value,
              )
            }}
            onKeyDown={(event) => {
              if (
                event.key ===
                'Enter'
              ) {
                void handleCreate()
              }
            }}
          />
        </label>

        <div className="dialog-actions">
          <button
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={
              !name.trim() ||
              creating
            }
            onClick={() => {
              void handleCreate()
            }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}